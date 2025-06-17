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
      >
        <!-- Provider Name with Icon -->
        <template #item.provider_name="{ item }">
          <div class="d-flex align-center">
            <v-avatar size="32" class="mr-3">
              <v-icon>mdi-server</v-icon>
            </v-avatar>
            <div>
              <div class="font-weight-medium">{{ item.provider_name }}</div>
              <div class="text-caption text-grey">ID: {{ item.provider_id }}</div>
            </div>
          </div>
        </template>

        <!-- Retailer Information -->
        <template #item.retailer="{ item }">
          <div v-if="item.retailer">
            <div class="font-weight-medium">{{ item.retailer.name }}</div>
            <div class="text-caption text-grey">
              {{ item.retailer.code }} | {{ item.retailer.tax_id }}
            </div>
          </div>
          <span v-else class="text-grey">N/A</span>
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
        </template>

        <!-- Connection Status -->
        <template #item.status="{ item }">
          <div class="d-flex align-center">
            <v-chip
              :color="item.client?.active ? 'success' : 'error'"
              size="small"
              variant="tonal"
            >
              <v-icon start size="small">
                {{ item.client?.active ? 'mdi-check-circle' : 'mdi-alert-circle' }}
              </v-icon>
              {{ item.client?.active ? 'Active' : 'Inactive' }}
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
        </template>

        <!-- Connection Details -->
        <template #item.connection="{ item }">
          <div class="text-caption">
            <div v-if="item.connection_details?.url">
              <strong>Host:</strong> {{ item.connection_details.url }}:{{ item.connection_details.port }}
            </div>
            <div v-if="item.connection_details?.username">
              <strong>User:</strong> {{ item.connection_details.username }}
            </div>
            <div v-if="item.client?.ws_url">
              <strong>S1 WS:</strong> {{ item.client.ws_url }}
            </div>
          </div>
        </template>

        <!-- Actions -->
        <template #item.actions="{ item }">
          <div class="d-flex">
            <v-btn
              icon="mdi-eye"
              size="small"
              variant="text"
              @click="viewProvider(item)"
            >
              <v-tooltip activator="parent">View Details</v-tooltip>
            </v-btn>
            <v-btn
              icon="mdi-pencil"
              size="small"
              variant="text"
              @click="editProvider(item)"
            >
              <v-tooltip activator="parent">Edit</v-tooltip>
            </v-btn>
            <v-btn
              icon="mdi-cog"
              size="small"
              variant="text"
              @click="configureProvider(item)"
            >
              <v-tooltip activator="parent">Configure</v-tooltip>
            </v-btn>
            <v-btn
              icon="mdi-delete"
              size="small"
              variant="text"
              color="error"
              @click="confirmDelete(item)"
            >
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
        </v-card-title>
        <v-card-text>
          <v-form ref="form" v-model="formValid">
            <v-tabs v-model="dialogTab">
              <v-tab>Basic Info</v-tab>
              <v-tab>Connection</v-tab>
              <v-tab>S1 Integration</v-tab>
            </v-tabs>

            <v-tabs-window v-model="dialogTab">
              <!-- Basic Information -->
              <v-tabs-window-item>
                <div class="pa-4">
                  <v-text-field
                    v-model="formData.provider_name"
                    label="Provider Name"
                    :rules="[v => !!v || 'Provider name is required']"
                    variant="outlined"
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
                    required
                  />

                  <v-autocomplete
                    v-model="formData.trdr_retailer"
                    :items="retailers"
                    item-title="name"
                    item-value="trdr"
                    label="Retailer"
                    variant="outlined"
                    clearable
                  />
                </div>
              </v-tabs-window-item>

              <!-- Connection Settings -->
              <v-tabs-window-item>
                <div class="pa-4">
                  <v-text-field
                    v-model="formData.url"
                    label="Host/URL"
                    :rules="[v => !!v || 'Host is required']"
                    variant="outlined"
                    required
                  />

                  <v-text-field
                    v-model="formData.port"
                    label="Port"
                    type="number"
                    variant="outlined"
                  />

                  <v-text-field
                    v-model="formData.username"
                    label="Username"
                    variant="outlined"
                  />

                  <v-text-field
                    v-model="formData.passphrase"
                    label="Password/Passphrase"
                    type="password"
                    variant="outlined"
                  />

                  <v-text-field
                    v-model="formData.initial_dir_in"
                    label="Incoming Directory"
                    variant="outlined"
                  />

                  <v-text-field
                    v-model="formData.initial_dir_out" 
                    label="Outgoing Directory"
                    variant="outlined"
                  />
                </div>
              </v-tabs-window-item>

              <!-- S1 Integration -->
              <v-tabs-window-item>
                <div class="pa-4">
                  <v-text-field
                    v-model="formData.ws_url"
                    label="S1 Web Service URL"
                    variant="outlined"
                  />

                  <v-text-field
                    v-model="formData.ws_user"
                    label="S1 Web Service User"
                    variant="outlined"
                  />

                  <v-text-field
                    v-model="formData.ws_password"
                    label="S1 Web Service Password"
                    type="password" 
                    variant="outlined"
                  />

                  <v-text-field
                    v-model="formData.ws_app_id"
                    label="S1 Application ID"
                    type="number"
                    variant="outlined"
                  />

                  <v-switch
                    v-model="formData.client_active"
                    label="S1 Integration Active"
                    color="primary"
                  />
                </div>
              </v-tabs-window-item>
            </v-tabs-window>
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
    </v-dialog>

    <!-- Provider Details Dialog -->
    <v-dialog v-model="detailsDialog" max-width="1000px" scrollable>
      <v-card v-if="selectedProvider">
        <v-card-title>
          <div class="d-flex align-center">
            <v-icon class="mr-2">mdi-server</v-icon>
            {{ selectedProvider.provider_name }}
            <v-spacer />
            <v-chip
              :color="selectedProvider.client?.active ? 'success' : 'error'"
              variant="tonal"
            >
              {{ selectedProvider.client?.active ? 'Active' : 'Inactive' }}
            </v-chip>
          </div>
        </v-card-title>
        <v-card-text>
          <v-row>
            <v-col cols="12" md="6">
              <v-card variant="outlined">
                <v-card-title>Connection Details</v-card-title>
                <v-card-text>
                  <div class="mb-2"><strong>Type:</strong> {{ selectedProvider.conntype_name }}</div>
                  <div class="mb-2"><strong>Host:</strong> {{ selectedProvider.connection_details?.url }}</div>
                  <div class="mb-2"><strong>Port:</strong> {{ selectedProvider.connection_details?.port }}</div>
                  <div class="mb-2"><strong>Username:</strong> {{ selectedProvider.connection_details?.username }}</div>
                  <div class="mb-2"><strong>Incoming Dir:</strong> {{ selectedProvider.connection_details?.initial_dir_in }}</div>
                  <div class="mb-2"><strong>Outgoing Dir:</strong> {{ selectedProvider.connection_details?.initial_dir_out }}</div>
                </v-card-text>
              </v-card>
            </v-col>
            <v-col cols="12" md="6">
              <v-card variant="outlined">
                <v-card-title>S1 Integration</v-card-title>
                <v-card-text>
                  <div class="mb-2"><strong>WS URL:</strong> {{ selectedProvider.client?.ws_url }}</div>
                  <div class="mb-2"><strong>WS User:</strong> {{ selectedProvider.client?.ws_user }}</div>
                  <div class="mb-2"><strong>Company:</strong> {{ selectedProvider.client?.company }}</div>
                  <div class="mb-2"><strong>Branch:</strong> {{ selectedProvider.client?.branch }}</div>
                  <div class="mb-2">
                    <strong>Status:</strong>
                    <v-chip
                      :color="selectedProvider.client?.active ? 'success' : 'error'"
                      size="small"
                      variant="tonal"
                    >
                      {{ selectedProvider.client?.active ? 'Active' : 'Inactive' }}
                    </v-chip>
                  </div>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
          
          <v-card variant="outlined" class="mt-4" v-if="selectedProvider.retailer">
            <v-card-title>Retailer Information</v-card-title>
            <v-card-text>
              <div class="mb-2"><strong>Name:</strong> {{ selectedProvider.retailer.name }}</div>
              <div class="mb-2"><strong>Code:</strong> {{ selectedProvider.retailer.code }}</div>
              <div class="mb-2"><strong>Tax ID:</strong> {{ selectedProvider.retailer.tax_id }}</div>
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
import api from '@/services/api'

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
    const retailers = ref([])
    
    // Dialog states
    const dialog = ref(false)
    const detailsDialog = ref(false)
    const deleteDialog = ref(false)
    const showStatsDialog = ref(false)
    const showTestResults = ref(false)
    
    // Form data
    const dialogTab = ref(0)
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
      conntype_id: null,
      trdr_retailer: null,
      url: '',
      port: null,
      username: '',
      passphrase: '',
      initial_dir_in: '',
      initial_dir_out: '',
      ws_url: '',
      ws_user: '',
      ws_password: '',
      ws_app_id: null,
      client_active: true
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
    
    const loadRetailers = async () => {
      try {
        // Mock retailers for now - implement actual API call
        retailers.value = [
          { trdr: 1, name: 'Auchan', code: 'AUCH' },
          { trdr: 2, name: 'Dedeman', code: 'DEDE' },
          { trdr: 3, name: 'Carrefour', code: 'CARR' }
        ]
      } catch (error) {
        console.error('Error loading retailers:', error)
      }
    }
      const refreshProviders = async () => {
      await loadProviders()
      showSnackbar('EDI providers refreshed', 'success')
    }
    
    const openCreateDialog = () => {
      editingProvider.value = null
      formData.value = { ...defaultFormData }
      dialogTab.value = 0
      dialog.value = true
    }
    
    const editProvider = (provider) => {
      editingProvider.value = provider
      formData.value = {
        provider_name: provider.provider_name || '',
        conntype_id: provider.conntype_id,
        trdr_retailer: provider.trdr_retailer,
        url: provider.connection_details?.url || '',
        port: provider.connection_details?.port,
        username: provider.connection_details?.username || '',
        passphrase: '', // Don't populate password
        initial_dir_in: provider.connection_details?.initial_dir_in || '',
        initial_dir_out: provider.connection_details?.initial_dir_out || '',
        ws_url: provider.client?.ws_url || '',
        ws_user: provider.client?.ws_user || '',
        ws_password: '', // Don't populate password
        ws_app_id: provider.client?.ws_app_id,
        client_active: provider.client?.active || false
      }
      dialogTab.value = 0
      dialog.value = true
      detailsDialog.value = false
    }
    
    const viewProvider = (provider) => {
      selectedProvider.value = provider
      detailsDialog.value = true
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
        loadConnectionTypes(),
        loadRetailers()
      ])
    })
    
    return {
      // Reactive data
      loading,
      saving,
      deleting,
      testingConnection,
      providers,
      connectionTypes,
      retailers,
      
      // Dialog states
      dialog,
      detailsDialog,
      deleteDialog,
      showStatsDialog,
      showTestResults,
        // Form data
      dialogTab,
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
</style>
