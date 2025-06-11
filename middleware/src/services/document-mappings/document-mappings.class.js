import axios from 'axios';

export class DocumentMappingsService {
    constructor(options, app) {
        this.options = options || {};
        this.app = app;
        this.baseUrl = app.get('s1').baseUrl;
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