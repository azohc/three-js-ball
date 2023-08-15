<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useResizeObserver } from '@vueuse/core'

import { PerspectiveCamera, WebGLRenderer, Camera, Vector3, Object3D } from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { Scene } from 'three'
import GUI from 'lil-gui'
import { addDirectionalLight, addPointLight } from '@/utils/lights'

const canvasRef = ref<HTMLCanvasElement>()

// THREE
let renderer: WebGLRenderer | null = null
let camera: Camera | null = null
let scene = new Scene()
const gltfLoader = new GLTFLoader()
let ballMesh: Object3D | null = null

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
  camera.position.set(0, 2, 1)

  scene = new Scene()
}

const initScene = () => {
  const showHelper = false

  // Meshes
  addBall()

  // Lights
  addDirectionalLight(0xffb703, 0.1, new Vector3(0, 11, 1.1), scene, showHelper, gui)
  addPointLight(0xffb703, 6.6, 11, new Vector3(3, 6, 5), scene, showHelper, gui)
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
