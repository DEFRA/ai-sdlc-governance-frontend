import { config } from '~/src/config/config.js'

export const checklistItemTemplatesController = {
  async detail(request, h) {
    const { id } = request.params

    try {
      // Fetch checklist item template details
      const checklistItemResponse = await fetch(
        `${config.get('apiServer')}/api/v1/checklist-item-templates/${id}`
      )

      if (!checklistItemResponse.ok) {
        throw new Error('Failed to fetch checklist item template')
      }

      const checklistItem = await checklistItemResponse.json()

      // Fetch workflow template details
      const workflowResponse = await fetch(
        `${config.get('apiServer')}/api/v1/workflow-templates/${checklistItem.workflowTemplateId}`
      )

      if (!workflowResponse.ok) {
        throw new Error('Failed to fetch workflow template')
      }

      const workflow = await workflowResponse.json()

      return h.view('checklist-item-templates/views/detail', {
        pageTitle: 'Edit Checklist Item Template',
        checklistItem,
        workflow,
        workflowTemplateId: workflow._id
      })
    } catch (error) {
      request.logger.error('Error fetching checklist item template:', error)
      return h.view('checklist-item-templates/views/detail', {
        pageTitle: 'Edit Checklist Item Template',
        error:
          'Unable to load checklist item template details. Please try again.'
      })
    }
  },

  async update(request, h) {
    const { id } = request.params
    const {
      name,
      description,
      type,
      dependenciesRequires = []
    } = request.payload

    try {
      request.logger.info(`Updating checklist item template ${id}`)

      const apiUrl = `${config.get('apiServer')}/api/v1/checklist-item-templates/${id}`
      const requestBody = {
        name,
        description,
        type,
        dependencies_requires: dependenciesRequires
      }

      request.logger.info(
        `Making PUT request to ${apiUrl} with body:`,
        requestBody
      )

      const response = await fetch(apiUrl, {
        method: 'PUT',
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

      const updatedItem = await response.json()
      request.logger.info(
        `Successfully updated checklist item template with ID: ${updatedItem._id}`
      )

      // Fetch workflow ID to redirect back to workflow page
      const checklistItemResponse = await fetch(
        `${config.get('apiServer')}/api/v1/checklist-item-templates/${id}`
      )
      const checklistItem = await checklistItemResponse.json()

      return h.redirect(
        `/workflow-templates/${checklistItem.workflowTemplateId}`
      )
    } catch (error) {
      request.logger.error('Error updating checklist item template:', error)
      return h.view('checklist-item-templates/views/detail', {
        pageTitle: 'Edit Checklist Item Template',
        error: 'Unable to update checklist item template. Please try again.',
        values: request.payload,
        checklistItem: { _id: id }
      })
    }
  }
}
