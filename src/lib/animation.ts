import { gsap, Power2, Power3 } from 'gsap'
import { MotionPathPlugin } from 'gsap/MotionPathPlugin'
import {
  CubicBezierCurve3,
  Material,
  Mesh,
  PerspectiveCamera,
  Scene,
  Vector3,
  WebGLRenderer
} from 'three'
import { beginStats, endStats } from './debugUtils'
import type Lenis from '@studio-freight/lenis'
import type { Water } from 'three/examples/jsm/objects/Water.js'
import { useAnimationStore } from '@/stores/animation'

gsap.registerPlugin(MotionPathPlugin)

export const animate = (
  renderer: WebGLRenderer,
  scene: Scene,
  camera: PerspectiveCamera,
  ballMesh: Mesh,
  water: Water,
  lenis: Lenis
) => {
  const animated = useAnimationStore()
  const animationLoop = (timestamp: number) => {
    beginStats()
    lenis.raf(timestamp)

    ballMesh.rotateZ(animated.targetBallSpin)

    // TODO add maxfps to controls to target specific framerates?
    if (water) water.material.uniforms['time'].value += 1.0 / 60.0
    // if (water) water.material.uniforms['time'].value += 1.0 / 120.0

    renderer.render(scene, camera)
    endStats()
    requestAnimationFrame(animationLoop)
  }
  requestAnimationFrame(animationLoop)
}

export const fadeSceneIn = (renderer: WebGLRenderer) => {
  gsap.to(renderer, {
    toneMappingExposure: 0.22,
    duration: 3.3,
    ease: Power3.easeIn
  })
}

export const fadeBallIn = (ballMeshMaterials: Material[]) => {
  ballMeshMaterials.forEach((material) => {
    gsap.to(material, { opacity: 1, ease: Power3.easeIn, duration: 5 })
  })
}

export const panCameraToBall = (
  camera: PerspectiveCamera,
  ballMesh: Mesh,
  onComplete: () => void
) => {
  const v0 = new Vector3(-3, 10, 0)
  const v1 = new Vector3(-1.5, 7, 5)
  const v2 = new Vector3(0, 4, 3.5)
  const v3 = new Vector3(1.5, 1, 1)

  gsap.to(camera!.position, {
    duration: 10,
    ease: Power3.easeInOut,
    onUpdate: () => camera!.lookAt(ballMesh!.position),
    motionPath: {
      path: new CubicBezierCurve3(v0, v1, v2, v3).getPoints(500)
    },
    onComplete
  })
}

export const bumpLightsUp = (renderer: WebGLRenderer) => {
  gsap.to(renderer, { toneMappingExposure: 0.5, duration: 10, ease: Power3.easeIn })
}

export const fadeTitleIn = (lenis: Lenis) => {
  const animated = useAnimationStore()
  gsap.to(animated, {
    titleOpacity: 1,
    ease: Power3.easeIn,
    duration: 5,
    delay: 3,
    onStart: () => lenis.scrollTo(0),
    onComplete: () => {
      lenis.progress === 0 && fadeScrollHintsIn()
    }
  })
}

export const fadeScrollHintsIn = () => {
  const animated = useAnimationStore()
  gsap.to(animated, {
    scrollHintOpacity: 1,
    ease: Power3.easeInOut,
    duration: 1.1,
    delay: 2.2,
    onComplete: () => {
      gsap.fromTo(
        animated,
        { scrollHintTranslateY: '0px' },
        {
          scrollHintTranslateY: '7px',
          yoyoEase: Power2.easeOut,
          delay: 0.22,
          repeatDelay: 0.11,
          duration: 0.55,
          repeat: -1,
          ease: Power3.easeInOut
        }
      )
    }
  })
}
