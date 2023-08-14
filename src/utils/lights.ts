import type GUI from 'lil-gui'
import {
  Scene,
  DirectionalLight,
  DirectionalLightHelper,
  PointLight,
  PointLightHelper,
  Vector3
} from 'three'

export const addDirectionalLight = (
  color: string,
  intensity: number,
  position: Vector3,
  scene: Scene,
  showHelper: boolean,
  gui?: GUI
) => {
  const directionalLight = new DirectionalLight(color, intensity)
  directionalLight.position.copy(position)
  scene.add(directionalLight)
  const helper = new DirectionalLightHelper(directionalLight)
  showHelper && scene.add(helper)

  if (!gui) return
  const directionalLightFolder = gui.addFolder('directional light')
  directionalLightFolder.add(directionalLight, 'intensity', 0, 0.5, 0.05)
  directionalLightFolder.add(directionalLight.position, 'x', -10, 10)
  directionalLightFolder.add(directionalLight.position, 'y', -10, 10)
  directionalLightFolder.add(directionalLight.position, 'z', -10, 10)
}

export const addPointLight = (
  color: string,
  intensity: number,
  distance: number,
  position: Vector3,
  scene: Scene,
  showHelper: boolean,
  gui?: GUI
) => {
  const pointLight = new PointLight(color, intensity, distance, 11)
  pointLight.position.copy(position)
  scene.add(pointLight)
  const helper = new PointLightHelper(pointLight)
  showHelper && scene.add(helper)

  if (!gui) return
  const pointLightFolder = gui.addFolder('point light')
  pointLightFolder.add(pointLight, 'intensity', 0, 15, 0.5)
  pointLightFolder.add(pointLight, 'distance', 0, 15, 0.5)
  pointLightFolder.add(pointLight.position, 'x', -10, 10)
  pointLightFolder.add(pointLight.position, 'y', -10, 10)
  pointLightFolder.add(pointLight.position, 'z', -10, 10)
}
