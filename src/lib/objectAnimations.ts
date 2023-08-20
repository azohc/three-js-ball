import {
  Quaternion,
  Vector3,
  type Material,
  type Mesh,
  type PointLight,
  type WebGLRenderer
} from 'three'

import { gsap, Power3 } from 'gsap'

let coreLightIntensityTween: gsap.core.Tween | null = null

export const initCoreLightIntensityTween = (light: PointLight) =>
  (coreLightIntensityTween = gsap.fromTo(
    light,
    { intensity: 0 },
    { intensity: 10, paused: true, ease: Power3.easeIn }
  ))

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

export const bumpLightsUp = (renderer: WebGLRenderer) => {
  gsap.to(renderer, { toneMappingExposure: 0.5, duration: 10, ease: Power3.easeIn })
}

export const syncPatchDetach = (ballPatchMeshes: Mesh[], progress: number) => {
  ballPatchMeshes.forEach((m) => {
    const scale = 1 + progress * 0.3
    m.scale.set(scale, scale, scale)
  })
}

export const syncCoreLight = (light: PointLight, ballMesh: Mesh, progress: number) => {
  light.position.copy(ballMesh.position)

  coreLightIntensityTween?.progress(progress)
}

export const rotateBallOnDrag = (ballMesh: Mesh, dx: number, dy: number) => {
  const rotationQuaternion = new Quaternion()
  const intensity = 0.01

  rotationQuaternion.setFromAxisAngle(new Vector3(0, 0, 1), dx * intensity)
  ballMesh!.quaternion.multiply(rotationQuaternion)

  rotationQuaternion.setFromAxisAngle(new Vector3(1, 0, 0), -dy * intensity)
  ballMesh!.quaternion.multiply(rotationQuaternion)
}
