import ediConnectors from './edi-connectors/edi-connectors.service.js';

export const services = app => {
  // Register EDI connectors service
  ediConnectors(app);
};
