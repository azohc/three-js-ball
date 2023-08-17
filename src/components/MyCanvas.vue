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
  PMREMGenerator,
  FrontSide,
  Scene,
  Material,
  CubicBezierCurve3
} from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { Water } from 'three/addons/objects/Water.js'
import { Sky } from 'three/addons/objects/Sky.js'

import { gsap, Power3 } from 'gsap'
import { MotionPathPlugin } from 'gsap/MotionPathPlugin'

import Lenis from '@studio-freight/lenis'

import GUI from 'lil-gui'
import Stats from 'stats.js'

const canvasRef = ref<HTMLCanvasElement>()

const lenis = new Lenis()
const animatedScroll = ref(0)
const progress = ref(0)

gsap.registerPlugin(MotionPathPlugin)

// THREE
let renderer: WebGLRenderer | null = null
let camera: Camera | null = null
let scene = new Scene()

const textureLoader = new TextureLoader()
const gltfLoader = new GLTFLoader()
const clock = new Clock()

let ballMesh: Mesh | null = null
const ballMeshMaterials: Material[] = []

let water: Water | null = null
let sun: Vector3 | null = null

// DEBUG
const gui = new GUI()
const stats = new Stats()

onMounted(async () => {
  const canvas = canvasRef.value
  if (!canvas) return
  init(canvas)
  initScene()
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

const initScene = () => {
  // Mesh
  addBall()
  // Environment
  addEnvironment()
}

const initGUI = ({ closed }: { closed: boolean }) => {
  const initCameraGUI = (camera: Camera) => {
    const cameraFolder = gui.addFolder('camera')
    cameraFolder.add(camera.position, 'x', -10, 10),
      cameraFolder.add(camera.position, 'y', -10, 10),
      cameraFolder.add(camera.position, 'z', -10, 10)
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
  }

  renderer && initRendererGUI(renderer)
  closed && gui.close()
}

const initStats = () => {
  stats.showPanel(0)
  document.body.appendChild(stats.dom)
}

// ANIMATION
const animate = (timestamp: number) => {
  stats.begin()
  lenis.raf(timestamp)
  const dt = clock.getDelta()

  ballMesh && spinBallWithScroll(ballMesh as Mesh, dt)

  // if (water) water.material.uniforms['time'].value += 1.0 / 60.0
  if (water) water.material.uniforms['time'].value += 1.0 / 120.0

  renderer && camera && renderer.render(scene, camera)
  stats.end()
  requestAnimationFrame(animate)
}

const spinBallWithScroll = (ball: Mesh, delta: number) => {
  const maxSpinSpeed = 7 * delta
  ball.rotateZ(progress.value * maxSpinSpeed)
}

// SCROLL
lenis.on('scroll', (event: any) => {
  animatedScroll.value = event.animatedScroll
  progress.value = event.progress
})

const addBall = () => {
  new Promise<void>(fadeSceneIn)
    .then(loadBallMeshPromise)
    .then(() => scene.add(ballMesh!))
    .then(() => {
      fadeBallIn()
      panCameraToBall()
      bumpLightsUp()
    })
    .catch(console.error)
}

const fadeSceneIn = (resolve: () => void) => {
  gsap.to(renderer, {
    toneMappingExposure: 0.22,
    duration: 3.3,
    ease: Power3.easeIn,
    onComplete: resolve
  })
}

const fadeBallIn = () =>
  ballMeshMaterials.forEach((material) => {
    gsap.to(material, { opacity: 1, ease: Power3.easeIn, duration: 5 })
  })

const panCameraToBall = () => {
  const v0 = new Vector3(-3, 10, 0)
  // new Vector3(-2, 8, 3),
  const v1 = new Vector3(-1.5, 5, 5)
  // new Vector3(0.5, 4.5, 5),
  const v2 = new Vector3(1, 3.5, 3.5)
  // new Vector3(2, 3, 2.5),
  const v3 = new Vector3(1.5, 1, 1)

  gsap.to(camera!.position, {
    duration: 10,
    ease: Power3.easeInOut,
    onUpdate: () => camera!.lookAt(ballMesh!.position),
    motionPath: {
      path: new CubicBezierCurve3(v0, v1, v2, v3).getPoints(500)
    }
  })
}

const bumpLightsUp = () => {
  gsap.to(renderer, { toneMappingExposure: 0.5, duration: 10, ease: Power3.easeIn })
}

const loadBallMeshPromise = async () =>
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
              material.side = FrontSide
              material.transparent = true
              material.opacity = 0
              ballMeshMaterials.push(material)
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

const addEnvironment = () => {
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
</script>

<template>
  <canvas id="canvas" ref="canvasRef" />
</template>

<style scoped>
canvas#canvas {
  position: fixed;
}
</style>
