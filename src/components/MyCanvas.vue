<script setup lang="ts">
import { onMounted, ref } from 'vue'
import {
  PerspectiveCamera,
  WebGLRenderer,
  Camera,
  BoxGeometry,
  Mesh,
  MeshStandardMaterial,
  DirectionalLight,
  DirectionalLightHelper,
  PointLight,
  PointLightHelper
} from 'three'
import { Scene } from 'three'
import GUI from 'lil-gui'

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
  scene.add(createBoxMesh())
  addDirectionalLight({ addToGUI: false, showHelpers: false })
  addPointLight({ addToGui: false, showHelpers: false })
}

const createBoxMesh = () => {
  const box = new BoxGeometry(3, 3, 3)
  const material = new MeshStandardMaterial()
  const mesh = new Mesh(box, material)
  return mesh
}

const addDirectionalLight = ({
  addToGUI,
  showHelper
}: {
  addToGUI: boolean
  showHelper: boolean
}) => {
  const directionalLight = new DirectionalLight(0xffb703, 0.1)
  directionalLight.position.set(0, 11, 1.1)
  scene.add(directionalLight)
  const helper = new DirectionalLightHelper(directionalLight)
  showHelper && scene.add(helper)

  if (!addToGUI) return
  const directionalLightFolder = gui.addFolder('directional light')
  directionalLightFolder.add(directionalLight, 'intensity', 0, 0.5, 0.05)
  directionalLightFolder.add(directionalLight.position, 'x', -10, 10)
  directionalLightFolder.add(directionalLight.position, 'y', -10, 10)
  directionalLightFolder.add(directionalLight.position, 'z', -10, 10)
}

const addPointLight = ({ addToGUI, showHelper }: { addToGUI: boolean; showHelper: boolean }) => {
  const pointLight = new PointLight(0xffb703, 6.6, 11)
  pointLight.position.set(3, 6, 5)
  scene.add(pointLight)
  const helper = new PointLightHelper(pointLight)
  showHelper && scene.add(helper)

  if (!addToGUI) return
  const pointLightFolder = gui.addFolder('point light')
  pointLightFolder.add(pointLight, 'intensity', 0, 15, 0.5)
  pointLightFolder.add(pointLight, 'distance', 0, 15, 0.5)
  pointLightFolder.add(pointLight.position, 'x', -10, 10)
  pointLightFolder.add(pointLight.position, 'y', -10, 10)
  pointLightFolder.add(pointLight.position, 'z', -10, 10)
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
  <!-- <canvas id="canvas" ref="canvasRef" :width="width" :height="height" /> -->
  <!-- <div>hello</div> -->
</template>

<style scoped>
canvas#canvas {
  position: fixed;
}
</style>
