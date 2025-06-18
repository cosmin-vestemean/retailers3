<template>
  <div>
    <v-toolbar flat>
      <v-toolbar-title>
        <v-icon class="mr-2">mdi-server-network</v-icon>
        EDI Providers
      </v-toolbar-title>
      <v-spacer />
      
      <!-- Action Buttons -->
      <v-btn
        color="success"
        variant="outlined"
        prepend-icon="mdi-refresh"
        class="mr-2"
        :loading="loading"
        @click="refreshProviders"
      >
        Refresh
      </v-btn>
      <v-btn
        color="primary"
        prepend-icon="mdi-plus"
        @click="openCreateDialog"
      >
        Add Provider
      </v-btn>
    </v-toolbar>

    <!-- Filters and Search -->
    <v-card flat class="ma-4">
      <v-card-text class="pb-2">
        <v-row>
          <v-col cols="12" md="4">
            <v-text-field
              v-model="search"
              prepend-inner-icon="mdi-magnify"
              label="Search providers..."
              variant="outlined"
              density="compact"
              clearable
              hide-details
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-select
              v-model="statusFilter"
              :items="statusOptions"
              label="Status Filter"
              variant="outlined"
              density="compact"
              clearable
              hide-details
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-select
              v-model="connectionTypeFilter"
              :items="connectionTypes"
              item-title="name"
              item-value="id"
              label="Connection Type"
              variant="outlined"  
              density="compact"
              clearable
              hide-details
            />
          </v-col>
          <v-col cols="12" md="2">
            <v-btn
              color="info"
              variant="outlined"
              prepend-icon="mdi-chart-line"
              block
              @click="showStatsDialog = true"
            >
              Statistics
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Main Data Table -->
    <v-card class="ma-4">
      <v-data-table
        v-model:items-per-page="itemsPerPage"
        :headers="headers"
        :items="filteredProviders"
        :loading="loading"
        :search="search"
        class="elevation-1"
        item-value="id"  
      >        <!-- Provider Name with Icon -->
        <template #item.provider_name="{ item }">
          <div class="d-flex align-center">
            <v-avatar size="32" class="mr-3">
              <v-icon>mdi-server</v-icon>
            </v-avatar>
            <div>
              <div class="font-weight-medium">{{ item.provider_name }}</div>
              <div class="text-caption text-grey">ID: {{ item.id }}</div>
            </div>
          </div>
        </template>

        <!-- Connected Information -->
        <template #item.retailer="{ item }">
          <div v-if="item.statistics">
            <div class="font-weight-medium">
              {{ item.statistics.connection_count }} Connections
            </div>
            <div class="text-caption text-grey">
              {{ item.statistics.client_count }} clients, {{ item.statistics.retailer_count }} retailers
            </div>
          </div>
          <span v-else class="text-grey">No connections</span>
        </template>

        <!-- Connection Type -->
        <template #item.conntype_name="{ item }">
          <v-chip
            :color="getConnectionTypeColor(item.conntype_name)"
            size="small"
            variant="tonal"
          >
            <v-icon start size="small">{{ getConnectionTypeIcon(item.conntype_name) }}</v-icon>
            {{ item.conntype_name }}
          </v-chip>
        </template>        <!-- Connection Status -->
        <template #item.status="{ item }">
          <div class="d-flex align-center">
            <v-chip
              :color="item.status === 'Active' ? 'success' : 'error'"
              size="small"
              variant="tonal"
            >
              <v-icon start size="small">
                {{ item.status === 'Active' ? 'mdi-check-circle' : 'mdi-alert-circle' }}
              </v-icon>
              {{ item.status }}
            </v-chip>
            <v-btn
              icon="mdi-lan-connect"
              size="small"
              variant="text"
              :loading="testingConnection === item.id"
              @click="testConnection(item.id)"
            >
              <v-tooltip activator="parent">Test Connection</v-tooltip>
            </v-btn>
          </div>
        </template>        <!-- Connection Details -->
        <template #item.connection="{ item }">
          <div class="text-caption">
            <div v-if="item.sample_connection?.url">
              <strong>Sample:</strong> {{ item.sample_connection.url }}:{{ item.sample_connection.port }}
            </div>
            <div v-if="item.sample_connection?.username">
              <strong>User:</strong> {{ item.sample_connection.username }}
            </div>
            <div v-if="item.statistics">
              <strong>Connections:</strong> {{ item.statistics.active_connections }}/{{ item.statistics.connection_count }}
            </div>
          </div>
        </template>        <!-- Actions -->
        <template #item.actions="{ item }">
          <div class="d-flex ga-1">
            <v-btn
              icon="mdi-eye"
              size="small"
              variant="tonal"
              color="primary"
              @click="viewProvider(item)"
            >
              <v-icon>mdi-eye</v-icon>
              <v-tooltip activator="parent">View Details</v-tooltip>
            </v-btn>
            <v-btn
              icon="mdi-pencil"
              size="small"
              variant="tonal"
              color="secondary"
              @click="editProvider(item)"
            >
              <v-icon>mdi-pencil</v-icon>
              <v-tooltip activator="parent">Edit</v-tooltip>
            </v-btn>
            <v-btn
              icon="mdi-cog"
              size="small"
              variant="tonal"
              color="info"
              @click="configureProvider(item)"
            >
              <v-icon>mdi-cog</v-icon>
              <v-tooltip activator="parent">Configure</v-tooltip>
            </v-btn>
            <v-btn
              icon="mdi-delete"
              size="small"
              variant="tonal"
              color="error"
              @click="confirmDelete(item)"
            >              <v-icon>mdi-delete</v-icon>
              <v-tooltip activator="parent">Delete</v-tooltip>
            </v-btn>
          </div>
        </template>
      </v-data-table>
    </v-card>

    <!-- Create/Edit Dialog -->
    <v-dialog v-model="dialog" max-width="800px" scrollable>
      <v-card>
        <v-card-title>
          <span class="text-h5">
            {{ editingProvider ? 'Edit EDI Provider' : 'Create EDI Provider' }}
          </span>
        </v-card-title>        <v-card-text>
          <v-form ref="form" v-model="formValid">
            <div class="pa-4">
              <v-text-field
                v-model="formData.provider_name"
                label="Provider Name"
                :rules="[v => !!v || 'Provider name is required']"
                variant="outlined"
                density="compact"
                required
              />
              
              <v-select
                v-model="formData.conntype_id"
                :items="connectionTypes"
                item-title="name"
                item-value="id"
                label="Connection Type"
                :rules="[v => !!v || 'Connection type is required']"
                variant="outlined"
                density="compact"
                required
              />
            </div>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="closeDialog">Cancel</v-btn>
          <v-btn
            color="primary"
            :disabled="!formValid"
            :loading="saving"
            @click="saveProvider"
          >
            {{ editingProvider ? 'Update' : 'Create' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>    <!-- Provider Details Dialog -->
    <v-dialog v-model="detailsDialog" max-width="1000px" scrollable>
      <v-card v-if="selectedProvider">
        <v-card-title>
          <div class="d-flex align-center">
            <v-icon class="mr-2">mdi-server</v-icon>
            {{ selectedProvider.provider_name }}
            <v-spacer />
            <v-chip
              :color="selectedProvider.status === 'Active' ? 'success' : 'error'"
              variant="tonal"
            >
              {{ selectedProvider.status }}
            </v-chip>
          </div>
        </v-card-title>
        <v-card-text>
          <v-row>
            <v-col cols="12" md="6">
              <v-card variant="outlined">
                <v-card-title>Provider Information</v-card-title>
                <v-card-text>
                  <div class="mb-2"><strong>Provider ID:</strong> {{ selectedProvider.id }}</div>
                  <div class="mb-2"><strong>Name:</strong> {{ selectedProvider.provider_name }}</div>
                  <div class="mb-2"><strong>Connection Type:</strong> {{ selectedProvider.conntype_name }}</div>
                  <div class="mb-2"><strong>Status:</strong> {{ selectedProvider.status }}</div>
                </v-card-text>
              </v-card>
            </v-col>
            <v-col cols="12" md="6">
              <v-card variant="outlined">
                <v-card-title>Statistics</v-card-title>
                <v-card-text>
                  <div class="mb-2"><strong>Clients:</strong> {{ selectedProvider.statistics?.client_count || 0 }}</div>
                  <div class="mb-2"><strong>Retailers:</strong> {{ selectedProvider.statistics?.retailer_count || 0 }}</div>
                  <div class="mb-2"><strong>Total Connections:</strong> {{ selectedProvider.statistics?.connection_count || 0 }}</div>
                  <div class="mb-2"><strong>Active Connections:</strong> {{ selectedProvider.statistics?.active_connections || 0 }}</div>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
          
          <!-- Connected Clients -->
          <v-card variant="outlined" class="mt-4" v-if="selectedProvider.connected_clients && selectedProvider.connected_clients.length > 0">
            <v-card-title>Connected Clients</v-card-title>
            <v-card-text>
              <v-list density="compact">
                <v-list-item
                  v-for="client in selectedProvider.connected_clients"
                  :key="client.client_id"
                >
                  <v-list-item-title>{{ client.client_name }}</v-list-item-title>
                  <v-list-item-subtitle>{{ client.client_ws_url }}</v-list-item-subtitle>
                  <template #append>
                    <v-chip
                      :color="client.client_active ? 'success' : 'error'"
                      size="small"
                      variant="tonal"
                    >
                      {{ client.client_active ? 'Active' : 'Inactive' }}
                    </v-chip>
                  </template>
                </v-list-item>              </v-list>
            </v-card-text>
          </v-card>
          
          <!-- Connected Retailers -->
          <v-card variant="outlined" class="mt-4" v-if="selectedProvider.connected_retailers && selectedProvider.connected_retailers.length > 0">
            <v-card-title>Connected Retailers</v-card-title>
            <v-card-text>
              <v-list density="compact">
                <v-list-item
                  v-for="retailer in selectedProvider.connected_retailers"
                  :key="retailer.trdr_retailer"
                >
                  <v-list-item-title>{{ retailer.retailer_name }}</v-list-item-title>
                  <v-list-item-subtitle>{{ retailer.retailer_code }} - {{ retailer.retailer_tax_id }}</v-list-item-subtitle>
                </v-list-item>
              </v-list>
            </v-card-text>
          </v-card>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="detailsDialog = false">Close</v-btn>
          <v-btn color="primary" @click="editProvider(selectedProvider)">Edit</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Statistics Dialog -->
    <v-dialog v-model="showStatsDialog" max-width="800px">
      <v-card>
        <v-card-title>EDI Providers Statistics</v-card-title>
        <v-card-text>
          <v-row>
            <v-col cols="6" md="3">
              <v-card variant="tonal" color="primary">
                <v-card-text class="text-center">
                  <div class="text-h4">{{ providers.length }}</div>
                  <div class="text-caption">Total Providers</div>
                </v-card-text>
              </v-card>
            </v-col>
            <v-col cols="6" md="3">
              <v-card variant="tonal" color="success">
                <v-card-text class="text-center">
                  <div class="text-h4">{{ activeProviders }}</div>
                  <div class="text-caption">Active</div>
                </v-card-text>
              </v-card>
            </v-col>
            <v-col cols="6" md="3">
              <v-card variant="tonal" color="warning">
                <v-card-text class="text-center">
                  <div class="text-h4">{{ inactiveProviders }}</div>
                  <div class="text-caption">Inactive</div>
                </v-card-text>
              </v-card>
            </v-col>
            <v-col cols="6" md="3">
              <v-card variant="tonal" color="info">
                <v-card-text class="text-center">
                  <div class="text-h4">{{ connectionTypes.length }}</div>
                  <div class="text-caption">Connection Types</div>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="showStatsDialog = false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation -->
    <v-dialog v-model="deleteDialog" max-width="500px">
      <v-card>
        <v-card-title>Confirm Delete</v-card-title>
        <v-card-text>
          Are you sure you want to delete the EDI provider "{{ providerToDelete?.provider_name }}"?
          This action cannot be undone.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="deleteDialog = false">Cancel</v-btn>
          <v-btn
            color="error"
            :loading="deleting"
            @click="deleteProvider"
          >
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>    <!-- Connection Test Results -->
    <v-snackbar
      v-model="showTestResults"
      :color="testResults?.success ? 'success' : 'error'"
      timeout="5000"
    >
      <div>
        <strong>Connection Test:</strong>
        {{ testResults?.success ? 'Successful' : 'Failed' }}
      </div>
      <div v-if="testResults?.error" class="text-caption">
        {{ testResults.error }}
      </div>
    </v-snackbar>

    <!-- General Notifications -->
    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      :timeout="snackbar.timeout"
    >
      {{ snackbar.message }}
    </v-snackbar>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { api } from '@/services/api'

export default {
  name: 'EdiProviders',
  setup() {
      // Reactive data
    const loading = ref(false)
    const saving = ref(false)
    const deleting = ref(false)
    const testingConnection = ref(null)
    const providers = ref([])
    const connectionTypes = ref([])
    
    // Dialog states
    const dialog = ref(false)
    const detailsDialog = ref(false)
    const deleteDialog = ref(false)
    const showStatsDialog = ref(false)
    const showTestResults = ref(false)
      // Form data
    const formValid = ref(false)
    const editingProvider = ref(null)
    const selectedProvider = ref(null)
    const providerToDelete = ref(null)
    const testResults = ref(null)
    
    // Snackbar for notifications
    const snackbar = ref({
      show: false,
      message: '',
      color: 'success',
      timeout: 3000
    })
    
    // Filters
    const search = ref('')
    const statusFilter = ref(null)
    const connectionTypeFilter = ref(null)
    const itemsPerPage = ref(25)
      // Form data structure
    const defaultFormData = {
      provider_name: '',
      conntype_id: null
    }
    
    const formData = ref({ ...defaultFormData })
    
    // Table configuration
    const headers = [
      { title: 'Provider', key: 'provider_name', width: '200px' },
      { title: 'Retailer', key: 'retailer', width: '180px' },
      { title: 'Connection Type', key: 'conntype_name', width: '150px' },
      { title: 'Status', key: 'status', width: '120px' },
      { title: 'Connection', key: 'connection', width: '200px' },
      { title: 'Actions', key: 'actions', width: '150px', sortable: false }
    ]
    
    const statusOptions = [
      { title: 'Active', value: true },
      { title: 'Inactive', value: false }
    ]
    
    // Computed properties
    const filteredProviders = computed(() => {
      let filtered = providers.value
      
      if (statusFilter.value !== null) {
        filtered = filtered.filter(p => p.client?.active === statusFilter.value)
      }
      
      if (connectionTypeFilter.value) {
        filtered = filtered.filter(p => p.conntype_id === connectionTypeFilter.value)
      }
      
      return filtered
    })
    
    const activeProviders = computed(() => 
      providers.value.filter(p => p.client?.active).length
    )
    
    const inactiveProviders = computed(() => 
      providers.value.filter(p => !p.client?.active).length
    )
    
    // Methods
    const loadProviders = async () => {
      loading.value = true
      try {
        const response = await api.service('edi-providers').find()
        providers.value = response.data || []      } catch (error) {
        console.error('Error loading EDI providers:', error)
        showSnackbar('Error loading EDI providers: ' + error.message, 'error')
      } finally {
        loading.value = false
      }
    }
    
    const loadConnectionTypes = async () => { 
      try {
        const response = await api.service('edi-providers').getConnectionTypes()
        connectionTypes.value = response || []
      } catch (error) {
        console.error('Error loading connection types:', error)
      }
    }    
    const refreshProviders = async () => {
      await loadProviders()
      showSnackbar('EDI providers refreshed', 'success')
    }
    
    const openCreateDialog = () => {
      editingProvider.value = null
      formData.value = { ...defaultFormData }
      dialog.value = true
    }
    
    const editProvider = async (provider) => {
      try {
        editingProvider.value = provider
        
        // Only populate basic provider information
        formData.value = {
          provider_name: provider.provider_name || '',
          conntype_id: provider.conntype_id
        }
        dialog.value = true
        detailsDialog.value = false
      } catch (error) {
        console.error('Error preparing edit form:', error)
        showSnackbar('Error preparing edit form: ' + error.message, 'error')
      }
    }
      const viewProvider = async (provider) => {
      try {
        // Get detailed provider information
        const response = await api.service('edi-providers').get(provider.id)
        selectedProvider.value = response
        detailsDialog.value = true
      } catch (error) {
        console.error('Error loading provider details:', error)
        showSnackbar('Error loading provider details: ' + error.message, 'error')
      }
    }
      const configureProvider = (provider) => {
      // Open configuration dialog or navigate to configuration page
      console.log('Configure provider:', provider)
      showSnackbar('Configuration feature coming soon', 'info')
    }
    
    const saveProvider = async () => {
      if (!formValid.value) return
      
      saving.value = true
      try {        if (editingProvider.value) {
          await api.service('edi-providers').patch(editingProvider.value.id, formData.value)
          showSnackbar('EDI provider updated successfully', 'success')
        } else {
          await api.service('edi-providers').create(formData.value)
          showSnackbar('EDI provider created successfully', 'success')
        }
        
        await loadProviders()
        closeDialog()      } catch (error) {
        console.error('Error saving EDI provider:', error)
        showSnackbar('Error saving EDI provider: ' + error.message, 'error')
      } finally {
        saving.value = false
      }
    }
    
    const closeDialog = () => {
      dialog.value = false
      editingProvider.value = null
      formData.value = { ...defaultFormData }
    }
    
    const confirmDelete = (provider) => {
      providerToDelete.value = provider
      deleteDialog.value = true
    }
    
    const deleteProvider = async () => {
      if (!providerToDelete.value) return
      
      deleting.value = true
      try {
        await api.service('edi-providers').remove(providerToDelete.value.id)
        showSnackbar('EDI provider deleted successfully', 'success')
        await loadProviders()
        deleteDialog.value = false
        providerToDelete.value = null
      } catch (error) {
        console.error('Error deleting EDI provider:', error)
        showSnackbar('Error deleting EDI provider: ' + error.message, 'error')
      } finally {
        deleting.value = false
      }
    }
    
    const testConnection = async (providerId) => {
      testingConnection.value = providerId
      try {
        const response = await api.service('edi-providers').testConnection({ id: providerId })
        testResults.value = response
        showTestResults.value = true
      } catch (error) {
        console.error('Error testing connection:', error)
        testResults.value = { success: false, error: error.message }
        showTestResults.value = true
      } finally {
        testingConnection.value = null
      }
    }
      // Utility methods
    const showSnackbar = (message, color = 'success', timeout = 3000) => {
      snackbar.value = {
        show: true,
        message,
        color,
        timeout
      }
    }
    
    const getConnectionTypeColor = (type) => {
      const colors = {
        'SFTP': 'blue',
        'FTP': 'green', 
        'FTPS': 'purple',
        'HTTP': 'orange',
        'HTTPS': 'red'
      }
      return colors[type] || 'grey'
    }
    
    const getConnectionTypeIcon = (type) => {
      const icons = {
        'SFTP': 'mdi-folder-lock',
        'FTP': 'mdi-folder-network',
        'FTPS': 'mdi-folder-key',
        'HTTP': 'mdi-web',
        'HTTPS': 'mdi-web-check'
      }
      return icons[type] || 'mdi-connection'
    }
      // Lifecycle
    onMounted(async () => {
      await Promise.all([
        loadProviders(),
        loadConnectionTypes()
      ])
    })
    
    return {
      // Reactive data
      loading,
      saving,
      deleting,
      testingConnection,      providers,
      connectionTypes,
      
      // Dialog states
      dialog,
      detailsDialog,
      deleteDialog,
      showStatsDialog,
      showTestResults,      // Form data
      formValid,
      editingProvider,
      selectedProvider,
      providerToDelete,
      testResults,
      formData,
      snackbar,
      
      // Filters
      search,
      statusFilter,
      connectionTypeFilter,
      itemsPerPage,
      
      // Configuration
      headers,
      statusOptions,
      
      // Computed
      filteredProviders,
      activeProviders,
      inactiveProviders,
      
      // Methods
      refreshProviders,
      openCreateDialog,
      editProvider,
      viewProvider,
      configureProvider,
      saveProvider,
      closeDialog,
      confirmDelete,      deleteProvider,
      testConnection,
      showSnackbar,
      getConnectionTypeColor,
      getConnectionTypeIcon
    }
  }
}
</script>

<style scoped>
.v-card {
  transition: all 0.3s ease;
}

.v-card:hover {
  box-shadow: 0 4px 8px rgba(0,0,0,0.12);
}

/* Ensure action buttons are visible */
.v-btn {
  min-width: auto !important;
}

.v-btn[variant="text"] {
  opacity: 1 !important;
}
</style>
