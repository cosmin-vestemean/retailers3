import { FieldMappingsService } from './field-mappings.class.js';
import hooks from './field-mappings.hooks.js';

export default function (app) {
    const service = new FieldMappingsService({}, app);
    
    // Main CRUD endpoints
    app.use('/field-mappings', service);
    app.service('field-mappings').hooks(hooks);

    // S1 object introspection endpoints
    app.use('/field-mappings/s1-tables', {
        async find(params) {
            return service.getS1Tables(params);
        }
    });

    app.use('/field-mappings/s1-fields', {
        async find(params) {
            return service.getS1Fields(params);
        }
    });

    // XML parsing endpoints
    app.use('/field-mappings/parse-xml', {
        async create(data) {
            return service.parseXml(data);
        }
    });

    app.use('/field-mappings/validate-xpath', {
        async create(data) {
            return service.validateXPath(data);
        }
    });
}
