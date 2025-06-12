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

export { app as api }
