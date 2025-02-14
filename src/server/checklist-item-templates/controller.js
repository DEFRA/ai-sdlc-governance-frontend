import { config } from '~/src/config/config.js'
import Boom from '@hapi/boom'

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
        value: {
          name: request.payload.name || '',
          description: request.payload.description || '',
          type: request.payload.type || '',
          dependenciesRequires: request.payload.dependenciesRequires || []
        },
        checklistItem: { _id: id }
      })
    }
  },

  async new(request, h) {
    const { workflowTemplateId, governanceTemplateId } = request.params
    request.logger.info('Starting new checklist item handler with params:', {
      workflowTemplateId,
      governanceTemplateId
    })

    try {
      // Fetch workflow template details to get available dependencies
      request.logger.info('Fetching workflow template:', {
        workflowTemplateId
      })
      const workflowResponse = await fetch(
        `${config.get('apiServer')}/api/v1/workflow-templates/${workflowTemplateId}`
      )

      if (!workflowResponse.ok) {
        throw new Error('Failed to fetch workflow template')
      }

      const workflow = await workflowResponse.json()
      request.logger.info('Received workflow template:', {
        workflowId: workflow._id,
        workflowName: workflow.name
      })

      // Fetch existing checklist items for dependencies
      request.logger.info('Fetching checklist items for workflow:', {
        workflowTemplateId
      })
      const checklistItemsResponse = await fetch(
        `${config.get('apiServer')}/api/v1/checklist-item-templates?workflowTemplateId=${workflowTemplateId}`
      )

      if (!checklistItemsResponse.ok) {
        throw new Error('Failed to fetch existing checklist items')
      }

      const checklistItems = await checklistItemsResponse.json()
      workflow.checklistItemTemplates = checklistItems
      request.logger.info('Received checklist items:', {
        count: checklistItems.length
      })

      const templateData = {
        pageTitle: 'Create New Checklist Item',
        workflow,
        workflowTemplateId,
        governanceTemplateId,
        value: {
          name: '',
          description: '',
          type: '',
          dependenciesRequires: []
        }
      }

      request.logger.info('Rendering new checklist item template with data:', {
        pageTitle: templateData.pageTitle,
        workflowId: workflow._id,
        workflowName: workflow.name,
        value: templateData.value,
        checklistItemsCount: checklistItems.length
      })
      return h.view('checklist-item-templates/views/new', templateData)
    } catch (error) {
      request.logger.error('Error loading new checklist item form:', error)

      const errorTemplateData = {
        pageTitle: 'Create New Checklist Item',
        error: 'Unable to load workflow template. Please try again.',
        value: {
          name: '',
          description: '',
          type: '',
          dependenciesRequires: []
        },
        workflow: null,
        workflowTemplateId,
        governanceTemplateId
      }

      request.logger.info('Rendering error template with data:', {
        pageTitle: errorTemplateData.pageTitle,
        error: errorTemplateData.error,
        value: errorTemplateData.value
      })
      return h.view('checklist-item-templates/views/new', errorTemplateData)
    }
  },

  async create(request, h) {
    const { workflowTemplateId, governanceTemplateId } = request.params
    const {
      name,
      description,
      type,
      dependenciesRequires = []
    } = request.payload

    try {
      request.logger.info(
        `Creating checklist item template for workflow ${workflowTemplateId}`
      )

      const apiUrl = `${config.get('apiServer')}/api/v1/checklist-item-templates`
      const requestBody = {
        workflowTemplateId,
        name,
        description,
        type,
        dependencies_requires: dependenciesRequires
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

      // Fetch workflow template details again for the error case
      try {
        const workflowResponse = await fetch(
          `${config.get('apiServer')}/api/v1/workflow-templates/${workflowTemplateId}`
        )
        const workflow = await workflowResponse.json()

        // Fetch existing checklist items for dependencies
        const checklistItemsResponse = await fetch(
          `${config.get('apiServer')}/api/v1/checklist-item-templates?workflowTemplateId=${workflowTemplateId}`
        )
        const checklistItems = await checklistItemsResponse.json()
        workflow.checklistItemTemplates = checklistItems

        return h.view('checklist-item-templates/views/new', {
          pageTitle: 'Create New Checklist Item',
          error: 'Unable to create checklist item. Please try again.',
          value: {
            name: request.payload.name || '',
            description: request.payload.description || '',
            type: request.payload.type || '',
            dependenciesRequires: request.payload.dependenciesRequires || []
          },
          workflow,
          workflowTemplateId,
          governanceTemplateId
        })
      } catch (fetchError) {
        // If we can't fetch the workflow details, throw to central error handler
        request.logger.error('Error fetching workflow details:', fetchError)
        throw Boom.badImplementation('Unable to load form data')
      }
    }
  }
}
