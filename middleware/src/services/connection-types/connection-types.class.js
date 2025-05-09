// src/services/connection-types/connection-types.class.js
import axios from 'axios';

export class ConnectionTypesService {
  constructor(options, app) {
    this.options = options || {};
    this.app = app;
    this.baseUrl = app.get('s1').baseUrl;
  }

  async find(params) {
    const response = await axios.post(
      `${this.baseUrl}/JS/AJS_edi_integration/getConnTypes`,
      params.query || {},
      { headers: { 'Content-Type': 'application/json' } }
    );
    return response.data;
  }

  async get(id) {
    const response = await axios.post(
      `${this.baseUrl}/JS/AJS_edi_integration/getConnType`,
      { id },
      { headers: { 'Content-Type': 'application/json' } }
    );
    return response.data;
  }
}