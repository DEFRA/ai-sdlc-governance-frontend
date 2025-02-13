import { checklistItemTemplatesController } from './controller.js'

/**
 * @type {import('@hapi/hapi').ServerRegisterPluginObject<void>}
 */
export const checklistItemTemplates = {
  plugin: {
    name: 'checklist-item-templates',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: '/governance-templates/{governanceTemplateId}/workflows/{workflowTemplateId}/checklist-items/new',
          handler: checklistItemTemplatesController.new.bind(
            checklistItemTemplatesController
          ),
          options: {
            description: 'Create new checklist item template',
            auth: false
          }
        },
        {
          method: 'POST',
          path: '/governance-templates/{governanceTemplateId}/workflows/{workflowTemplateId}/checklist-items',
          handler: checklistItemTemplatesController.create.bind(
            checklistItemTemplatesController
          ),
          options: {
            description: 'Create new checklist item template',
            auth: false
          }
        },
        {
          method: 'GET',
          path: '/checklist-item-templates/{id}',
          handler: checklistItemTemplatesController.detail.bind(
            checklistItemTemplatesController
          ),
          options: {
            description: 'View checklist item template details',
            auth: false
          }
        },
        {
          method: ['POST', 'PUT'],
          path: '/checklist-item-templates/{id}',
          handler: checklistItemTemplatesController.update.bind(
            checklistItemTemplatesController
          ),
          options: {
            description: 'Update checklist item template',
            auth: false
          }
        }
      ])
    }
  }
}
