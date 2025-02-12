import { workflowTemplatesController } from './controller.js'

/**
 * @type {import('@hapi/hapi').ServerRegisterPluginObject<void>}
 */
export const workflowTemplates = {
  plugin: {
    name: 'workflow-templates',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: '/governance-templates/{governanceTemplateId}/workflows/new',
          handler: workflowTemplatesController.new.bind(
            workflowTemplatesController
          ),
          options: {
            description: 'Create new workflow template',
            auth: false
          }
        },
        {
          method: 'POST',
          path: '/governance-templates/{governanceTemplateId}/workflows',
          handler: workflowTemplatesController.create.bind(
            workflowTemplatesController
          ),
          options: {
            description: 'Create new workflow template',
            auth: false
          }
        },
        {
          method: 'GET',
          path: '/workflow-templates/{id}',
          handler: workflowTemplatesController.detail.bind(
            workflowTemplatesController
          ),
          options: {
            description: 'View workflow template details',
            auth: false
          }
        }
      ])
    }
  }
}
