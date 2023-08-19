import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useAnimationStore = defineStore('animation', () => {
  const titleOpacity = ref(0)
  const titleBlur = ref(0)
  const titleBrightness = ref(1)

  const scrollHintOpacity = ref(0)
  const scrollHintTranslateY = ref(0)

  const targetBallSpin = ref(0)

  return {
    titleOpacity,
    titleBlur,
    titleBrightness,
    scrollHintOpacity,
    scrollHintTranslateY,
    targetBallSpin
  }
})
