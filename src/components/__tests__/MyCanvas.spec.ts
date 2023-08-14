import { describe, it, expect } from 'vitest'

import { mount } from '@vue/test-utils'
import Canvas from '../MyCanvas.vue'

describe('Canvas', () => {
  it('renders canvas', () => {
    const wrapper = mount(Canvas)
    expect(wrapper.exists)
    expect(wrapper.element).toBeInstanceOf(HTMLCanvasElement)
  })
})
