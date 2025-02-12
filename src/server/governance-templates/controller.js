import { config } from '~/src/config/config.js'

export const governanceTemplatesController = {
  async list(request, h) {
    try {
      const response = await fetch(
        `${config.get('apiServer')}/api/v1/governance-templates`,
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

      const templates = await response.json()

      return h.view('governance-templates/views/list', {
        pageTitle: 'Governance Templates',
        templates
      })
    } catch (error) {
      request.logger.error(error)
      return h.view('governance-templates/views/list', {
        pageTitle: 'Governance Templates',
        templates: [],
        error: 'Unable to load governance templates'
      })
    }
  },

  new(request, h) {
    return h.view('governance-templates/views/new', {
      pageTitle: 'Create New Governance Template'
    })
  },

  async create(request, h) {
    try {
      const { name, version, description } = request.payload

      const response = await fetch(
        `${config.get('apiServer')}/api/v1/governance-templates`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name,
            version,
            description
          })
        }
      )

      if (!response.ok) {
        throw new Error(`API call failed with status: ${response.status}`)
      }

      const template = await response.json()
      return h.redirect(`/governance-templates/${template._id}`)
    } catch (error) {
      request.logger.error(error)
      return h.view('governance-templates/views/new', {
        pageTitle: 'Create New Governance Template',
        error: 'Unable to create governance template',
        values: request.payload
      })
    }
  },

  async detail(request, h) {
    try {
      const { id } = request.params

      // First get the governance template
      const templateResponse = await fetch(
        `${config.get('apiServer')}/api/v1/governance-templates/${id}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )

      if (!templateResponse.ok) {
        throw new Error(
          `API call failed with status: ${templateResponse.status}`
        )
      }

      const template = await templateResponse.json()

      // Then get associated workflow templates
      const workflowsResponse = await fetch(
        `${config.get('apiServer')}/api/v1/workflow-templates?governanceTemplateId=${id}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )

      if (!workflowsResponse.ok) {
        throw new Error(
          `API call failed with status: ${workflowsResponse.status}`
        )
      }

      const workflowTemplates = await workflowsResponse.json()
      template.workflowTemplates = workflowTemplates

      request.logger.info(
        `Found ${workflowTemplates.length} workflow templates for governance template ${id}`
      )

      return h.view('governance-templates/views/detail', {
        pageTitle: `${template.name} (${template.version})`,
        template
      })
    } catch (error) {
      request.logger.error('Error loading governance template:', error)
      return h.view('governance-templates/views/detail', {
        pageTitle: 'Template Not Found',
        error: 'Unable to load governance template'
      })
    }
  }
}
