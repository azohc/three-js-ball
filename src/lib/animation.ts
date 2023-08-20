import { gsap, Power2, Power3 } from 'gsap'
import { MotionPathPlugin } from 'gsap/MotionPathPlugin'
import {
  CubicBezierCurve3,
  Material,
  Mesh,
  PerspectiveCamera,
  PointLight,
  Scene,
  Vector3,
  WebGLRenderer
} from 'three'
import { beginStats, endStats } from './debugUtils'
import type Lenis from '@studio-freight/lenis'
import type { Water } from 'three/examples/jsm/objects/Water.js'
import { useAnimationStore } from '@/stores/animation'

gsap.registerPlugin(MotionPathPlugin)

let coreLightIntensityTween: gsap.core.Tween | null = null
let scrollHintInfiniteTween: gsap.core.Tween | null = null

export const initScrollHintTween = () => {
  const animated = useAnimationStore()
  scrollHintInfiniteTween = gsap.fromTo(
    animated,
    { scrollHintTranslateY: '0px' },
    {
      scrollHintTranslateY: '7px',
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

export const initCoreLightIntensityTween = (light: PointLight) =>
  (coreLightIntensityTween = gsap.fromTo(
    light,
    { intensity: 0 },
    { intensity: 10, paused: true, ease: Power3.easeIn }
  ))

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

    // TODO don't rotateZ if dragging ball
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

export const fadeTitleIn = (onComplete: () => void) => {
  const animated = useAnimationStore()
  gsap.to(animated, {
    titleOpacity: 1,
    ease: Power3.easeIn,
    duration: 5,
    delay: 3,
    onComplete
  })
}

export const fadeScrollHintsIn = () => {
  const animated = useAnimationStore()
  gsap.to(animated, {
    scrollHintOpacity: 1,
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
  gsap.to(animated, {
    scrollHintOpacity: 0,
    ease: Power3.easeOut,
    duration: 2,
    onComplete: () => {
      scrollHintInfiniteTween?.pause(0)
    }
  })
}

export const syncPatchDetach = (ballPatchMeshes: Mesh[], progress: number) => {
  ballPatchMeshes.forEach((m) => {
    const scale = 1 + progress * 0.3
    m.scale.set(scale, scale, scale)
  })
}

export const syncBallElevationWithCamera = (
  ballMesh: Mesh,
  camera: PerspectiveCamera,
  progress: number
) => {
  ballMesh.position.y = 1 + progress * 2

  camera.position.y = ballMesh.position.y
  camera.position.x = 1.6 - progress * 2.44
  camera.position.z = 1 + progress * 0.88
  camera.lookAt(ballMesh.position)
}

export const syncCoreLight = (light: PointLight, ballMesh: Mesh, progress: number) => {
  light.position.copy(ballMesh.position)

  coreLightIntensityTween?.progress(progress)
}
