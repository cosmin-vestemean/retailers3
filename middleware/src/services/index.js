import ediConnectors from './edi-connectors/edi-connectors.service.js';
import platformClients from './platform-clients/platform-clients.service.js';
import ediProviders from './edi-providers/edi-providers.service.js';
import connectionTypes from './connection-types/connection-types.service.js';

export const services = app => {
  // Register EDI connectors service
  ediConnectors(app);
  // Register platform clients service
  platformClients(app);
  // Register EDI providers service
  ediProviders(app);
  // Register connection types service
  connectionTypes(app);
};
