/**
 * @param {Partial<import('@hapi/hapi').Request> | null} request
 */
export function buildNavigation(request) {
  return [
    {
      text: 'Home',
      url: '/',
      isActive: request?.path === '/'
    },
    {
      text: 'Projects',
      url: '/projects',
      isActive: request?.path?.startsWith('/projects')
    }
  ]
}
