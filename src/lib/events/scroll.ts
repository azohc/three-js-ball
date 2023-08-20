import { firstCameraPanDone, syncBallElevationWithCamera } from '../animation/camera'
import { syncPatchDetach, syncCoreLight } from '../animation/objects'
import { fadeScrollHintsOut, fadeScrollHintsIn } from '../animation/ui'
import { useAnimationStore } from '@/stores/useAnimation'
import type { Ball } from '@/types'
import type { PerspectiveCamera, PointLight } from 'three'

export const onScroll = (
  event: any,
  camera: PerspectiveCamera,
  ball: Ball,
  coreLight: PointLight
) => {
  const animated = useAnimationStore()
  const { progress: scrollProgress } = event
  if (scrollProgress > 0) {
    fadeScrollHintsOut()
  } else if (firstCameraPanDone.value && scrollProgress === 0) {
    fadeScrollHintsIn()
  }

  if (scrollProgress <= 0.1) {
    animated.title.blur = Math.min(44 * scrollProgress, 5)
    animated.title.brightness = Math.max(1 - 4.4 * scrollProgress, 0.3)
  }

  const SPIN_FACTOR = 0.01
  animated.targetBallSpin = event.velocity * SPIN_FACTOR

  if (firstCameraPanDone.value && ball.detachablePatchMeshes?.length) {
    syncPatchDetach(ball.detachablePatchMeshes, scrollProgress)
    syncBallElevationWithCamera(ball.mesh!, camera, scrollProgress)
    syncCoreLight(coreLight, ball.mesh!, scrollProgress)
  }
}
