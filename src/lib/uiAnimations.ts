import { gsap, Power2, Power3 } from 'gsap'
import { useAnimationStore } from '@/stores/animation'

let scrollHintInfiniteTween: gsap.core.Tween | null = null

export const initScrollHintTween = () => {
  const animated = useAnimationStore()
  scrollHintInfiniteTween = gsap.fromTo(
    animated.scrollHints,
    { translateY: '0px' },
    {
      translateY: '7px',
      yoyoEase: Power2.easeOut,
      delay: 0.22,
      repeatDelay: 0.11,
      duration: 0.55,
      repeat: -1,
      ease: Power3.easeInOut,
      paused: true
    }
  )
}

export const fadeTitleIn = (onComplete: () => void) => {
  const animated = useAnimationStore()
  gsap.to(animated.title, {
    opacity: 1,
    ease: Power3.easeIn,
    duration: 5,
    delay: 3,
    onComplete
  })
}

export const fadeScrollHintsIn = () => {
  const animated = useAnimationStore()
  gsap.to(animated.scrollHints, {
    opacity: 1,
    delay: 2.2,
    duration: 1.1,
    ease: Power3.easeIn,
    onComplete: () => {
      scrollHintInfiniteTween?.restart(true)
    }
  })
}

export const fadeScrollHintsOut = () => {
  const animated = useAnimationStore()
  gsap.to(animated.scrollHints, {
    opacity: 0,
    ease: Power3.easeOut,
    duration: 2,
    onComplete: () => {
      scrollHintInfiniteTween?.pause(0)
    }
  })
}
