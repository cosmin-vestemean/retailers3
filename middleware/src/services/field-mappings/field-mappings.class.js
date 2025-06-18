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
        this.clientID = null; // Cache clientID
    }    // Helper method to get S1 clientID through two-stage authentication
    async _getS1ClientId() {
        if (this.clientID) {
            return this.clientID;
        }

        try {
            // Stage 1: Login to get temporary clientID
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
                throw new Error(`Login failed: ${loginResponse.data.error || 'Unknown error'}`);
            }

            const tempClientID = loginResponse.data.clientID;
            
            // Get first available company/branch from login response
            const firstObj = loginResponse.data.objs && loginResponse.data.objs[0];
            if (!firstObj) {
                throw new Error('No company/branch information available');
            }

            // Stage 2: Authenticate to get final clientID
            const authData = {
                service: 'authenticate',
                clientID: tempClientID,
                COMPANY: firstObj.COMPANY,
                BRANCH: firstObj.BRANCH,
                MODULE: firstObj.MODULE,
                REFID: firstObj.REFID
            };

            const authResponse = await axios.post(
                `${this.baseUrl}`,
                authData,
                { headers: { 'Content-Type': 'application/json' } }
            );

            if (!authResponse.data.success) {
                throw new Error(`Authentication failed: ${authResponse.data.error || 'Unknown error'}`);
            }

            this.clientID = authResponse.data.clientID;
            return this.clientID;

        } catch (error) {
            // Reset clientID on error to force re-authentication
            this.clientID = null;
            throw error;
        }
    }

    // GET /field-mappings?document_mapping_id=123
    async find(params) {
        const clientID = await this._getS1ClientId();
        const payload = {
            ...params.query,
            clientID: clientID,
            appId: this.s1Config.appId
        };

        const response = await axios.post(
            `${this.baseUrl}/JS/AJS_edi_integration/getFieldMappings`,
            payload,
            { headers: { 'Content-Type': 'application/json' } }
        );
        return response.data;
    }

    // GET /field-mappings/:id
    async get(id) {
        const clientID = await this._getS1ClientId();
        const payload = {
            id,
            clientID: clientID,
            appId: this.s1Config.appId
        };

        const response = await axios.post(
            `${this.baseUrl}/JS/AJS_edi_integration/getFieldMapping`,
            payload,
            { headers: { 'Content-Type': 'application/json' } }
        );
        return response.data;
    }

    // POST /field-mappings
    async create(data) {
        const clientID = await this._getS1ClientId();
        const payload = {
            ...data,
            clientID: clientID,
            appId: this.s1Config.appId
        };

        const response = await axios.post(
            `${this.baseUrl}/JS/AJS_edi_integration/createFieldMapping`,
            payload,
            { headers: { 'Content-Type': 'application/json' } }
        );
        return response.data;
    }

    // PATCH /field-mappings/:id
    async patch(id, data) {
        const clientID = await this._getS1ClientId();
        const payload = {
            CCCXMLS1MAPPINGS: id,
            ...data,
            clientID: clientID,
            appId: this.s1Config.appId
        };

        const response = await axios.post(
            `${this.baseUrl}/JS/AJS_edi_integration/updateFieldMapping`,
            payload,
            { headers: { 'Content-Type': 'application/json' } }
        );
        return response.data;
    }

    // DELETE /field-mappings/:id
    async remove(id) {
        const clientID = await this._getS1ClientId();
        const payload = {
            id,
            clientID: clientID,
            appId: this.s1Config.appId
        };

        const response = await axios.post(
            `${this.baseUrl}/JS/AJS_edi_integration/deleteFieldMapping`,
            payload,
            { headers: { 'Content-Type': 'application/json' } }
        );
        return response.data;
    }    // GET /field-mappings/s1-tables?object=SALDOC
    async getS1Tables(params) {
        const { object } = params.query || {};
        if (!object) {
            throw new Error('Object name is required');
        }

        const clientID = await this._getS1ClientId();

        // Get object tables
        const tablesData = {
            service: 'getObjectTables',
            clientID: clientID,
            appId: this.s1Config.appId,
            OBJECT: object.toUpperCase()
        };        const response = await axios.post(
            `${this.baseUrl}`,
            tablesData,
            { headers: { 'Content-Type': 'application/json' } }
        );

        // Filter out tables with empty dbname
        if (response.data && response.data.tables) {
            response.data.tables = response.data.tables.filter(table => 
                table.dbname && table.dbname.trim() !== ''
            );
            response.data.count = response.data.tables.length;
        }

        return response.data;
    }    // GET /field-mappings/s1-fields?object=SALDOC&table=FINDOC
    async getS1Fields(params) {
        const { object, table } = params.query || {};
        if (!object || !table) {
            throw new Error('Object and table names are required');
        }

        const clientID = await this._getS1ClientId();

        // Get table fields
        const fieldsData = {
            service: 'getTableFields',
            clientID: clientID,
            appId: this.s1Config.appId,
            OBJECT: object.toUpperCase(),
            TABLE: table.toUpperCase()
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
