import type { Ball } from '@/types'
import {
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  PMREMGenerator,
  PlaneGeometry,
  PointLight,
  RGBAFormat,
  RepeatWrapping,
  SRGBColorSpace,
  Scene,
  TextureLoader,
  UnsignedByteType,
  Vector3,
  WebGLRenderer
} from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { Sky } from 'three/examples/jsm/objects/Sky.js'
import { Water } from 'three/examples/jsm/objects/Water.js'
import type { Ref } from 'vue'

const textureLoader = new TextureLoader()
const gltfLoader = new GLTFLoader()

export const initEnvironment = (renderer: WebGLRenderer, scene: Scene) => {
  const sun = new Vector3()
  const water = new Water(new PlaneGeometry(10000, 10000), {
    textureWidth: 512,
    textureHeight: 512,
    waterNormals: textureLoader.load('waternormals.jpg', function (texture) {
      texture.wrapS = texture.wrapT = RepeatWrapping
    }),
    sunDirection: new Vector3(),
    sunColor: 0xf7cd5d,
    waterColor: 0x001e0f,
    distortionScale: 3.7,
    fog: scene.fog !== undefined
  })
  water.rotation.x = -Math.PI / 2
  scene.add(water)

  // Skybox
  const sky = new Sky()
  sky.scale.setScalar(10000)
  scene.add(sky)

  const skyUniforms = sky.material.uniforms

  skyUniforms['turbidity'].value = 10
  skyUniforms['rayleigh'].value = 2
  skyUniforms['mieCoefficient'].value = 0.005
  skyUniforms['mieDirectionalG'].value = 0.8

  const elevation = 0.5
  const azimuth = 180

  const pmremGenerator = new PMREMGenerator(renderer)

  const phi = MathUtils.degToRad(90 - elevation)
  const theta = MathUtils.degToRad(azimuth)

  sun.setFromSphericalCoords(1, phi, theta)

  sky.material.uniforms['sunPosition'].value.copy(sun)
  water.material.uniforms['sunDirection'].value.copy(sun).normalize()

  const skyScene = new Scene()
  skyScene.add(sky)
  const renderTarget = pmremGenerator.fromScene(skyScene)
  scene.environment = renderTarget.texture
  scene.background = renderTarget.texture

  return water
}

export const initCoreLight = (scene: Scene, coreLight: Ref<PointLight | undefined>) => {
  coreLight.value = new PointLight(0xb9973f, 0, 0, 10)
  scene.add(coreLight.value)
}

export const initBall = async (scene: Scene, ball: Ball) => {
  try {
    await loadBallMeshPromise(scene, ball)
    scene.add(ball.mesh!)
  } catch (error) {
    console.error(error)
  }
}

const loadBallMeshPromise = async (scene: Scene, ball: Ball) =>
  new Promise<void>((resolve, reject) => {
    gltfLoader.load(
      /**
       * ball model optimized with gltf.report's simple_pipeline.js script:
       *  -> remove duplicate vertex or texture data, if any.
       *  -> losslessly resample animation frames.
       *  -> remove unused nodes, textures, or other data.
       *  -> resize all textures to ≤2k.
       */
      'ball_optimized.glb',
      (gltf) => {
        const uuid = gltf.scene.uuid
        scene.add(gltf.scene)
        const ballGroup = scene.children.find((c) => c.uuid === uuid)
        if (ballGroup) {
          ball.mesh = ballGroup.children[0] as Mesh
          const applyColorSpace = (object: Object3D) => {
            if (object.type === 'Mesh') {
              const material = (object as Mesh).material as MeshBasicMaterial
              if (material.map) {
                material.map.format = RGBAFormat
                material.map.type = UnsignedByteType
                material.map.colorSpace = SRGBColorSpace
              }
              material.transparent = true
              material.opacity = 0
              ball.materials.push(material)
            }
            if (object.children && object.children.length > 0) {
              object.children.forEach(applyColorSpace)
            }
          }
          applyColorSpace(ball.mesh)

          ball.mesh.children[0].children.forEach(
            (o3d: Object3D, i: number) => i > 0 && ball.detachablePatchMeshes.push(o3d as Mesh)
          )

          ball.mesh.position.y = 1
          resolve()
        }
      },
      undefined,
      reject
    )
  })
