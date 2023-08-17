<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useResizeObserver } from '@vueuse/core'

import {
  PerspectiveCamera,
  WebGLRenderer,
  Camera,
  Vector3,
  Mesh,
  Clock,
  SRGBColorSpace,
  MeshBasicMaterial,
  CineonToneMapping,
  ACESFilmicToneMapping,
  LinearToneMapping,
  NoToneMapping,
  ReinhardToneMapping,
  Object3D,
  RGBAFormat,
  UnsignedByteType,
  PlaneGeometry,
  TextureLoader,
  RepeatWrapping,
  MathUtils,
  PMREMGenerator
} from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { Water } from 'three/addons/objects/Water.js'
import { Sky } from 'three/addons/objects/Sky.js'

import { Scene } from 'three'

import Lenis from '@studio-freight/lenis'

import GUI from 'lil-gui'
import Stats from 'stats.js'

const canvasRef = ref<HTMLCanvasElement>()

const lenis = new Lenis()
const animatedScroll = ref(0)
const progress = ref(0)

let water: Water | null = null
let sun: Vector3 | null = null

///// TODOS
// update FOV to match HTML pixels: in init() an onResize
// add antialiasing

// THREE
let renderer: WebGLRenderer | null = null
let camera: Camera | null = null
let scene = new Scene()
let ballMesh: Mesh | null = null
let controls: OrbitControls | null = null
const textureLoader = new TextureLoader()
const gltfLoader = new GLTFLoader()
const clock = new Clock()

// DEBUG
const gui = new GUI()
const stats = new Stats()

onMounted(async () => {
  const canvas = canvasRef.value
  if (!canvas) return
  init(canvas)
  await initScene()
  initAnimation()
  initGUI({ closed: true })
  initStats()
  requestAnimationFrame(animate)
})

useResizeObserver(document.documentElement, () => {
  const w = window.innerWidth
  const h = window.innerHeight
  const aspectRatio = w / h

  const pcamera = camera as PerspectiveCamera
  pcamera.aspect = aspectRatio
  pcamera.updateProjectionMatrix()
  renderer && renderer.setSize(w, h)
})

const init = (canvas: HTMLCanvasElement) => {
  renderer = new WebGLRenderer({
    canvas: canvas
  })

  const w = window.innerWidth,
    h = window.innerHeight

  renderer.setSize(w, h)
  renderer.outputColorSpace = SRGBColorSpace
  renderer.toneMapping = ACESFilmicToneMapping
  renderer.toneMappingExposure = 0.3

  const fov = 90
  const aspectRatio = w / h
  const near = 0.5
  const far = 1000

  camera = new PerspectiveCamera(fov, aspectRatio, near, far)
  camera.position.set(2, 2, 1)

  controls = new OrbitControls(camera, renderer.domElement)
  controls.maxPolarAngle = Math.PI * 0.495
  controls.target.set(0, 1, 0)
  controls.minDistance = 2.0
  controls.maxDistance = 10.0
  controls.update()

  scene = new Scene()
}

const initScene = async () => {
  // Meshes
  await addBall()

  sun = new Vector3()
  water = new Water(new PlaneGeometry(10000, 10000), {
    textureWidth: 512,
    textureHeight: 512,
    waterNormals: textureLoader.load('waternormals.jpg', function (texture) {
      texture.wrapS = texture.wrapT = RepeatWrapping
    }),
    sunDirection: new Vector3(),
    sunColor: 0xffffff,
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
  let renderTarget

  const phi = MathUtils.degToRad(90 - elevation)
  const theta = MathUtils.degToRad(azimuth)

  sun.setFromSphericalCoords(1, phi, theta)

  sky.material.uniforms['sunPosition'].value.copy(sun)
  water.material.uniforms['sunDirection'].value.copy(sun).normalize()

  const skyScene = new Scene()
  skyScene.add(sky)
  renderTarget = pmremGenerator.fromScene(skyScene)
  scene.environment = renderTarget.texture
  scene.background = renderTarget.texture
}

const initAnimation = () => {}

const initGUI = ({ closed }: { closed: boolean }) => {
  const initCameraGUI = (camera: Camera) => {
    const cameraFolder = gui.addFolder('camera')
    cameraFolder.add(camera.position, 'x', -10, 10).onChange(() => {
      controls?.update()
    })
    cameraFolder.add(camera.position, 'y', -10, 10).onChange(() => {
      controls?.update()
    })
    cameraFolder.add(camera.position, 'z', -10, 10).onChange(() => {
      controls?.update()
    })
  }

  camera && initCameraGUI(camera)

  const initRendererGUI = (renderer: WebGLRenderer) => {
    const rendererFolder = gui.addFolder('renderer')
    rendererFolder.add(renderer, 'toneMapping', {
      none: NoToneMapping,
      linear: LinearToneMapping,
      reinhard: ReinhardToneMapping,
      cineon: CineonToneMapping,
      acesfilmic: ACESFilmicToneMapping
    })
    rendererFolder.add(renderer, 'toneMappingExposure', 0, 5, 0.1)
    // rendererFolder.add(renderer, 'useLegacyLights')
  }

  renderer && initRendererGUI(renderer)
  closed && gui.close()
}

const initStats = () => {
  stats.showPanel(0)
  document.body.appendChild(stats.dom)
}

const addBall = async () => {
  const loadBallMesh = async () =>
    new Promise<void>((resolve, reject) => {
      gltfLoader.load(
        'ball.glb',
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
              }
              if (object.children && object.children.length > 0) {
                object.children.forEach(applyColorSpace)
              }
            }
            applyColorSpace(ballMesh)

            ballMesh.position.y = 1

            camera?.lookAt(ballMesh.position)
            resolve()
          }
        },
        undefined,
        reject
      )
    })

  try {
    await loadBallMesh()
  } catch (e) {
    console.error(e)
  }
  ballMesh && scene.add(ballMesh)
}

lenis.on('scroll', (event: any) => {
  animatedScroll.value = event.animatedScroll
  progress.value = event.progress
})

const animate = (timestamp: number) => {
  stats.begin()
  lenis.raf(timestamp)
  const dt = clock.getDelta()

  ballMesh && animateBall(ballMesh as Mesh, dt)

  if (water) water.material.uniforms['time'].value += 1.0 / 60.0

  renderer && camera && renderer.render(scene, camera)
  stats.end()
  requestAnimationFrame(animate)
}

const animateBall = (ball: Mesh, delta: number) => {
  const maxSpinSpeed = 7 * delta
  ball.rotateZ(progress.value * maxSpinSpeed)
}
</script>

<template>
  <canvas id="canvas" ref="canvasRef" />
</template>

<style scoped>
canvas#canvas {
  position: fixed;
}
</style>
