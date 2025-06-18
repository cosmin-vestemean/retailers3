import { defineStore } from 'pinia'
import { api } from '@/services/api'

export const useMappingsStore = defineStore('mappings', {
  state: () => ({
    documentMappings: [],
    fieldMappings: [],
    selectedDocumentMapping: null,
    
    isLoading: {
      documentMappings: false,
      fieldMappings: false
    },
    
    errors: {}
  }),

  getters: {
    getDocumentMappingById: (state) => (id) => {
      return state.documentMappings.find(mapping => mapping.id === id)
    },
    
    getFieldMappingsByDocumentId: (state) => (documentId) => {
      return state.fieldMappings.filter(mapping => mapping.document_mapping_id === documentId)
    }
  },

  actions: {
    // Document Mappings
    async fetchDocumentMappings(force = false) {
      if (!force && this.documentMappings.length > 0) return
      
      this.isLoading.documentMappings = true
      this.errors.documentMappings = null
      
      try {
        const response = await api.service('document-mappings').find()
        this.documentMappings = response.data || response
      } catch (error) {
        this.errors.documentMappings = error.message
        throw error
      } finally {
        this.isLoading.documentMappings = false
      }
    },

    async createDocumentMapping(data) {
      try {
        const response = await api.service('document-mappings').create(data)
        this.documentMappings.push(response)
        return response
      } catch (error) {
        this.errors.documentMappings = error.message
        throw error
      }
    },

    async updateDocumentMapping(id, data) {
      try {
        const response = await api.service('document-mappings').patch(id, data)
        const index = this.documentMappings.findIndex(m => m.id === id)
        if (index !== -1) {
          this.documentMappings[index] = response
        }
        return response
      } catch (error) {
        this.errors.documentMappings = error.message
        throw error
      }
    },

    async deleteDocumentMapping(id) {
      try {
        await api.service('document-mappings').remove(id)
        this.documentMappings = this.documentMappings.filter(m => m.id !== id)
        // Also remove associated field mappings
        this.fieldMappings = this.fieldMappings.filter(m => m.document_mapping_id !== id)
      } catch (error) {
        this.errors.documentMappings = error.message
        throw error
      }
    },

    // Field Mappings
    async fetchFieldMappings(documentMappingId, force = false) {
      const existing = this.fieldMappings.filter(m => m.document_mapping_id === documentMappingId)
      if (!force && existing.length > 0) return existing
      
      this.isLoading.fieldMappings = true
      this.errors.fieldMappings = null
      
      try {
        const response = await api.service('field-mappings').find({
          query: { document_mapping_id: documentMappingId }
        })
        const fieldMappings = response.data || response
        
        // Remove old field mappings for this document and add new ones
        this.fieldMappings = this.fieldMappings.filter(m => m.document_mapping_id !== documentMappingId)
        this.fieldMappings.push(...fieldMappings)
        
        return fieldMappings
      } catch (error) {
        this.errors.fieldMappings = error.message
        throw error
      } finally {
        this.isLoading.fieldMappings = false
      }
    },

    async createFieldMapping(data) {
      try {
        const response = await api.service('field-mappings').create(data)
        this.fieldMappings.push(response)
        return response
      } catch (error) {
        this.errors.fieldMappings = error.message
        throw error
      }
    },

    async updateFieldMapping(id, data) {
      try {
        const response = await api.service('field-mappings').patch(id, data)
        const index = this.fieldMappings.findIndex(m => m.id === id)
        if (index !== -1) {
          this.fieldMappings[index] = response
        }
        return response
      } catch (error) {
        this.errors.fieldMappings = error.message
        throw error
      }
    },

    async deleteFieldMapping(id) {
      try {
        await api.service('field-mappings').remove(id)
        this.fieldMappings = this.fieldMappings.filter(m => m.id !== id)
      } catch (error) {
        this.errors.fieldMappings = error.message
        throw error
      }
    },

    // XML Parsing
    async parseXml(xmlContent) {
      try {
        const response = await api.service('field-mappings').get('parse-xml', {
          query: { xml: xmlContent }
        })
        return response
      } catch (error) {
        this.errors.xmlParsing = error.message
        throw error
      }
    },

    // S1 Integration
    async getS1Tables(search = '') {
      try {
        const response = await api.service('field-mappings').get('s1-tables', {
          query: { search }
        })
        return response.data || response
      } catch (error) {
        this.errors.s1Tables = error.message
        throw error
      }
    },

    async getS1Fields(tableName, search = '') {
      try {
        const response = await api.service('field-mappings').get('s1-fields', {
          query: { table: tableName, search }
        })
        return response.data || response
      } catch (error) {
        this.errors.s1Fields = error.message
        throw error
      }
    },

    // Context management
    setSelectedDocumentMapping(mapping) {
      this.selectedDocumentMapping = mapping
    },

    // Clear errors
    clearError(key) {
      delete this.errors[key]
    },

    clearAllErrors() {
      this.errors = {}
    }
  }
})
