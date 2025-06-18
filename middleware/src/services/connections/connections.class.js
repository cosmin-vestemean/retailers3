import axios from 'axios'

export class ConnectionsService {
  constructor(options, app) {
    this.options = options || {}
    this.app = app
    this.baseUrl = app.get('s1').baseUrl
  }

  async find(params) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/JS/AJS_edi_integration/getConnections`,
        params.query || {},
        { headers: { 'Content-Type': 'application/json' } }
      )
      
      if (response.data.success) {
        return {
          total: response.data.total || 0,
          limit: params.query?.$limit || response.data.total || 0,
          skip: params.query?.$skip || 0,
          data: response.data.data || []
        }
      } else {
        throw new Error(response.data.message || 'Unknown error occurred')
      }
    } catch (error) {
      throw new Error(`Failed to fetch connections: ${error.message}`)
    }
  }

  async get(id, params) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/JS/AJS_edi_integration/getConnection`,
        { id: parseInt(id) },
        { headers: { 'Content-Type': 'application/json' } }
      )
      
      if (response.data.success) {
        return response.data.data
      } else {
        throw new Error(response.data.message || 'Connection not found')
      }
    } catch (error) {
      throw new Error(`Failed to fetch connection: ${error.message}`)
    }
  }

  async create(data, params) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/JS/AJS_edi_integration/createEdiConnector`,
        data,
        { headers: { 'Content-Type': 'application/json' } }
      )
      
      if (response.data.success) {
        return { id: response.data.id, ...data }
      } else {
        throw new Error(response.data.message || 'Failed to create connection')
      }
    } catch (error) {
      throw new Error(`Failed to create connection: ${error.message}`)
    }
  }

  async update(id, data, params) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/JS/AJS_edi_integration/updateEdiConnector`,
        { CCCSFTP: parseInt(id), ...data },
        { headers: { 'Content-Type': 'application/json' } }
      )
      
      if (response.data.success) {
        return { id: parseInt(id), ...data }
      } else {
        throw new Error(response.data.message || 'Failed to update connection')
      }
    } catch (error) {
      throw new Error(`Failed to update connection: ${error.message}`)
    }
  }

  async remove(id, params) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/JS/AJS_edi_integration/deleteEdiConnector`,
        { id: parseInt(id) },
        { headers: { 'Content-Type': 'application/json' } }
      )
      
      if (response.data.success) {
        return { id: parseInt(id) }
      } else {
        throw new Error(response.data.message || 'Failed to delete connection')
      }
    } catch (error) {
      throw new Error(`Failed to delete connection: ${error.message}`)
    }
  }
}
