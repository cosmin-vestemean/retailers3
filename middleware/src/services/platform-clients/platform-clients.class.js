// src/services/platform-clients/platform-clients.class.js
import axios from 'axios';

export class PlatformClientsService {
  constructor(options, app) {
    this.options = options || {};
    this.app = app;
    this.baseUrl = app.get('s1').baseUrl;
  }

  async find(params) {
    const response = await axios.post(
      `${this.baseUrl}/JS/AJS_edi_integration/getRetailersClients`,
      params.query || {},
      { headers: { 'Content-Type': 'application/json' } }
    );
    return response.data;
  }

  async get(id) {
    const response = await axios.post(
      `${this.baseUrl}/JS/AJS_edi_integration/getRetailersClient`,
      { id },
      { headers: { 'Content-Type': 'application/json' } }
    );
    return response.data;
  }
}