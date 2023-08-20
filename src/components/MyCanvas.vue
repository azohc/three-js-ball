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
  Raycaster
} from 'three'
import { Water } from 'three/addons/objects/Water.js'
import Lenis from '@studio-freight/lenis'
import { initBall, initEnvironment, initCoreLight } from '@/lib/sceneSetup'
import { useAnimationStore } from '@/stores/useAnimation'
import { firstCameraPanDone, panCameraToBall } from '@/lib/animation/camera'
import {
  initCoreLightIntensityTween,
  fadeSceneIn,
  fadeBallIn,
  bumpLightsUp,
  updateMomentum
} from '@/lib/animation/objects'
import { fadeScrollHintsIn, initScrollHintTween, fadeTitleIn } from '@/lib/animation/ui'
import { onMouseDown, onMouseMove, onMouseUp } from '@/lib/events/mouse'
import { onScroll } from '@/lib/events/scroll'
import { beginStats, destroyDebugTools, endStats, initGUI, initStats } from '@/lib/debugUtils'
import TitleComponent from './TitleComponent.vue'
import type { Ball } from '@/types'

const canvasRef = ref<HTMLCanvasElement>()

const lenis = new Lenis()

const animated = useAnimationStore()

let renderer: WebGLRenderer | null = null
let camera: PerspectiveCamera | null = null
let scene = new Scene()

const raycaster = new Raycaster()

const ball: Ball = { materials: [], detachablePatchMeshes: [] }

let water: Water | null = null
const coreLight = ref<PointLight>()

onMounted(async () => {
  const canvas = canvasRef.value
  if (!canvas) return

  init(canvas)
  await initScene()
  initAnimations()
  initLenisScroll()

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

  updateMomentum(ball.mesh!)

  // if (water) water.material.uniforms['time'].value += 1.0 / 60.0
  if (water) water.material.uniforms['time'].value += 1.0 / 120.0

  renderer && camera && renderer.render(scene, camera)
  endStats()
  requestAnimationFrame(animate)
}

const initAnimations = () => {
  initCoreLightIntensityTween(coreLight.value!)
  initScrollHintTween()
}

const initLenisScroll = () => {
  lenis.scrollTo(0)
  lenis.isLocked = true
  lenis.on('scroll', (event: any) => onScroll(event, camera!, ball, coreLight.value!))
}

const triggerAnimations = async () => {
  fadeSceneIn(renderer!)

  await new Promise((resolve) => setTimeout(resolve, 3300))
  fadeBallIn(ball.materials!)

  await new Promise((resolve) => setTimeout(resolve, 1000))
  panCameraToBall(camera!, ball.mesh!, () => {
    firstCameraPanDone.value = true
    lenis.isLocked = false
  })
  bumpLightsUp(renderer!)
  fadeTitleIn(() => {
    lenis.progress === 0 && fadeScrollHintsIn()
  })
}
</script>

<template>
  <TitleComponent />
  <canvas
    id="canvas"
    ref="canvasRef"
    @mousedown.left="(e) => onMouseDown(e, ball, raycaster, camera!)"
    @mouseup.left="onMouseUp"
    @mousemove="(e) => onMouseMove(e, ball)"
  />
</template>

<style scoped>
canvas#canvas {
  position: fixed;
  top: 0;
}
</style>
