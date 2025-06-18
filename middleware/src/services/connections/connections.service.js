// src/services/connections/connections.service.js
import { ConnectionsService } from './connections.class.js'
import hooks from './connections.hooks.js'

export default function(app) {
  // Register main service
  app.use('/connections', new ConnectionsService({}, app))
  const service = app.service('connections')
  service.hooks(hooks)
}
