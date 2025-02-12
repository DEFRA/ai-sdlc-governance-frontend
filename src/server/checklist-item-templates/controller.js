import { config } from '~/src/config/config.js'

export const checklistItemTemplatesController = {
  async new(request, h) {
    const { governanceTemplateId, workflowTemplateId } = request.params

    try {
      // Fetch workflow template details to show in the form
      const workflowResponse = await fetch(
        `${config.get('apiServer')}/api/v1/workflow-templates/${workflowTemplateId}`
      )

      if (!workflowResponse.ok) {
        throw new Error('Failed to fetch workflow template')
      }

      const workflow = await workflowResponse.json()

      return h.view('checklist-item-templates/views/new', {
        pageTitle: 'Create New Checklist Item Template',
        governanceTemplateId,
        workflowTemplateId,
        workflow
      })
    } catch (error) {
      request.logger.error('Error fetching workflow template:', error)
      return h.view('checklist-item-templates/views/new', {
        pageTitle: 'Create New Checklist Item Template',
        error: 'Unable to load workflow template details. Please try again.',
        governanceTemplateId,
        workflowTemplateId
      })
    }
  },

  async create(request, h) {
    try {
      const { workflowTemplateId } = request.params
      const {
        itemKey,
        name,
        description,
        requiresApproval,
        requiresFileUpload
      } = request.payload

      request.logger.info(
        `Creating checklist item template for workflow ${workflowTemplateId}`
      )

      // Set the type based on requirements
      const itemType =
        requiresApproval === 'on'
          ? 'approval'
          : requiresFileUpload === 'on'
            ? 'document'
            : 'task'

      const apiUrl = `${config.get('apiServer')}/api/v1/checklist-item-templates`
      const requestBody = {
        workflowTemplateId,
        itemKey,
        name,
        description,
        type: itemType,
        dependencies: {
          requires: [], // Will be populated when dependencies feature is implemented
          requiredBy: [] // Will be populated when dependencies feature is implemented
        },
        metadata: {
          requiresApproval: requiresApproval === 'on',
          requiresFileUpload: requiresFileUpload === 'on'
        }
      }

      request.logger.info(
        `Making POST request to ${apiUrl} with body:`,
        requestBody
      )

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        const errorText = await response.text()
        request.logger.error(
          `API call failed with status: ${response.status}, body: ${errorText}`
        )
        throw new Error(`API call failed with status: ${response.status}`)
      }

      const createdItem = await response.json()
      request.logger.info(
        `Successfully created checklist item template with ID: ${createdItem._id}`
      )

      return h.redirect(`/workflow-templates/${workflowTemplateId}`)
    } catch (error) {
      request.logger.error('Error creating checklist item template:', error)
      return h.view('checklist-item-templates/views/new', {
        pageTitle: 'Create New Checklist Item Template',
        error: 'Unable to create checklist item template. Please try again.',
        values: request.payload,
        workflowTemplateId: request.params.workflowTemplateId,
        governanceTemplateId: request.params.governanceTemplateId
      })
    }
  }
}
