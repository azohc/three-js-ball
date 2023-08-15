<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useResizeObserver } from '@vueuse/core'

import {
  PerspectiveCamera,
  WebGLRenderer,
  Camera,
  Vector3,
  Object3D,
  DirectionalLightHelper,
  DirectionalLight,
  PointLight,
  PointLightHelper,
  Mesh,
  Clock,
  QuadraticBezierCurve3
} from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { Scene } from 'three'

import Lenis from '@studio-freight/lenis'
import gsap from 'gsap'
import { Power3 } from 'gsap'

import GUI from 'lil-gui'
import Stats from 'stats.js'

const canvasRef = ref<HTMLCanvasElement>()

const lenis = new Lenis()
const animatedScroll = ref(0)
const progress = ref(0)
let cameraAnimation: gsap.core.Tween | null = null
let pointLightAnimation: gsap.core.Tween | null = null

// THREE
let renderer: WebGLRenderer | null = null
let camera: Camera | null = null
let scene = new Scene()
let ballMesh: Object3D | null = null
const gltfLoader = new GLTFLoader()
const clock = new Clock()
const initCameraPosition = new Vector3(0, 15, 10)
let pointLight: PointLight | null = null

// DEBUG
const gui = new GUI()
const stats = new Stats()

onMounted(() => {
  const canvas = canvasRef.value
  if (!canvas) return
  init(canvas)
  initScene()
  initAnimation()
  initGUI({ closed: true })
  initStats()
  start()
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
    // alpha: true
  })

  const w = window.innerWidth,
    h = window.innerHeight

  renderer.setSize(w, h)

  const fov = 90
  const aspectRatio = w / h
  const near = 0.01
  const far = 111

  camera = new PerspectiveCamera(fov, aspectRatio, near, far)
  camera.position.copy(initCameraPosition)

  scene = new Scene()
}

const initScene = () => {
  const showHelper = false
  const addToGUI = true

  // Meshes
  addBall()

  // Lights
  const dl = new DirectionalLight(0xffb703, 0.05)
  dl.position.copy(new Vector3(0, 11, 1.1))
  scene.add(dl)
  const dlh = new DirectionalLightHelper(dl)
  showHelper && scene.add(dlh)

  if (addToGUI) {
    const directionalLightFolder = gui.addFolder('directional light')
    directionalLightFolder.add(dl, 'intensity', 0, 0.1, 0.01)
    directionalLightFolder.add(dl.position, 'x', -10, 10)
    directionalLightFolder.add(dl.position, 'y', -10, 10)
    directionalLightFolder.add(dl.position, 'z', -10, 10)
  }

  pointLight = new PointLight(0xffb703, 1, 0, 0.5)
  pointLight.position.copy(new Vector3(0, 11, 1.1))
  scene.add(pointLight)
  const plh = new PointLightHelper(pointLight)
  showHelper && scene.add(plh)

  if (addToGUI) {
    const pointLightFolder = gui.addFolder('point light')
    pointLightFolder.add(pointLight, 'intensity', 0, 30, 1)
    pointLightFolder.add(pointLight, 'distance', 0, 30, 1)
    pointLightFolder.add(pointLight, 'decay', 0, 2, 0.1)
    pointLightFolder.add(pointLight.position, 'x', -10, 10)
    pointLightFolder.add(pointLight.position, 'y', -10, 10)
    pointLightFolder.add(pointLight.position, 'z', -10, 10)
  }
}

const initAnimation = () => {
  if (camera) {
    const v0 = initCameraPosition
    const v1 = new Vector3(0, 13, 5.5)
    const v2 = new Vector3(0, 2, 1)

    const curve = new QuadraticBezierCurve3(v0, v1, v2)
    const keyframes = curve.getPoints(50)

    cameraAnimation = gsap.fromTo(camera.position, v0, { ...v2, keyframes })
    cameraAnimation.pause()
  }

  if (pointLight) {
    pointLightAnimation = gsap.fromTo(pointLight, { intensity: 0 }, { intensity: 1 })
    pointLightAnimation.pause()
  }
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
            ballMesh = ballGroup.children[0]
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

const start = () => {
  requestAnimationFrame(loop)
}

const loop = (timestamp: number) => {
  stats.begin()
  lenis.raf(timestamp)
  const dt = clock.getDelta()

  ballMesh && animateBall(ballMesh as Mesh, dt)
  cameraAnimation?.progress(progress.value)
  pointLightAnimation?.progress(progress.value)

  renderer && camera && renderer.render(scene, camera)
  stats.end()
  requestAnimationFrame(loop)
}

const animateBall = (ball: Mesh, delta: number) => {
  const maxSpinSpeed = 10 * delta
  ball.rotateZ(progress.value * maxSpinSpeed)
}

const initGUI = ({ closed }: { closed: boolean }) => {
  const initCameraGUI = (camera: Camera) => {
    const cameraFolder = gui.addFolder('camera')
    cameraFolder.add(camera.position, 'x', -10, 10)
    cameraFolder.add(camera.position, 'y', -10, 10)
    cameraFolder.add(camera.position, 'z', -10, 10)
  }

  camera && initCameraGUI(camera)

  closed && gui.close()
}

const initStats = () => {
  stats.showPanel(0)
  document.body.appendChild(stats.dom)
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
