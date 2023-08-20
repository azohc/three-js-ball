import { PerspectiveCamera, Mesh, Vector3, CubicBezierCurve3 } from 'three'
import { gsap, Power3 } from 'gsap'

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
