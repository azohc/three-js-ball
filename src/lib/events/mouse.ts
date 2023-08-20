import { PerspectiveCamera, Raycaster, Vector2 } from 'three'
import { rotateBallOnDrag } from '../animation/objects'
import type { Ball } from '@/types'

const mouse = new Vector2()
let isBallClick = false
const lastMousePos = new Vector2()

export const onMouseDown = (
  event: MouseEvent,
  ball: Ball,
  raycaster: Raycaster,
  camera: PerspectiveCamera
) => {
  isBallClick = false

  mouse.x = (event.clientX / window.innerWidth) * 2 - 1
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1

  raycaster.setFromCamera(mouse, camera!)
  const intersects = raycaster.intersectObject(ball.mesh!)

  if (intersects.length > 0) {
    isBallClick = true
    lastMousePos.set(event.clientX, event.clientY)
  }
}

export const onMouseMove = (event: MouseEvent, ball: Ball) => {
  if (!isBallClick) return

  const dx = event.clientX - lastMousePos.x
  const dy = event.clientY - lastMousePos.y

  rotateBallOnDrag(ball.mesh!, dx, dy)

  lastMousePos.set(event.clientX, event.clientY)
}

export const onMouseUp = () => {
  isBallClick = false
}
