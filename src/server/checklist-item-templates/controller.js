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
      const workflowTemplateId = checklistItem.workflowTemplateId

      // Fetch workflow template details
      const workflowResponse = await fetch(
        `${config.get('apiServer')}/api/v1/workflow-templates/${workflowTemplateId}`
      )

      if (!workflowResponse.ok) {
        throw new Error('Failed to fetch workflow template')
      }

      const workflow = await workflowResponse.json()

      // Fetch all checklist items for dependencies
      const checklistItemsApiUrl = `${config.get('apiServer')}/api/v1/checklist-item-templates?governanceTemplateId=${workflow.governanceTemplateId}`
      const checklistItemsResponse = await fetch(checklistItemsApiUrl)

      if (!checklistItemsResponse.ok) {
        throw new Error('Failed to fetch checklist items')
      }

      const allChecklistItems = await checklistItemsResponse.json()

      // Add workflow names to all checklist items
      const availableDependencies = allChecklistItems
        .filter((item) => item?.workflowTemplateId)
        .map((item) => ({
          _id: item._id,
          name: item.name || 'Unnamed Item',
          workflowName: workflow.name
        }))

      return h.view('checklist-item-templates/views/detail', {
        pageTitle: 'Edit Checklist Item Template',
        checklistItem,
        workflow,
        workflowTemplateId,
        governanceTemplateId: workflow.governanceTemplateId,
        availableDependencies
      })
    } catch (error) {
      request.logger.error('Error fetching checklist item template:', error)
      return h.view('checklist-item-templates/views/detail', {
        pageTitle: 'Edit Checklist Item Template',
        error:
          'Unable to load checklist item template details. Please try again.',
        checklistItem: { _id: id },
        availableDependencies: []
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

      // First get the checklist item to get the workflow ID
      const checklistItemResponse = await fetch(
        `${config.get('apiServer')}/api/v1/checklist-item-templates/${id}`
      )

      if (!checklistItemResponse.ok) {
        throw new Error('Failed to fetch checklist item template')
      }

      const checklistItem = await checklistItemResponse.json()
      const workflowTemplateId = checklistItem.workflowTemplateId

      // Get the workflow to get the governance template ID
      const workflowResponse = await fetch(
        `${config.get('apiServer')}/api/v1/workflow-templates/${workflowTemplateId}`
      )

      if (!workflowResponse.ok) {
        throw new Error('Failed to fetch workflow template')
      }

      const workflow = await workflowResponse.json()

      // Now update the checklist item
      const apiUrl = `${config.get('apiServer')}/api/v1/checklist-item-templates/${id}`
      const requestBody = {
        workflowTemplateId: workflow._id,
        name,
        description,
        type,
        dependencies_requires: Array.isArray(dependenciesRequires)
          ? dependenciesRequires
          : dependenciesRequires
            ? [dependenciesRequires]
            : []
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

      return h.redirect(`/workflow-templates/${workflowTemplateId}`)
    } catch (error) {
      request.logger.error('Error updating checklist item template:', error)
      return h.view('checklist-item-templates/views/detail', {
        pageTitle: 'Edit Checklist Item Template',
        error: 'Unable to update checklist item template. Please try again.',
        value: {
          name: request.payload.name || '',
          description: request.payload.description || '',
          type: request.payload.type || '',
          dependenciesRequires: Array.isArray(
            request.payload.dependenciesRequires
          )
            ? request.payload.dependenciesRequires
            : request.payload.dependenciesRequires
              ? [request.payload.dependenciesRequires]
              : []
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
      // Fetch current workflow template details
      request.logger.info('Fetching current workflow template:', {
        workflowTemplateId,
        apiUrl: `${config.get('apiServer')}/api/v1/workflow-templates/${workflowTemplateId}`
      })
      const workflowResponse = await fetch(
        `${config.get('apiServer')}/api/v1/workflow-templates/${workflowTemplateId}`
      )

      if (!workflowResponse.ok) {
        throw new Error('Failed to fetch workflow template')
      }

      const workflow = await workflowResponse.json()
      request.logger.info('Received current workflow template:', {
        workflowId: workflow._id,
        workflowName: workflow.name,
        workflow: JSON.stringify(workflow)
      })

      // Fetch all workflows in the governance template
      const workflowsApiUrl = `${config.get('apiServer')}/api/v1/workflow-templates?governanceTemplateId=${governanceTemplateId}`
      request.logger.info('Fetching all workflows for governance template:', {
        governanceTemplateId,
        apiUrl: workflowsApiUrl
      })
      const allWorkflowsResponse = await fetch(workflowsApiUrl)

      if (!allWorkflowsResponse.ok) {
        throw new Error('Failed to fetch workflows')
      }

      const allWorkflows = await allWorkflowsResponse.json()
      request.logger.info('Received all workflows:', {
        count: allWorkflows.length,
        workflows: JSON.stringify(
          allWorkflows.map((w) => ({ id: w._id, name: w.name }))
        )
      })

      // Create a map of workflow IDs to names for quick lookup
      const workflowMap = {}
      allWorkflows.forEach((w) => {
        if (w?._id && w.name) {
          workflowMap[w._id] = w.name
        }
      })

      request.logger.info('Created workflow map:', {
        workflowMap: JSON.stringify(workflowMap)
      })

      // Fetch all checklist items from the governance template for dependencies
      const checklistItemsApiUrl = `${config.get('apiServer')}/api/v1/checklist-item-templates?governanceTemplateId=${governanceTemplateId}`
      request.logger.info(
        'Fetching all checklist items for governance template:',
        {
          governanceTemplateId,
          apiUrl: checklistItemsApiUrl
        }
      )
      const checklistItemsResponse = await fetch(checklistItemsApiUrl)

      if (!checklistItemsResponse.ok) {
        throw new Error('Failed to fetch checklist items')
      }

      const allChecklistItems = await checklistItemsResponse.json()
      request.logger.info('Received all checklist items:', {
        count: allChecklistItems.length,
        items: JSON.stringify(
          allChecklistItems.map((item) => ({
            id: item._id,
            name: item.name,
            workflowId: item.workflowTemplateId
          }))
        )
      })

      // Add workflow names to all checklist items
      const availableDependencies = allChecklistItems
        .filter((item) => item?.workflowTemplateId)
        .map((item) => ({
          _id: item._id,
          name: item.name || 'Unnamed Item',
          workflowName:
            workflowMap[item.workflowTemplateId] || 'Unknown Workflow'
        }))

      request.logger.info('Available dependencies:', {
        count: availableDependencies.length,
        currentWorkflowId: workflowTemplateId,
        dependencies: JSON.stringify(availableDependencies)
      })

      const templateData = {
        pageTitle: 'Create New Checklist Item',
        workflow,
        workflowTemplateId,
        governanceTemplateId,
        availableDependencies,
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
        availableDependenciesCount: availableDependencies.length,
        templateData: JSON.stringify(templateData)
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
        governanceTemplateId,
        availableDependencies: []
      }

      request.logger.info('Rendering error template with data:', {
        pageTitle: errorTemplateData.pageTitle,
        error: errorTemplateData.error,
        value: errorTemplateData.value,
        templateData: JSON.stringify(errorTemplateData)
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
        dependencies_requires: Array.isArray(dependenciesRequires)
          ? dependenciesRequires
          : [dependenciesRequires].filter(Boolean)
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

        // Add workflow names to checklist items
        const availableDependencies = checklistItems
          .filter((item) => item?.workflowTemplateId)
          .map((item) => ({
            _id: item._id,
            name: item.name || 'Unnamed Item',
            workflowName: workflow.name
          }))

        return h.view('checklist-item-templates/views/new', {
          pageTitle: 'Create New Checklist Item',
          error: 'Unable to create checklist item. Please try again.',
          value: {
            name: request.payload.name || '',
            description: request.payload.description || '',
            type: request.payload.type || '',
            dependenciesRequires: Array.isArray(
              request.payload.dependenciesRequires
            )
              ? request.payload.dependenciesRequires
              : [request.payload.dependenciesRequires].filter(Boolean)
          },
          workflow,
          workflowTemplateId,
          governanceTemplateId,
          availableDependencies
        })
      } catch (fetchError) {
        // If we can't fetch the workflow details, throw to central error handler
        request.logger.error('Error fetching workflow details:', fetchError)
        throw Boom.badImplementation('Unable to load form data')
      }
    }
  }
}
