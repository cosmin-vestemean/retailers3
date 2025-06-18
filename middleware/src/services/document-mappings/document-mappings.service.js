import { DocumentMappingsService } from './document-mappings.class.js';
import hooks from './document-mappings.hooks.js';

export default function (app) {
    // Register main CRUD service
    app.use('/document-mappings', new DocumentMappingsService({}, app));
    const service = app.service('document-mappings');
    service.hooks(hooks);

    // Register “specific” lookup as a sub-service
    app.use('/document-mappings/specific', {
        async find(params) {
            return service.specific(params);
        }
    });
    app.service('document-mappings/specific').hooks(hooks);
}