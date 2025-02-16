import { projectsController } from './controller.js'

/**
 * @type {import('@hapi/hapi').ServerRegisterPluginObject<void>}
 */
export const projects = {
  plugin: {
    name: 'projects',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: '/projects',
          handler: projectsController.list.bind(projectsController),
          options: {
            description: 'List all projects',
            auth: false
          }
        }
      ])
    }
  }
}
