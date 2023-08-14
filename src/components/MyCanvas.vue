<script setup lang="ts">
import { onMounted, ref } from 'vue'
import {
  PerspectiveCamera,
  WebGLRenderer,
  Camera,
  BoxGeometry,
  Mesh,
  MeshStandardMaterial,
  Vector3
} from 'three'
import { Scene } from 'three'
import GUI from 'lil-gui'
import { addDirectionalLight, addPointLight } from '../utils/lights'

const canvasRef = ref<HTMLCanvasElement>()

// THREE
let renderer: WebGLRenderer | null = null
let camera: Camera | null = null
let scene = new Scene()

// DEBUG
const gui = new GUI()

onMounted(() => {
  const canvas = canvasRef.value
  if (!canvas) return
  init(canvas)
  initScene()
  initGUI()
  start()
})

const init = (canvas: HTMLCanvasElement) => {
  renderer = new WebGLRenderer({
    canvas: canvas
    // alpha: true,
  })

  const w = window.innerWidth,
    h = window.innerHeight

  renderer.setSize(w, h)

  const fov = 90
  const aspectRatio = w / h
  const near = 0.01
  const far = 111

  camera = new PerspectiveCamera(fov, aspectRatio, near, far)
  camera.position.set(0, 3, 9)

  scene = new Scene()
}

const initScene = () => {
  const showHelper = false
  scene.add(createBoxMesh())
  addDirectionalLight(0xffb703, 0.1, new Vector3(0, 11, 1.1), scene, showHelper, gui)
  addPointLight(0xffb703, 6.6, 11, new Vector3(3, 6, 5), scene, showHelper, gui)
}

const createBoxMesh = () => {
  const box = new BoxGeometry(3, 3, 3)
  const material = new MeshStandardMaterial()
  const mesh = new Mesh(box, material)
  return mesh
}

const start = () => {
  requestAnimationFrame(loop)
}

const loop = () => {
  // TODO begin stats

  renderer && camera && renderer.render(scene, camera)

  // end stats
  requestAnimationFrame(loop)
}

const initGUI = () => {
  const initCameraGUI = (camera: Camera) => {
    const cameraFolder = gui.addFolder('camera')
    cameraFolder.add(camera.position, 'x', -10, 10)
    cameraFolder.add(camera.position, 'y', -10, 10)
    cameraFolder.add(camera.position, 'z', -10, 10)
  }

  camera && initCameraGUI(camera)
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
