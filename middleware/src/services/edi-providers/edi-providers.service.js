// src/services/edi-providers/edi-providers.service.js
import { EdiProvidersService } from './edi-providers.class.js';
import hooks from './edi-providers.hooks.js';

export default function(app) {
  app.use('/edi-providers', new EdiProvidersService({}, app));
  const service = app.service('edi-providers');
  service.hooks(hooks);
}