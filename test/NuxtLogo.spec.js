import { mount } from '@vue/test-utils'
import NuxtLogo from '~/components/nuxt-logo.vue'

describe('NuxtLogo', () => {
  test('is a Vue instance', () => {
    const wrapper = mount(NuxtLogo)
    expect(wrapper.vm).toBeTruthy()
  })
})
