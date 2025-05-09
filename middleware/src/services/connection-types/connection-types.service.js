// src/services/connection-types/connection-types.service.js
import { ConnectionTypesService } from './connection-types.class.js';
import hooks from './connection-types.hooks.js';

export default function(app) {
  app.use('/connection-types', new ConnectionTypesService({}, app));
  const service = app.service('connection-types');
  service.hooks(hooks);
}