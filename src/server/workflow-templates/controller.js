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
  },

  async diagram(request, h) {
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

      // Get unique external workflow IDs from dependencies
      const externalWorkflowIds = new Set()
      checklistItems.forEach((item) => {
        if (item.dependencies_requires) {
          item.dependencies_requires.forEach((dep) => {
            if (
              dep._id &&
              dep.workflowTemplateId &&
              dep.workflowTemplateId !== id
            ) {
              externalWorkflowIds.add(dep.workflowTemplateId)
            }
          })
        }
      })

      // Fetch external workflow details
      const externalWorkflows = []
      for (const workflowId of externalWorkflowIds) {
        const externalWorkflowResponse = await fetch(
          `${config.get('apiServer')}/api/v1/workflow-templates/${workflowId}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json'
            }
          }
        )

        if (externalWorkflowResponse.ok) {
          const externalWorkflow = await externalWorkflowResponse.json()
          externalWorkflows.push(externalWorkflow)
        }
      }

      return h.view('workflow-templates/views/diagram', {
        pageTitle: `${workflow.name} Dependencies`,
        workflow,
        externalWorkflows
      })
    } catch (error) {
      request.logger.error(error)
      return h.view('workflow-templates/views/diagram', {
        pageTitle: 'Workflow Template Not Found',
        error: 'Unable to load workflow template'
      })
    }
  },

  async deleteConfirmation(request, h) {
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

      return h.view('workflow-templates/views/delete-confirmation', {
        pageTitle: 'Delete Workflow Template',
        workflow
      })
    } catch (error) {
      request.logger.error(
        'Error fetching workflow template for deletion:',
        error
      )
      return h.view('workflow-templates/views/delete-confirmation', {
        pageTitle: 'Delete Workflow Template',
        error: 'Unable to load workflow template details. Please try again.',
        workflow: { _id: request.params.id }
      })
    }
  },

  async delete(request, h) {
    try {
      const { id } = request.params

      // Get the workflow first to know where to redirect after deletion
      const workflowResponse = await fetch(
        `${config.get('apiServer')}/api/v1/workflow-templates/${id}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )

      let governanceTemplateId = null
      if (workflowResponse.ok) {
        const workflow = await workflowResponse.json()
        governanceTemplateId = workflow.governanceTemplateId
      }

      // Delete the workflow template
      const response = await fetch(
        `${config.get('apiServer')}/api/v1/workflow-templates/${id}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )

      if (!response.ok) {
        throw new Error(`API call failed with status: ${response.status}`)
      }

      // Redirect to the governance template if we have its ID, otherwise to the workflows list
      if (governanceTemplateId) {
        return h.redirect(`/governance-templates/${governanceTemplateId}`)
      } else {
        return h.redirect('/governance-templates')
      }
    } catch (error) {
      request.logger.error('Error deleting workflow template:', error)

      // Try to fetch the workflow again to show the error page
      try {
        const workflowResponse = await fetch(
          `${config.get('apiServer')}/api/v1/workflow-templates/${request.params.id}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json'
            }
          }
        )

        const workflow = workflowResponse.ok
          ? await workflowResponse.json()
          : { _id: request.params.id }

        return h.view('workflow-templates/views/delete-confirmation', {
          pageTitle: 'Delete Workflow Template',
          error: 'Unable to delete workflow template. Please try again.',
          workflow
        })
      } catch (fetchError) {
        request.logger.error(
          'Error fetching workflow after delete failure:',
          fetchError
        )
        return h.view('workflow-templates/views/delete-confirmation', {
          pageTitle: 'Delete Workflow Template',
          error: 'Unable to delete workflow template. Please try again.',
          workflow: { _id: request.params.id }
        })
      }
    }
  }
}
