import { config } from '~/src/config/config.js'

export const workflowTemplatesController = {
  new(request, h) {
    const { governanceTemplateId } = request.params
    return h.view('workflow-templates/views/new', {
      pageTitle: 'Create New Workflow Template',
      governanceTemplateId
    })
  },

  async create(request, h) {
    try {
      const { governanceTemplateId } = request.params
      const { name, description } = request.payload

      request.logger.info(
        `Creating workflow template for governance template ${governanceTemplateId}`
      )

      const apiUrl = `${config.get('apiServer')}/api/v1/workflow-templates`
      const requestBody = {
        governanceTemplateId,
        name,
        description
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

      const createdWorkflow = await response.json()
      request.logger.info(
        `Successfully created workflow template with ID: ${createdWorkflow._id}`
      )

      return h.redirect(`/governance-templates/${governanceTemplateId}`)
    } catch (error) {
      request.logger.error('Error creating workflow template:', error)
      return h.view('workflow-templates/views/new', {
        pageTitle: 'Create New Workflow Template',
        error: 'Unable to create workflow template. Please try again.',
        values: request.payload,
        governanceTemplateId: request.params.governanceTemplateId
      })
    }
  },

  async detail(request, h) {
    try {
      const { id } = request.params

      // Fetch workflow template details
      const workflowResponse = await fetch(
        `${config.get('apiServer')}/api/v1/workflow-templates/${id}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )

      if (!workflowResponse.ok) {
        throw new Error(
          `API call failed with status: ${workflowResponse.status}`
        )
      }

      const workflow = await workflowResponse.json()

      // Fetch associated checklist items
      const checklistItemsResponse = await fetch(
        `${config.get('apiServer')}/api/v1/checklist-item-templates?workflowTemplateId=${id}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )

      if (!checklistItemsResponse.ok) {
        throw new Error(
          `API call failed with status: ${checklistItemsResponse.status}`
        )
      }

      const checklistItems = await checklistItemsResponse.json()
      workflow.checklistItemTemplates = checklistItems

      request.logger.info(
        `Found ${checklistItems.length} checklist items for workflow template ${id}`
      )

      return h.view('workflow-templates/views/detail', {
        pageTitle: workflow.name,
        workflow
      })
    } catch (error) {
      request.logger.error(error)
      return h.view('workflow-templates/views/detail', {
        pageTitle: 'Workflow Template Not Found',
        error: 'Unable to load workflow template'
      })
    }
  }
}
