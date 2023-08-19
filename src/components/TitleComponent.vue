<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  titleOpacity: number
  titleBlur: number
  titleBrightness: number
  scrollHintOpacity: number
  scrollHintTranslateY: number
}>()

const titleCS = computed(() => ({
  opacity: props.titleOpacity,
  filter: `blur(${props.titleBlur}px) brightness(${props.titleBrightness})`
}))

const scrollHintCS = computed(() => ({
  opacity: props.scrollHintOpacity,
  transform: `translateY(${props.scrollHintTranslateY})`
}))
</script>

<template>
  <div class="title_container">
    <span class="scroll_hint" :style="scrollHintCS">&darr;</span>
    <h1 class="title" :style="titleCS">ALTINHA</h1>
    <span class="scroll_hint" :style="scrollHintCS">&darr;</span>
  </div>
</template>

<style scoped>
.title_container {
  z-index: 1;
  height: 100vh;
  width: 100%;
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
}

.title {
  text-align: center;
  font-size: 6rem;
  font-weight: bold;
  color: #f7cd5d;
  will-change: opacity;
  opacity: 0;
}

.scroll_hint {
  color: #f7cd5d;
  padding-inline: 2rem;
  font-size: 2rem;
  will-change: opacity, transform;
  opacity: 0;
}
</style>
