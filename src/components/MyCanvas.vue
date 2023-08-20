<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useResizeObserver } from '@vueuse/core'

import {
  PerspectiveCamera,
  WebGLRenderer,
  Vector3,
  SRGBColorSpace,
  ACESFilmicToneMapping,
  Scene,
  PointLight,
  Raycaster,
  Vector2
} from 'three'
import { Water } from 'three/addons/objects/Water.js'

import Lenis from '@studio-freight/lenis'

import TitleComponent from './TitleComponent.vue'
import { beginStats, destroyDebugTools, endStats, initGUI, initStats } from '@/lib/debugUtils'
import { useAnimationStore } from '@/stores/animation'
import { syncBallElevationWithCamera, panCameraToBall } from '@/lib/cameraAnimations'
import {
  syncPatchDetach,
  syncCoreLight,
  initCoreLightIntensityTween,
  fadeSceneIn,
  fadeBallIn,
  bumpLightsUp,
  rotateBallOnDrag
} from '@/lib/objectAnimations'
import {
  fadeScrollHintsOut,
  fadeScrollHintsIn,
  initScrollHintTween,
  fadeTitleIn
} from '@/lib/uiAnimations'
import { initBall, initEnvironment, initCoreLight } from '@/lib/sceneSetup'
import type { Ball } from '@/types'

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

const ball: Ball = { materials: [], detachablePatchMeshes: [] }

let water: Water | null = null
const coreLight = ref<PointLight>()

onMounted(async () => {
  const canvas = canvasRef.value
  if (!canvas) return

  init(canvas)
  await initScene()
  initAnimations()

  initGUI(camera!, renderer!, { closed: true })
  initStats()

  triggerAnimations()
  requestAnimationFrame(animate)
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
  water = initEnvironment(renderer!, scene)
  initCoreLight(scene, coreLight)
  await initBall(scene, ball)
  camera?.lookAt(ball.mesh!.position)
}

const animate = (timestamp: number) => {
  beginStats()
  lenis.raf(timestamp)

  ball.mesh!.rotateZ(animated.targetBallSpin)

  // if (water) water.material.uniforms['time'].value += 1.0 / 60.0
  if (water) water.material.uniforms['time'].value += 1.0 / 120.0

  renderer && camera && renderer.render(scene, camera)
  endStats()
  requestAnimationFrame(animate)
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
    animated.title.blur = Math.min(44 * scrollProgress, 5)
    animated.title.brightness = Math.max(1 - 4.4 * scrollProgress, 0.3)
  }

  const SPIN_FACTOR = 0.01
  animated.targetBallSpin = event.velocity * SPIN_FACTOR

  if (firstCameraPanDone && ball.detachablePatchMeshes?.length) {
    syncPatchDetach(ball.detachablePatchMeshes, scrollProgress)
    syncBallElevationWithCamera(ball.mesh!, camera!, scrollProgress)
    syncCoreLight(coreLight.value!, ball.mesh!, scrollProgress)
  }
})

const initAnimations = () => {
  initCoreLightIntensityTween(coreLight.value!)
  initScrollHintTween()
}

const triggerAnimations = async () => {
  lenis.scrollTo(0)
  lenis.isLocked = true
  fadeSceneIn(renderer!)

  await new Promise((resolve) => setTimeout(resolve, 3300))
  fadeBallIn(ball.materials!)

  await new Promise((resolve) => setTimeout(resolve, 1000))
  panCameraToBall(camera!, ball.mesh!, () => {
    firstCameraPanDone = true
    lenis.isLocked = false
  })
  bumpLightsUp(renderer!)
  fadeTitleIn(() => {
    lenis.progress === 0 && fadeScrollHintsIn()
  })
}

function onMouseDown(event: MouseEvent) {
  isBallClick = false

  mouse.x = (event.clientX / window.innerWidth) * 2 - 1
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1

  raycaster.setFromCamera(mouse, camera!)
  const intersects = raycaster.intersectObject(ball.mesh!)

  if (intersects.length > 0) {
    isBallClick = true
    lastMousePos.set(event.clientX, event.clientY)
  }
}

function onMouseMove(event: MouseEvent) {
  if (!isBallClick) return

  const dx = event.clientX - lastMousePos.x
  const dy = event.clientY - lastMousePos.y

  rotateBallOnDrag(ball.mesh!, dx, dy)

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
