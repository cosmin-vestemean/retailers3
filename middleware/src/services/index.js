import ediRetailers from './edi-retailers/edi-retailers.service.js';
import platformClients from './platform-clients/platform-clients.service.js';
import ediProviders from './edi-providers/edi-providers.service.js';
import connectionTypes from './connection-types/connection-types.service.js';
import documentMappings from './document-mappings/document-mappings.service.js';

export const services = app => {
  // Register EDI retailers service
  ediRetailers(app);
  // Register platform clients service
  platformClients(app);
  // Register EDI providers service
  ediProviders(app);
  // Register connection types service
  connectionTypes(app);
  // Register document-mappings service (includes /specific sub-route)
  documentMappings(app);
};
