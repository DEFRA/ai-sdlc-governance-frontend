import { governanceTemplatesController } from './controller.js'

/**
 * @type {import('@hapi/hapi').ServerRegisterPluginObject<void>}
 */
export const governanceTemplates = {
  plugin: {
    name: 'governance-templates',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: '/governance-templates',
          handler: governanceTemplatesController.list.bind(
            governanceTemplatesController
          ),
          options: {
            description: 'List all governance templates',
            auth: false
          }
        },
        {
          method: 'GET',
          path: '/governance-templates/new',
          handler: governanceTemplatesController.new.bind(
            governanceTemplatesController
          ),
          options: {
            description: 'Create new governance template',
            auth: false
          }
        },
        {
          method: 'POST',
          path: '/governance-templates',
          handler: governanceTemplatesController.create.bind(
            governanceTemplatesController
          ),
          options: {
            description: 'Create new governance template',
            auth: false
          }
        },
        {
          method: 'GET',
          path: '/governance-templates/{id}',
          handler: governanceTemplatesController.detail.bind(
            governanceTemplatesController
          ),
          options: {
            description: 'View governance template details',
            auth: false
          }
        }
      ])
    }
  }
}
