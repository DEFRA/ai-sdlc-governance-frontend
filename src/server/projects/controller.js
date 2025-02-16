import { config } from '~/src/config/config.js'

export const projectsController = {
  async list(request, h) {
    try {
      const response = await fetch(
        `${config.get('apiServer')}/api/v1/projects`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )

      if (!response.ok) {
        throw new Error(`API call failed with status: ${response.status}`)
      }

      const projects = await response.json()

      return h.view('projects/views/list', {
        pageTitle: 'Projects',
        projects
      })
    } catch (error) {
      request.logger.error(error)
      return h.view('projects/views/list', {
        pageTitle: 'Projects',
        projects: [],
        error: 'Unable to load projects'
      })
    }
  }
}
