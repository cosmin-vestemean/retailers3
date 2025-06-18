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
    }    // GET /document-mappings?trdr_retailer=…&trdr_client=…
    async find(params) {
        const query = params.query || {};
        
        try {
            // If specific retailer and client are provided, use the specific function
            if (query.trdr_retailer && query.trdr_client) {
                const response = await axios.post(
                    `${this.baseUrl}/JS/AJS_edi_integration/getDocumentMappingsByRetailerClient`,
                    query,
                    { headers: { 'Content-Type': 'application/json' } }
                );
                return response.data;
            } else {
                // Otherwise, get all mappings (optionally filtered by client for tenant isolation)
                const response = await axios.post(
                    `${this.baseUrl}/JS/AJS_edi_integration/getAllDocumentMappings`,
                    query,
                    { headers: { 'Content-Type': 'application/json' } }
                );
                return response.data;
            }
        } catch (error) {
            // Fallback to mock data for development when S1 is not available
            console.warn('S1 API not available, returning mock data:', error.message);
            return this._getMockDocumentMappings(query);
        }
    }

    _getMockDocumentMappings(query) {
        const mockData = [
            {
                id: 1,
                trdr_retailer: 12345,
                trdr_client: 1,
                client_name: 'Pet Factory SRL',
                retailer_name: 'Auchan Romania',
                sosource: 100,
                fprms: 2001,
                series: 7001,
                initialdirin: 'C:\\EDI\\IN\\AUCHAN',
                initialdirout: 'C:\\EDI\\OUT\\AUCHAN',
                document_type: 'ORDER',
                direction: 'INBOUND',
                auto_process: true,
                active: true,
                test_mode: false,
                xml_root_path: '/Order',
                header_path: '/Order/OrderHeader',
                lines_path: '/Order/OrderLine',
                created_date: '2024-01-15',
                modified_date: '2024-06-10',
                created_by: 'admin'
            },
            {
                id: 2,
                trdr_retailer: 67890,
                trdr_client: 1,
                client_name: 'Pet Factory SRL',
                retailer_name: 'Dedeman',
                sosource: 200,
                fprms: 3001,
                series: 8001,
                initialdirin: 'C:\\EDI\\IN\\DEDEMAN',
                initialdirout: 'C:\\EDI\\OUT\\DEDEMAN',
                document_type: 'INVOICE',
                direction: 'OUTBOUND',
                auto_process: false,
                active: true,
                test_mode: true,
                xml_root_path: '/Invoice',
                header_path: '/Invoice/InvoiceHeader',
                lines_path: '/Invoice/InvoiceLine',
                created_date: '2024-02-20',
                modified_date: '2024-06-12',
                created_by: 'admin'
            },
            {
                id: 3,
                trdr_retailer: 11111,
                trdr_client: 1,
                client_name: 'Pet Factory SRL',
                retailer_name: 'Sezamo',
                sosource: 300,
                fprms: 4001,
                series: 9001,
                initialdirin: 'C:\\EDI\\IN\\SEZAMO',
                initialdirout: 'C:\\EDI\\OUT\\SEZAMO',
                document_type: 'DESADV',
                direction: 'OUTBOUND',
                auto_process: true,
                active: true,
                test_mode: false,
                xml_root_path: '/DeliveryAdvice',
                header_path: '/DeliveryAdvice/Header',
                lines_path: '/DeliveryAdvice/Line',
                created_date: '2024-03-10',
                modified_date: '2024-06-11',
                created_by: 'admin'
            }
        ];

        // Apply client filter if provided (for tenant isolation)
        let filteredData = mockData;
        if (query.trdr_client) {
            filteredData = mockData.filter(item => item.trdr_client === parseInt(query.trdr_client));
        }

        return {
            success: true,
            data: filteredData,
            count: filteredData.length
        };
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