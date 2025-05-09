// src/services/edi-connectors/edi-connectors.class.js
import axios from 'axios';

export class EdiConnectorsService {
  constructor(options, app) {
    this.options = options || {};
    this.app = app;
    this.baseUrl = app.get('s1').baseUrl;
  }

  async find(params) {
    const response = await axios.post(
      `${this.baseUrl}/JS/AJS_edi_integration/getEdiConnectors`,
      params.query || {},
      { headers: { 'Content-Type': 'application/json' } }
    );
    return response.data;
  }

  async get(id) {
    const response = await axios.post(
      `${this.baseUrl}/JS/AJS_edi_integration/getEdiConnector`,
      { id },
      { headers: { 'Content-Type': 'application/json' } }
    );
    return response.data;
  }

  async create(data) {
    const response = await axios.post(
      `${this.baseUrl}/JS/AJS_edi_integration/createEdiConnector`,
      data,
      { headers: { 'Content-Type': 'application/json' } }
    );
    return response.data;
  }

  async patch(id, data) {
    const payload = { CCCSFTP: id, ...data };
    const response = await axios.post(
      `${this.baseUrl}/JS/AJS_edi_integration/updateEdiConnector`,
      payload,
      { headers: { 'Content-Type': 'application/json' } }
    );
    return response.data;
  }

  async remove(id) {
    const response = await axios.post(
      `${this.baseUrl}/JS/AJS_edi_integration/deleteEdiConnector`,
      { id },
      { headers: { 'Content-Type': 'application/json' } }
    );
    return response.data;
  }
}