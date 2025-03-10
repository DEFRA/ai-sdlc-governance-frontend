const mockReadFileSync = jest.fn()
const mockLoggerError = jest.fn()

jest.mock('node:fs', () => ({
  ...jest.requireActual('node:fs'),
  readFileSync: () => mockReadFileSync()
}))
jest.mock('~/src/server/common/helpers/logging/logger.js', () => ({
  createLogger: () => ({ error: (...args) => mockLoggerError(...args) })
}))

describe('#context', () => {
  describe('When webpack manifest file read succeeds', () => {
    let contextImport

    beforeAll(async () => {
      contextImport = await import('~/src/config/nunjucks/context/context.js')
    })

    test('Should provide expected context', () => {
      const contextResult = contextImport.context({
        path: '/non-existent-path'
      })
      expect(contextResult).toEqual({
        assetPath: '/public/assets',
        breadcrumbs: [],
        getAssetPath: expect.any(Function),
        navigation: [
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
        ],
        serviceName: 'Defra SDLC Governance Checklist',
        serviceUrl: '/'
      })
    })

    describe('With valid asset path', () => {
      test('Should provide expected asset path', () => {
        const contextResult = contextImport.context({
          path: '/non-existent-path'
        })
        expect(contextResult.getAssetPath('test.js')).toBe('/public/test.js')
      })
    })

    describe('With invalid asset path', () => {
      test('Should provide expected asset', () => {
        const contextResult = contextImport.context({
          path: '/non-existent-path'
        })
        expect(contextResult.getAssetPath()).toBe('/public/undefined')
      })
    })
  })

  describe('When webpack manifest file read fails', () => {
    let contextImport

    beforeAll(async () => {
      contextImport = await import('~/src/config/nunjucks/context/context.js')
    })

    test('Should log that the Webpack Manifest file is not available', () => {
      mockReadFileSync.mockImplementation(() => {
        throw new Error('File not found')
      })
      contextImport.context({ path: '/non-existent-path' })
      expect(mockLoggerError).toHaveBeenCalledWith(
        'Webpack assets-manifest.json not found'
      )
    })
  })
})

describe('#context cache', () => {
  describe('Webpack manifest file cache', () => {
    let contextImport

    beforeAll(async () => {
      contextImport = await import('~/src/config/nunjucks/context/context.js')
    })

    test('Should read file', () => {
      mockReadFileSync.mockReturnValue('{}')
      contextImport.context({ path: '/non-existent-path' })
      expect(mockReadFileSync).toHaveBeenCalled()
    })

    test('Should use cache', () => {
      mockReadFileSync.mockReturnValue('{}')
      const firstCall = contextImport.context({ path: '/non-existent-path' })
      mockReadFileSync.mockClear()
      const secondCall = contextImport.context({ path: '/non-existent-path' })
      expect(mockReadFileSync).not.toHaveBeenCalled()
      expect(JSON.stringify(firstCall)).toBe(JSON.stringify(secondCall))
    })

    test('Should provide expected context', () => {
      mockReadFileSync.mockReturnValue('{}')
      const contextResult = contextImport.context({ path: '/' })
      expect(contextResult).toEqual({
        assetPath: '/public/assets',
        breadcrumbs: [],
        getAssetPath: expect.any(Function),
        navigation: [
          {
            isActive: true,
            text: 'Home',
            url: '/'
          },
          {
            isActive: false,
            text: 'Projects',
            url: '/projects'
          }
        ],
        serviceName: 'Defra SDLC Governance Checklist',
        serviceUrl: '/'
      })
    })
  })
})
