// src/services/edi-providers/edi-providers.service.js
import { EdiProvidersService } from './edi-providers.class.js';
import hooks from './edi-providers.hooks.js';

export default function(app) {
  // Register main service
  app.use('/edi-providers', new EdiProvidersService({}, app));
  const service = app.service('edi-providers');
  service.hooks(hooks);

  // Register custom endpoints
  
  // Get connection types
  app.use('/edi-providers/connection-types', {
    async find() {
      return service.getConnectionTypes();
    }
  });

  // Test provider connection
  app.use('/edi-providers/test-connection', {
    async create(data) {
      if (!data.id) {
        throw new Error('Provider ID is required');
      }
      return service.testConnection(data.id);
    }
  });

  // Get providers with statistics
  app.use('/edi-providers/with-stats', {
    async find(params) {
      return service.getProvidersWithStats(params);
    }
  });
}