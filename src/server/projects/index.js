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
        },
        {
          method: 'GET',
          path: '/projects/new',
          handler: projectsController.new.bind(projectsController),
          options: {
            description: 'New project form',
            auth: false
          }
        },
        {
          method: 'POST',
          path: '/projects',
          handler: projectsController.create.bind(projectsController),
          options: {
            description: 'Create new project',
            auth: false
          }
        },
        {
          method: 'GET',
          path: '/projects/{id}',
          handler: projectsController.detail.bind(projectsController),
          options: {
            description: 'View project details',
            auth: false
          }
        },
        {
          method: 'GET',
          path: '/projects/{id}/delete',
          handler:
            projectsController.deleteConfirmation.bind(projectsController),
          options: {
            description: 'Show project deletion confirmation',
            auth: false
          }
        },
        {
          method: 'POST',
          path: '/projects/{id}/delete',
          handler: projectsController.delete.bind(projectsController),
          options: {
            description: 'Delete project',
            auth: false
          }
        },
        {
          method: 'POST',
          path: '/checklist-item-instances/{id}/status',
          handler:
            projectsController.updateChecklistStatus.bind(projectsController),
          options: {
            description: 'Update checklist item status',
            auth: false
          }
        },
        {
          method: 'GET',
          path: '/projects/{id}/diagram',
          handler: projectsController.diagram.bind(projectsController),
          options: {
            description: 'View project dependencies diagram',
            auth: false
          }
        }
      ])
    }
  }
}
