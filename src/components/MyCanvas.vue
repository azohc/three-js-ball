<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useResizeObserver } from '@vueuse/core'

import {
  PerspectiveCamera,
  WebGLRenderer,
  Vector3,
  Mesh,
  SRGBColorSpace,
  MeshBasicMaterial,
  ACESFilmicToneMapping,
  Object3D,
  RGBAFormat,
  UnsignedByteType,
  PlaneGeometry,
  TextureLoader,
  RepeatWrapping,
  MathUtils,
  PMREMGenerator,
  Scene,
  Material,
  PointLight,
  Raycaster,
  Vector2,
  Quaternion
} from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { Water } from 'three/addons/objects/Water.js'
import { Sky } from 'three/addons/objects/Sky.js'

import Lenis from '@studio-freight/lenis'

import TitleComponent from './TitleComponent.vue'
import { destroyDebugTools, initGUI, initStats } from '@/lib/debugUtils'
import {
  animate,
  fadeSceneIn,
  fadeBallIn,
  panCameraToBall,
  bumpLightsUp,
  fadeTitleIn,
  initScrollHintTween,
  fadeScrollHintsIn,
  fadeScrollHintsOut,
  syncPatchDetach,
  syncBallElevationWithCamera,
  initCoreLightIntensityTween,
  syncCoreLight
} from '@/lib/animation'
import { useAnimationStore } from '@/stores/animation'

let firstCameraPanDone = false

const canvasRef = ref<HTMLCanvasElement>()

const lenis = new Lenis()

const animated = useAnimationStore()

// THREE
let renderer: WebGLRenderer | null = null
let camera: PerspectiveCamera | null = null
let scene = new Scene()

const raycaster = new Raycaster()
const mouse = new Vector2()
let isBallClick = false
let lastMousePos = new Vector2()

const textureLoader = new TextureLoader()
const gltfLoader = new GLTFLoader()

let ballMesh: Mesh | null = null
const ballMeshMaterials: Material[] = []
const detachablePatchMeshes: Mesh[] = []

let water: Water | null = null
let sun: Vector3 | null = null

let coreLight: PointLight | null = null

onMounted(async () => {
  const canvas = canvasRef.value
  if (!canvas) return

  init(canvas)
  await initScene()
  initAnimations()

  initGUI(camera!, renderer!, { closed: true })
  initStats()

  triggerAnimations()
  requestAnimationFrame(() => animate(renderer!, scene, camera!, ballMesh!, water!, lenis))
})

onUnmounted(() => {
  destroyDebugTools()
})

useResizeObserver(document.documentElement, () => {
  const w = window.innerWidth
  const h = window.innerHeight
  const aspectRatio = w / h

  camera!.aspect = aspectRatio
  camera!.updateProjectionMatrix()
  renderer && renderer.setSize(w, h)
})

const init = (canvas: HTMLCanvasElement) => {
  renderer = new WebGLRenderer({
    canvas: canvas,
    antialias: true
  })

  const w = window.innerWidth,
    h = window.innerHeight

  renderer.setSize(w, h)
  renderer.outputColorSpace = SRGBColorSpace
  renderer.toneMapping = ACESFilmicToneMapping
  renderer.toneMappingExposure = 0
  renderer.setPixelRatio(window.devicePixelRatio)

  const fov = 90
  const aspectRatio = w / h
  const near = 0.1
  const far = 1000

  camera = new PerspectiveCamera(fov, aspectRatio, near, far)
  camera.position.set(-3, 10, 0)
  camera.lookAt(new Vector3(0, 1, 0))

  scene = new Scene()
}

const initScene = async () => {
  addEnvironment()
  addCoreLight()
  await addBall()
}

// SCROLL
lenis.on('scroll', (event: any) => {
  const { progress: scrollProgress } = event
  if (scrollProgress > 0) {
    fadeScrollHintsOut()
  } else if (firstCameraPanDone && scrollProgress === 0) {
    fadeScrollHintsIn()
  }

  if (scrollProgress <= 0.1) {
    animated.titleBlur = Math.min(44 * scrollProgress, 5)
    animated.titleBrightness = Math.max(1 - 4.4 * scrollProgress, 0.3)
  }

  const SPIN_FACTOR = 0.01
  animated.targetBallSpin = event.velocity * SPIN_FACTOR

  if (firstCameraPanDone && detachablePatchMeshes.length) {
    syncPatchDetach(detachablePatchMeshes, scrollProgress)
    syncBallElevationWithCamera(ballMesh!, camera!, scrollProgress)
    syncCoreLight(coreLight!, ballMesh!, scrollProgress)
  }
})

const addCoreLight = () => {
  coreLight = new PointLight(0xb9973f, 0, 0, 10)
  coreLight.castShadow = true
  scene.add(coreLight)
}

const addBall = async () => {
  try {
    await loadBallMeshPromise()
    scene.add(ballMesh!)
  } catch (error) {
    console.error(error)
  }
}

const initAnimations = () => {
  initCoreLightIntensityTween(coreLight!)
  initScrollHintTween()
}

