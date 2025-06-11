import axios from 'axios';

export class DocumentMappingsService {
    constructor(options, app) {
        this.options = options || {};
        this.app = app;
        this.baseUrl = app.get('s1').baseUrl;
        this.s1Config = app.get('s1');
        this.clientID = null; // Cache clientID
    }

    // Helper method to get S1 clientID through two-stage authentication
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

    // GET /document-mappings?trdr_retailer=…&trdr_client=…
    async find(params) {
        const response = await axios.post(
            `${this.baseUrl}/JS/AJS_edi_integration/getDocumentMappingsByRetailerClient`,
            params.query || {},
            { headers: { 'Content-Type': 'application/json' } }
        );
        return response.data;
    }

    // GET /document-mappings/:id
    async get(id) {
        const response = await axios.post(
            `${this.baseUrl}/JS/AJS_edi_integration/getDocumentMapping`,
            { id },
            { headers: { 'Content-Type': 'application/json' } }
        );
        return response.data;
    }

    // POST /document-mappings
    async create(data) {
        const response = await axios.post(
            `${this.baseUrl}/JS/AJS_edi_integration/createDocumentMapping`,
            data,
            { headers: { 'Content-Type': 'application/json' } }
        );
        return response.data;
    }

    // PATCH /document-mappings/:id
    async patch(id, data) {
        const payload = { CCCDOCUMENTES1MAPPINGS: id, ...data };
        const response = await axios.post(
            `${this.baseUrl}/JS/AJS_edi_integration/updateDocumentMapping`,
            payload,
            { headers: { 'Content-Type': 'application/json' } }
        );
        return response.data;
    }

    // DELETE /document-mappings/:id
    async remove(id) {
        const response = await axios.post(
            `${this.baseUrl}/JS/AJS_edi_integration/deleteDocumentMapping`,
            { id },
            { headers: { 'Content-Type': 'application/json' } }
        );
        return response.data;
    }

    // GET /document-mappings/specific?trdr_retailer=…&trdr_client=…&sosource=…&fprms=…&series=…
    async specific(params) {
        const response = await axios.post(
            `${this.baseUrl}/JS/AJS_edi_integration/getSpecificDocumentMapping`,
            params.query || {},
            { headers: { 'Content-Type': 'application/json' } }
        );
        return response.data;
    }
}