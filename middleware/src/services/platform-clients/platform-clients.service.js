// src/services/platform-clients/platform-clients.service.js
import { PlatformClientsService } from './platform-clients.class.js';
import hooks from './platform-clients.hooks.js';

export default function(app) {
  app.use('/platform-clients', new PlatformClientsService({}, app));
  const service = app.service('platform-clients');
  service.hooks(hooks);
}