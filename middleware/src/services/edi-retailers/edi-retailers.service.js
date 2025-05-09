// src/services/edi-retailers/edi-retailers.service.js
import { EdiRetailersService } from './edi-retailers.class.js';
import hooks from './edi-retailers.hooks.js';

export default function(app) {
  app.use('/edi-retailers', new EdiRetailersService({}, app));
  const service = app.service('edi-retailers');
  service.hooks(hooks);
}