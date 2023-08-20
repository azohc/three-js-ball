import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useAnimationStore = defineStore('animation', () => {
  const title = ref({
    opacity: 0,
    blur: 0,
    brightness: 1
  })

  const scrollHints = ref({
    opacity: 0,
    translateY: 0
  })

  const targetBallSpin = ref(0)

  return {
    title,
    scrollHints,
    targetBallSpin
  }
})
