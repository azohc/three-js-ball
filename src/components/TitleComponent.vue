<script setup lang="ts">
import { useAnimationStore } from '@/stores/animation'
import { computed } from 'vue'

const animated = useAnimationStore()

const titleCS = computed(() => ({
  opacity: animated.title.opacity,
  filter: `blur(${animated.title.blur}px) brightness(${animated.title.brightness})`
}))

const scrollHintCS = computed(() => ({
  opacity: animated.scrollHints.opacity,
  transform: `translateY(${animated.scrollHints.translateY})`
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
