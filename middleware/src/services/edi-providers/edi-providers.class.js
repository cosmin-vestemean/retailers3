// src/services/edi-providers/edi-providers.class.js
import axios from 'axios';

export class EdiProvidersService {
  constructor(options, app) {
    this.options = options || {};
    this.app = app;
    this.baseUrl = app.get('s1').baseUrl;
  }

  async find(params) {
    const response = await axios.post(
      `${this.baseUrl}/JS/AJS_edi_integration/getEdiProviders`,
      params.query || {},
      { headers: { 'Content-Type': 'application/json' } }
    );
    return response.data;
  }

  async get(id) {
    const response = await axios.post(
      `${this.baseUrl}/JS/AJS_edi_integration/getEdiProvider`,
      { id },
      { headers: { 'Content-Type': 'application/json' } }
    );
    return response.data;
  }
}