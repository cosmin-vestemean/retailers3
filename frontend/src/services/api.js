import feathers from '@feathersjs/feathers'
import rest from '@feathersjs/rest-client'
import authentication from '@feathersjs/authentication-client'
import axios from 'axios'

// Create the Feathers client
const restClient = rest('http://localhost:3030')
const app = feathers()

// Configure REST client to use axios
app.configure(restClient.axios(axios))

// Configure authentication
app.configure(authentication({
  storage: window.localStorage
}))

// Add request interceptor for authorization header
app.hooks({
  before: {
    all: [
      context => {
        const token = localStorage.getItem('token')
        if (token) {
          context.params.headers = {
            ...context.params.headers,
            Authorization: `Bearer ${token}`
          }
        }
        return context
      }
    ]
  },
  error: {
    all: [
      context => {
        // Handle 401 errors globally
        if (context.error && context.error.code === 401) {
          // Clear token and redirect to login
          localStorage.removeItem('token')
          if (window.location.pathname !== '/login') {
            window.location.href = '/login'
          }
        }
        return context
      }
    ]
  }
})

// Extend field-mappings service with custom methods
const fieldMappingsService = app.service('field-mappings')

// Add S1 introspection methods
fieldMappingsService.getS1Tables = function(params) {
  // Ensure params are structured correctly for FeathersJS find method
  const queryParams = {
    query: typeof params === 'string' ? { object: params } : params
  }
  return app.service('field-mappings/s1-tables').find(queryParams)
}

fieldMappingsService.getS1Fields = function(params) {
  // Ensure params are structured correctly for FeathersJS find method
  const queryParams = {
    query: typeof params === 'string' ? { table: params } : params
  }
  return app.service('field-mappings/s1-fields').find(queryParams)
}

// Add XML parsing methods
fieldMappingsService.parseXml = function(data) {
  return app.service('field-mappings/parse-xml').create(data)
}

fieldMappingsService.validateXPath = function(data) {
  return app.service('field-mappings/validate-xpath').create(data)
}

// Extend edi-providers service with custom methods
const ediProvidersService = app.service('edi-providers')

// Add custom methods for EDI providers
ediProvidersService.getConnectionTypes = function() {
  return app.service('edi-providers/connection-types').find()
}

ediProvidersService.testConnection = function(params) {
  return app.service('edi-providers/test-connection').create(params)
}

ediProvidersService.getProvidersWithStats = function(params) {
  return app.service('edi-providers/with-stats').find(params)
}

export { app as api }
