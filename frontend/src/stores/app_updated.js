import { defineStore } from 'pinia'

export const useAppStore = defineStore('app', {
  state: () => ({
    // Cached reference data
    ediProviders: [],
    connectionTypes: [],
    clients: [],
    
    // Current context
    selectedClient: null,
    selectedRetailer: null,
    selectedDocumentMapping: null,
    
    // S1 Data cache
    s1TablesCache: new Map(),
    s1FieldsCache: new Map(),
    
    // Loading states
    isLoading: {
      ediProviders: false,
      connectionTypes: false,
      clients: false,
      s1Tables: false,
      s1Fields: false
    },
    
    // Errors
    errors: {},
    globalError: null
  }),

  getters: {
    getEdiProviderById: (state) => (id) => {
      return state.ediProviders.find(provider => provider.id === id)
    },
    
    getConnectionTypeById: (state) => (id) => {
      return state.connectionTypes.find(type => type.id === id)
    },
    
    getClientById: (state) => (id) => {
      return state.clients.find(client => client.id === id)
    },

    hasLoadedReferenceData: (state) => {
      return state.ediProviders.length > 0 && 
             state.connectionTypes.length > 0 && 
             state.clients.length > 0
    }
  },

  actions: {
    // EDI Providers
    async fetchEdiProviders(force = false) {
      if (!force && this.ediProviders.length > 0) return
      
      this.isLoading.ediProviders = true
      this.errors.ediProviders = null
      
      try {
        // Mock data for now
        this.ediProviders = [
          { id: 1, name: 'DocProcess', conntype: 1 },
          { id: 2, name: 'Infinite', conntype: 1 }
        ]
      } catch (error) {
        this.errors.ediProviders = error.message
        throw error
      } finally {
        this.isLoading.ediProviders = false
      }
    },

    // Connection Types
    async fetchConnectionTypes(force = false) {
      if (!force && this.connectionTypes.length > 0) return
      
      this.isLoading.connectionTypes = true
      this.errors.connectionTypes = null
      
      try {
        // Mock data for now
        this.connectionTypes = [
          { id: 1, name: 'SFTP' },
          { id: 2, name: 'FTP' },
          { id: 3, name: 'FTPS' }
        ]
      } catch (error) {
        this.errors.connectionTypes = error.message
        throw error
      } finally {
        this.isLoading.connectionTypes = false
      }
    },

    // Clients
    async fetchClients(force = false) {
      if (!force && this.clients.length > 0) return
      
      this.isLoading.clients = true
      this.errors.clients = null
      
      try {
        // Mock data for now
        this.clients = [
          { 
            id: 1, 
            name: 'Pet Factory',
            contact_email: 'admin@petfactory.ro',
            contact_phone: '+40123456789',
            description: 'Pet Factory main client',
            active: true
          }
        ]
      } catch (error) {
        this.errors.clients = error.message
        throw error
      } finally {
        this.isLoading.clients = false
      }
    },

    // Load all reference data
    async loadReferenceData() {
      await Promise.all([
        this.fetchEdiProviders(),
        this.fetchConnectionTypes(),
        this.fetchClients()
      ])
    },

    // S1 Tables search
    async searchS1Tables(searchTerm) {
      const cacheKey = searchTerm.toLowerCase()
      
      if (this.s1TablesCache.has(cacheKey)) {
        return this.s1TablesCache.get(cacheKey)
      }
      
      this.isLoading.s1Tables = true
      
      try {
        // Mock data for now
        const tables = [
          { name: 'FINDOC', description: 'Financial Documents' },
          { name: 'TRDR', description: 'Customers/Suppliers' },
          { name: 'ITELINES', description: 'Document Lines' },
          { name: 'MTRL', description: 'Materials/Products' }
        ].filter(table => 
          table.name.toLowerCase().includes(cacheKey) ||
          table.description.toLowerCase().includes(cacheKey)
        )
        
        // Cache for 15 minutes
        this.s1TablesCache.set(cacheKey, tables)
        setTimeout(() => {
          this.s1TablesCache.delete(cacheKey)
        }, 15 * 60 * 1000)
        
        return tables
      } catch (error) {
        this.errors.s1Tables = error.message
        throw error
      } finally {
        this.isLoading.s1Tables = false
      }
    },

    // S1 Fields search
    async searchS1Fields(tableName, searchTerm = '') {
      const cacheKey = `${tableName}_${searchTerm}`.toLowerCase()
      
      if (this.s1FieldsCache.has(cacheKey)) {
        return this.s1FieldsCache.get(cacheKey)
      }
      
      this.isLoading.s1Fields = true
      
      try {
        // Mock data for now
        const mockFields = {
          'FINDOC': [
            { name: 'FINCODE', description: 'Document Code' },
            { name: 'TRNDATE', description: 'Transaction Date' },
            { name: 'TRDR', description: 'Customer/Supplier ID' }
          ],
          'TRDR': [
            { name: 'CODE', description: 'Customer Code' },
            { name: 'NAME', description: 'Customer Name' },
            { name: 'AFM', description: 'Tax ID' }
          ],
          'ITELINES': [
            { name: 'LINENUM', description: 'Line Number' },
            { name: 'MTRL', description: 'Material ID' },
            { name: 'QTY1', description: 'Quantity' },
            { name: 'PRICE', description: 'Unit Price' }
          ]
        }
        
        const fields = mockFields[tableName] || []
        
        // Cache for 15 minutes
        this.s1FieldsCache.set(cacheKey, fields)
        setTimeout(() => {
          this.s1FieldsCache.delete(cacheKey)
        }, 15 * 60 * 1000)
        
        return fields
      } catch (error) {
        this.errors.s1Fields = error.message
        throw error
      } finally {
        this.isLoading.s1Fields = false
      }
    },

    // Context management
    setSelectedClient(client) {
      this.selectedClient = client
      this.selectedRetailer = null
      this.selectedDocumentMapping = null
    },

    setSelectedRetailer(retailer) {
      this.selectedRetailer = retailer
      this.selectedDocumentMapping = null
    },

    setSelectedDocumentMapping(mapping) {
      this.selectedDocumentMapping = mapping
    },

    // Clear cache
    clearS1Cache() {
      this.s1TablesCache.clear()
      this.s1FieldsCache.clear()
    },

    // Error management
    setGlobalError(message) {
      this.globalError = message
    },

    clearGlobalError() {
      this.globalError = null
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
