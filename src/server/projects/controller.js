import { config } from '~/src/config/config.js'

export const projectsController = {
  async list(request, h) {
    try {
      const response = await fetch(
        `${config.get('apiServer')}/api/v1/projects`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )

      if (!response.ok) {
        throw new Error(`API call failed with status: ${response.status}`)
      }

      const projects = await response.json()

      // Fetch governance templates to get names and versions
      const templatesResponse = await fetch(
        `${config.get('apiServer')}/api/v1/governance-templates`
      )

      if (!templatesResponse.ok) {
        throw new Error('Failed to fetch governance templates')
      }

      const templates = await templatesResponse.json()
      const templatesMap = new Map(templates.map((t) => [t._id, t]))

      // Enhance projects with template information
      const enhancedProjects = projects.map((project) => ({
        ...project,
        governanceTemplateName: project.governanceTemplateId
          ? `${templatesMap.get(project.governanceTemplateId)?.name} (v${templatesMap.get(project.governanceTemplateId)?.version})`
          : null
      }))

      return h.view('projects/views/list', {
        pageTitle: 'Projects',
        projects: enhancedProjects
      })
    } catch (error) {
      request.logger.error(error)
      return h.view('projects/views/list', {
        pageTitle: 'Projects',
        projects: [],
        error: 'Unable to load projects'
      })
    }
  },

  async new(request, h) {
    try {
      // Fetch available governance templates
      const templatesResponse = await fetch(
        `${config.get('apiServer')}/api/v1/governance-templates`
      )

      if (!templatesResponse.ok) {
        throw new Error('Failed to fetch governance templates')
      }

      const governanceTemplates = await templatesResponse.json()

      // If a governance template is selected, fetch its workflows
      let workflows = []
      const selectedTemplateId = request.query.governanceTemplateId
      if (selectedTemplateId) {
        const workflowsResponse = await fetch(
          `${config.get('apiServer')}/api/v1/workflow-templates?governanceTemplateId=${selectedTemplateId}`
        )
        if (workflowsResponse.ok) {
          workflows = await workflowsResponse.json()
        }
      }

      return h.view('projects/views/new', {
        pageTitle: 'Create New Project',
        governanceTemplates,
        workflows,
        values: {
          name: request.query.name || '',
          description: request.query.description || '',
          governanceTemplateId: selectedTemplateId,
          selectedWorkflowTemplateIds:
            request.query.selectedWorkflowTemplateIds || []
        }
      })
    } catch (error) {
      request.logger.error('Error loading new project form:', error)
      return h.view('projects/views/new', {
        pageTitle: 'Create New Project',
        error: 'Unable to load governance templates. Please try again.',
        governanceTemplates: [],
        workflows: [],
        values: {}
      })
    }
  },

  async create(request, h) {
    try {
      const {
        name,
        description,
        governanceTemplateId,
        selectedWorkflowTemplateIds = []
      } = request.payload

      // Validate required fields
      if (!name || !governanceTemplateId) {
        throw new Error('Name and governance template are required')
      }

      const apiUrl = `${config.get('apiServer')}/api/v1/projects`

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description ? description.trim() : '',
          governanceTemplateId,
          selectedWorkflowTemplateIds: Array.isArray(
            selectedWorkflowTemplateIds
          )
            ? selectedWorkflowTemplateIds
            : selectedWorkflowTemplateIds
              ? [selectedWorkflowTemplateIds]
              : []
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        request.logger.error('API Error Response:', {
          status: response.status,
          statusText: response.statusText,
          url: apiUrl,
          body: errorText
        })
        throw new Error(
          `API call failed with status: ${response.status}. Response: ${errorText}`
        )
      }

      const project = await response.json()
      return h.redirect(`/projects/${project._id}`)
    } catch (error) {
      request.logger.error('Error creating project:', {
        error: error.message,
        stack: error.stack,
        payload: request.payload
      })

      // Re-fetch governance templates and workflows for the error case
      try {
        const templatesResponse = await fetch(
          `${config.get('apiServer')}/api/v1/governance-templates`
        )
        const governanceTemplates = await templatesResponse.json()

        let workflows = []
        if (request.payload.governanceTemplateId) {
          const workflowsResponse = await fetch(
            `${config.get('apiServer')}/api/v1/workflow-templates?governanceTemplateId=${request.payload.governanceTemplateId}`
          )
          if (workflowsResponse.ok) {
            workflows = await workflowsResponse.json()
          }
        }

        return h.view('projects/views/new', {
          pageTitle: 'Create New Project',
          error: 'Unable to create project. Please try again.',
          governanceTemplates,
          workflows,
          values: request.payload
        })
      } catch (fetchError) {
        request.logger.error('Error fetching governance templates:', fetchError)
        return h.view('projects/views/new', {
          pageTitle: 'Create New Project',
          error: 'Unable to create project. Please try again.',
          governanceTemplates: [],
          workflows: [],
          values: request.payload
        })
      }
    }
  }
}
