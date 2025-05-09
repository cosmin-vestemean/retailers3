// src/services/edi-connectors/edi-connectors.service.js
import { EdiConnectorsService } from './edi-connectors.class.js';
import hooks from './edi-connectors.hooks.js';

export default function(app) {
  app.use('/edi-connectors', new EdiConnectorsService({}, app));
  const service = app.service('edi-connectors');
  service.hooks(hooks);
}