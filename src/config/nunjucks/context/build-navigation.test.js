import { buildNavigation } from '~/src/config/nunjucks/context/build-navigation.js'

/**
 * @param {Partial<Request>} [options]
 */
function mockRequest(options) {
  return { ...options }
}

describe('#buildNavigation', () => {
  test('Should provide expected navigation details', () => {
    expect(
      buildNavigation(mockRequest({ path: '/non-existent-path' }))
    ).toEqual([
      {
        isActive: false,
        text: 'Home',
        url: '/'
      },
      {
        isActive: false,
        text: 'Projects',
        url: '/projects'
      }
    ])
  })

  test('Should mark projects as active when on projects path', () => {
    expect(buildNavigation(mockRequest({ path: '/projects' }))).toEqual([
      {
        isActive: false,
        text: 'Home',
        url: '/'
      },
      {
        isActive: true,
        text: 'Projects',
        url: '/projects'
      }
    ])
  })

  test('should build navigation with correct structure', () => {
    const mockConfig = {
      path: '/'
    }

    const result = buildNavigation(mockConfig)
    expect(result).toEqual([
      {
        text: 'Home',
        url: '/',
        isActive: true
      },
      {
        text: 'Projects',
        url: '/projects',
        isActive: false
      }
    ])
  })
})

/**
 * @import { Request } from '@hapi/hapi'
 */
