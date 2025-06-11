import axios from 'axios';
import { parseStringPromise } from 'xml2js';
import { DOMParser } from 'xmldom';
import xpath from 'xpath';

export class FieldMappingsService {
    constructor(options, app) {
        this.options = options || {};
        this.app = app;
        this.baseUrl = app.get('s1').baseUrl;
        this.s1Config = app.get('s1');
    }

    // GET /field-mappings?document_mapping_id=123
    async find(params) {
        const response = await axios.post(
            `${this.baseUrl}/JS/AJS_edi_integration/getFieldMappings`,
            params.query || {},
            { headers: { 'Content-Type': 'application/json' } }
        );
        return response.data;
    }

    // GET /field-mappings/:id
    async get(id) {
        const response = await axios.post(
            `${this.baseUrl}/JS/AJS_edi_integration/getFieldMapping`,
            { id },
            { headers: { 'Content-Type': 'application/json' } }
        );
        return response.data;
    }

    // POST /field-mappings
    async create(data) {
        const response = await axios.post(
            `${this.baseUrl}/JS/AJS_edi_integration/createFieldMapping`,
            data,
            { headers: { 'Content-Type': 'application/json' } }
        );
        return response.data;
    }

    // PATCH /field-mappings/:id
    async patch(id, data) {
        const payload = { CCCXMLS1MAPPINGS: id, ...data };
        const response = await axios.post(
            `${this.baseUrl}/JS/AJS_edi_integration/updateFieldMapping`,
            payload,
            { headers: { 'Content-Type': 'application/json' } }
        );
        return response.data;
    }

    // DELETE /field-mappings/:id
    async remove(id) {
        const response = await axios.post(
            `${this.baseUrl}/JS/AJS_edi_integration/deleteFieldMapping`,
            { id },
            { headers: { 'Content-Type': 'application/json' } }
        );
        return response.data;
    }

    // GET /field-mappings/s1-tables?object=SALDOC
    async getS1Tables(params) {
        const { object } = params.query || {};
        if (!object) {
            throw new Error('Object name is required');
        }

        // Login to S1 to get clientID
        const loginData = {
            service: 'login',
            username: this.s1Config.username,
            password: this.s1Config.password,
            appId: this.s1Config.appId
        };

        const loginResponse = await axios.post(
            `${this.baseUrl}`,
            loginData,
            { headers: { 'Content-Type': 'application/json' } }
        );

        if (!loginResponse.data.success) {
            throw new Error('Failed to authenticate with S1');
        }

        const clientID = loginResponse.data.clientID;

        // Get object tables
        const tablesData = {
            service: 'getObjectTables',
            clientID: clientID,
            appId: this.s1Config.appId,
            object: object.toLowerCase()
        };

        const response = await axios.post(
            `${this.baseUrl}`,
            tablesData,
            { headers: { 'Content-Type': 'application/json' } }
        );

        return response.data;
    }

    // GET /field-mappings/s1-fields?object=SALDOC&table=FINDOC
    async getS1Fields(params) {
        const { object, table } = params.query || {};
        if (!object || !table) {
            throw new Error('Object and table names are required');
        }

        // Login first
        const loginData = {
            service: 'login',
            username: this.s1Config.username,
            password: this.s1Config.password,
            appId: this.s1Config.appId
        };

        const loginResponse = await axios.post(
            `${this.baseUrl}`,
            loginData,
            { headers: { 'Content-Type': 'application/json' } }
        );

        if (!loginResponse.data.success) {
            throw new Error('Failed to authenticate with S1');
        }

        const clientID = loginResponse.data.clientID;

        // Get table fields
        const fieldsData = {
            service: 'getTableFields',
            clientID: clientID,
            appId: this.s1Config.appId,
            object: object.toLowerCase(),
            table: table
        };

        const response = await axios.post(
            `${this.baseUrl}`,
            fieldsData,
            { headers: { 'Content-Type': 'application/json' } }
        );

        return response.data;
    }

    // POST /field-mappings/parse-xml
    async parseXml(data) {
        const { xmlContent, extractPaths = true } = data;
        
        if (!xmlContent) {
            throw new Error('XML content is required');
        }

        try {
            // Parse XML to extract structure
            const parsed = await parseStringPromise(xmlContent, {
                explicitArray: false,
                preserveChildrenOrder: true,
                includeWhiteChars: true
            });

            let paths = [];
            if (extractPaths) {
                // Extract all XPath expressions
                const doc = new DOMParser().parseFromString(xmlContent, 'text/xml');
                paths = this.extractXPaths(doc.documentElement);
            }

            return {
                success: true,
                parsed: parsed,
                paths: paths,
                namespaces: this.extractNamespaces(xmlContent)
            };
        } catch (error) {
            throw new Error(`Failed to parse XML: ${error.message}`);
        }
    }

    // POST /field-mappings/validate-xpath
    async validateXPath(data) {
        const { xmlContent, xpathExpression, namespaces = {} } = data;
        
        if (!xmlContent || !xpathExpression) {
            throw new Error('XML content and XPath expression are required');
        }

        try {
            const doc = new DOMParser().parseFromString(xmlContent, 'text/xml');
            const select = xpath.useNamespaces(namespaces);
            const nodes = select(xpathExpression, doc);
            
            let results = [];
            if (nodes && nodes.length > 0) {
                results = nodes.map(node => {
                    if (node.nodeType === 2) { // Attribute
                        return {
                            type: 'attribute',
                            name: node.name,
                            value: node.value
                        };
                    } else if (node.nodeType === 1) { // Element
                        return {
                            type: 'element',
                            name: node.nodeName,
                            value: node.textContent
                        };
                    } else { // Text
                        return {
                            type: 'text',
                            value: node.nodeValue
                        };
                    }
                });
            }

            return {
                success: true,
                valid: results.length > 0,
                results: results,
                count: results.length
            };
        } catch (error) {
            return {
                success: false,
                valid: false,
                error: error.message
            };
        }
    }

    // Helper method to extract all XPaths from XML
    extractXPaths(node, currentPath = '', paths = new Set()) {
        if (!node) return [];

        // Build current path
        let nodePath = currentPath;
        if (node.nodeType === 1) { // Element node
            nodePath = currentPath ? `${currentPath}/${node.nodeName}` : `/${node.nodeName}`;
            paths.add(nodePath);

            // Add attributes
            if (node.attributes) {
                for (let i = 0; i < node.attributes.length; i++) {
                    const attr = node.attributes[i];
                    if (!attr.name.startsWith('xmlns')) {
                        paths.add(`${nodePath}/@${attr.name}`);
                    }
                }
            }
        }

        // Process children
        if (node.childNodes) {
            for (let i = 0; i < node.childNodes.length; i++) {
                this.extractXPaths(node.childNodes[i], nodePath, paths);
            }
        }

        return Array.from(paths).sort();
    }

    // Helper to extract namespaces
    extractNamespaces(xmlContent) {
        const namespaces = {};
        const regex = /xmlns:?([^=]*)="([^"]*)"/g;
        let match;
        
        while ((match = regex.exec(xmlContent)) !== null) {
            const prefix = match[1] || 'default';
            const uri = match[2];
            namespaces[prefix] = uri;
        }
        
        return namespaces;
    }
}