const triggerAnimations = async () => {
  lenis.scrollTo(0)
  lenis.isLocked = true
  fadeSceneIn(renderer!)

  await new Promise((resolve) => setTimeout(resolve, 3300))
  fadeBallIn(ballMeshMaterials)

  await new Promise((resolve) => setTimeout(resolve, 1000))
  panCameraToBall(camera!, ballMesh!, () => {
    firstCameraPanDone = true
    lenis.isLocked = false
  })
  bumpLightsUp(renderer!)
  fadeTitleIn(() => {
    lenis.progress === 0 && fadeScrollHintsIn()
  })
}

const loadBallMeshPromise = async () =>
  new Promise<void>((resolve, reject) => {
    gltfLoader.load(
      /**
       * ball model optimized with gltf.report's simple_pipeline.js script:
       *  -> remove duplicate vertex or texture data, if any.
       *  -> losslessly resample animation frames.
       *  -> remove unused nodes, textures, or other data.
       *  -> resize all textures to ≤2k.
       */
      'ball_optimized.glb',
      (gltf) => {
        const uuid = gltf.scene.uuid
        scene.add(gltf.scene)
        const ballGroup = scene.children.find((c) => c.uuid === uuid)
        if (ballGroup) {
          ballMesh = ballGroup.children[0] as Mesh
          const applyColorSpace = (object: Object3D) => {
            if (object.type === 'Mesh') {
              const material = (object as Mesh).material as MeshBasicMaterial
              if (material.map) {
                material.map.format = RGBAFormat
                material.map.type = UnsignedByteType
                material.map.colorSpace = SRGBColorSpace
              }
              material.transparent = true
              material.opacity = 0
              ballMeshMaterials.push(material)
            }
            if (object.children && object.children.length > 0) {
              object.children.forEach(applyColorSpace)
            }
          }
          applyColorSpace(ballMesh)

          ballMesh.children[0].children.forEach(
            (o3d, i) => i > 0 && detachablePatchMeshes.push(o3d as Mesh)
          )

          ballMesh.position.y = 1
          camera?.lookAt(ballMesh.position)
          resolve()
        }
      },
      undefined,
      reject
    )
  })

const addEnvironment = () => {
  sun = new Vector3()
  water = new Water(new PlaneGeometry(10000, 10000), {
    textureWidth: 512,
    textureHeight: 512,
    waterNormals: textureLoader.load('waternormals.jpg', function (texture) {
      texture.wrapS = texture.wrapT = RepeatWrapping
    }),
    sunDirection: new Vector3(),
    sunColor: 0xf7cd5d,
    waterColor: 0x001e0f,
    distortionScale: 3.7,
    fog: scene.fog !== undefined
  })
  water.rotation.x = -Math.PI / 2
  scene.add(water)

  // Skybox
  const sky = new Sky()
  sky.scale.setScalar(10000)
  scene.add(sky)

  const skyUniforms = sky.material.uniforms

  skyUniforms['turbidity'].value = 10
  skyUniforms['rayleigh'].value = 2
  skyUniforms['mieCoefficient'].value = 0.005
  skyUniforms['mieDirectionalG'].value = 0.8

  const elevation = 0.5
  const azimuth = 180

  const pmremGenerator = new PMREMGenerator(renderer!)

  const phi = MathUtils.degToRad(90 - elevation)
  const theta = MathUtils.degToRad(azimuth)

  sun.setFromSphericalCoords(1, phi, theta)

  sky.material.uniforms['sunPosition'].value.copy(sun)
  water.material.uniforms['sunDirection'].value.copy(sun).normalize()

  const skyScene = new Scene()
  skyScene.add(sky)
  const renderTarget = pmremGenerator.fromScene(skyScene)
  scene.environment = renderTarget.texture
  scene.background = renderTarget.texture
}

function onMouseDown(event: MouseEvent) {
  isBallClick = false

  mouse.x = (event.clientX / window.innerWidth) * 2 - 1
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1

  raycaster.setFromCamera(mouse, camera!)
  const intersects = raycaster.intersectObject(ballMesh!)

  if (intersects.length > 0) {
    isBallClick = true
    lastMousePos.set(event.clientX, event.clientY)
  }
}

function onMouseMove(event: MouseEvent) {
  if (!isBallClick) return

  const dx = event.clientX - lastMousePos.x
  const dy = event.clientY - lastMousePos.y

  let rotationQuaternion = new Quaternion()
  let axis = new Vector3()
  const intensity = 0.01

  axis.set(0, 0, 1).normalize()
  rotationQuaternion.setFromAxisAngle(new Vector3(0, 0, 1), dx * intensity)
  ballMesh!.quaternion.multiply(rotationQuaternion)

  rotationQuaternion.setFromAxisAngle(new Vector3(1, 0, 0), -dy * intensity)
  ballMesh!.quaternion.multiply(rotationQuaternion)

  lastMousePos.set(event.clientX, event.clientY)
}

function onMouseUp() {
  isBallClick = false
}
</script>

<template>
  <TitleComponent />
  <canvas
    id="canvas"
    ref="canvasRef"
    @mousedown.left="onMouseDown"
    @mouseup.left="onMouseUp"
    @mousemove="onMouseMove"
  />
</template>

<style scoped>
canvas#canvas {
  position: fixed;
  top: 0;
}
</style>
