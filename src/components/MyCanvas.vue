<script setup lang="ts">
import { onMounted, ref } from 'vue'

const canvasRef = ref<HTMLCanvasElement>()
const width = ref<number>()
const height = ref<number>()

onMounted(() => {
  console.log('mounted', canvasRef.value, window.innerWidth, window.innerHeight)
  width.value = window.innerWidth
  height.value = window.innerHeight
})
</script>

<template>
  <canvas id="canvas" ref="canvasRef" :width="width" :height="height" />
</template>

<style scoped>
canvas#canvas {
  height: 100%;
  width: 100%;
}
</style>
