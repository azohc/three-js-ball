import GUI from 'lil-gui'
import Stats from 'stats.js'
import {
  Camera,
  WebGLRenderer,
  NoToneMapping,
  LinearToneMapping,
  ReinhardToneMapping,
  CineonToneMapping,
  ACESFilmicToneMapping
} from 'three'

let gui: GUI | null = null
let stats: Stats | null = null

export const initGUI = (camera: Camera, renderer: WebGLRenderer, options: { closed: boolean }) => {
  gui = new GUI()

  const cameraFolder = gui.addFolder('camera')
  cameraFolder.add(camera.position, 'x', -10, 10)
  cameraFolder.add(camera.position, 'y', -10, 10)
  cameraFolder.add(camera.position, 'z', -10, 10)

  const rendererFolder = gui.addFolder('renderer')
  rendererFolder.add(renderer, 'toneMapping', {
    none: NoToneMapping,
    linear: LinearToneMapping,
    reinhard: ReinhardToneMapping,
    cineon: CineonToneMapping,
    acesfilmic: ACESFilmicToneMapping
  })
  rendererFolder.add(renderer, 'toneMappingExposure', 0, 5, 0.1)

  if (options.closed) gui.close()
}

export const initStats = () => {
  stats = new Stats()
  stats.showPanel(0)
  document.body.appendChild(stats.dom)
}

export const beginStats = () => {
  stats && stats.begin()
}

export const endStats = () => {
  stats && stats.end()
}

export const destroyDebugTools = () => {
  if (gui) {
    gui.destroy()
    gui = null
  }

  if (stats) {
    document.body.removeChild(stats.dom)
    stats = null
  }
}
