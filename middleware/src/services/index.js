import ediConnectors from './edi-connectors/edi-connectors.service.js';
import platformClients from './platform-clients/platform-clients.service.js';

export const services = app => {
  // Register EDI connectors service
  ediConnectors(app);
  // Register platform clients service
  platformClients(app);
};
