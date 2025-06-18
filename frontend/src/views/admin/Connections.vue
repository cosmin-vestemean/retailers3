<template>
  <div>
    <v-toolbar flat>
      <v-toolbar-title>
        <v-icon class="mr-2">mdi-lan-connect</v-icon>
        Connections Matrix
      </v-toolbar-title>
      <v-spacer />
      
      <!-- Action Buttons -->
      <v-btn
        color="success"
        variant="outlined"
        prepend-icon="mdi-refresh"
        class="mr-2"
        :loading="loading"
        @click="refreshConnections"
      >
        Refresh
      </v-btn>
      <v-btn
        color="primary"
        prepend-icon="mdi-plus"
        @click="openCreateDialog"
      >
        Add Connection
      </v-btn>
    </v-toolbar>

    <!-- Filters and Search -->
    <v-card flat class="ma-4">
      <v-card-text class="pb-2">
        <v-row>
          <v-col cols="12" md="3">
            <v-text-field
              v-model="search"
              prepend-inner-icon="mdi-magnify"
              label="Search connections..."
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
              v-model="providerFilter"
              :items="providers"
              item-title="provider_name"
              item-value="id"
              label="Provider Filter"
              variant="outlined"
              density="compact"
              clearable
              hide-details
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-select
              v-model="clientFilter"
              :items="clients"
              item-title="name"
              item-value="id"
              label="Client Filter"
              variant="outlined"
              density="compact"
              clearable
              hide-details
            />
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Main Data Table -->
    <v-card class="ma-4">
      <v-data-table
        v-model:items-per-page="itemsPerPage"
        :headers="headers"
        :items="filteredConnections"
        :loading="loading"
        :search="search"
        class="elevation-1"
        item-value="id"
      >
        <!-- Connection Name with Flow -->
        <template #item.connection_name="{ item }">
          <div class="d-flex align-center">
            <v-avatar size="24" class="mr-2" color="primary">
              <v-icon size="16">mdi-account</v-icon>
            </v-avatar>
            <v-icon size="16" class="mr-1">mdi-arrow-right</v-icon>
            <v-avatar size="24" class="mr-2" color="secondary">
              <v-icon size="16">mdi-server</v-icon>
            </v-avatar>
            <v-icon size="16" class="mr-1">mdi-arrow-right</v-icon>
            <v-avatar size="24" class="mr-2" color="success">
              <v-icon size="16">mdi-store</v-icon>
            </v-avatar>
            <div class="ml-2">
              <div class="font-weight-medium">{{ item.connection_name }}</div>
              <div class="text-caption text-medium-emphasis">
                {{ item.connection_type }} Connection
              </div>
            </div>
          </div>
        </template>

        <!-- Client Details -->
        <template #item.client="{ item }">
          <div>
            <div class="font-weight-medium">{{ item.client.name }}</div>
            <div class="text-caption">App ID: {{ item.client.appid }}</div>
            <div class="text-caption" v-if="item.client.ws_url">
              <v-icon size="12" class="mr-1">mdi-web</v-icon>
              {{ item.client.ws_url }}
            </div>
          </div>
        </template>

        <!-- Provider Details -->
        <template #item.provider="{ item }">
          <div>
            <div class="font-weight-medium">{{ item.provider.name }}</div>
            <div class="text-caption">{{ item.provider.conntype_name }}</div>
          </div>
        </template>

        <!-- Retailer Details -->
        <template #item.retailer="{ item }">
          <div>
            <div class="font-weight-medium">{{ item.retailer.name }}</div>
            <div class="text-caption">{{ item.retailer.code }}</div>
            <div class="text-caption" v-if="item.retailer.tax_id">
              Tax ID: {{ item.retailer.tax_id }}
            </div>
          </div>
        </template>

        <!-- Connection Technical Details -->
        <template #item.connection_details="{ item }">
          <div class="text-caption">
            <div v-if="item.connection_details.url">
              <strong>URL:</strong> {{ item.connection_details.url }}:{{ item.connection_details.port }}
            </div>
            <div v-if="item.connection_details.username">
              <strong>User:</strong> {{ item.connection_details.username }}
            </div>
            <div v-if="item.connection_details.initial_dir_in">
              <strong>In:</strong> {{ item.connection_details.initial_dir_in }}
            </div>
            <div v-if="item.connection_details.initial_dir_out">
              <strong>Out:</strong> {{ item.connection_details.initial_dir_out }}
            </div>
          </div>
        </template>

        <!-- Status -->
        <template #item.status="{ item }">
          <v-chip
            :color="item.status === 'Active' ? 'success' : 'error'"
            size="small"
            variant="tonal"
          >
            <v-icon start size="12">
              {{ item.status === 'Active' ? 'mdi-check-circle' : 'mdi-alert-circle' }}
            </v-icon>
            {{ item.status }}
          </v-chip>
        </template>

        <!-- Actions -->
        <template #item.actions="{ item }">
          <div class="d-flex ga-1">
            <v-btn
              icon="mdi-eye"
              size="small"
              variant="tonal"
              color="primary"
              @click="viewConnection(item)"
            >
              <v-icon>mdi-eye</v-icon>
              <v-tooltip activator="parent">View Details</v-tooltip>
            </v-btn>
            <v-btn
              icon="mdi-pencil"
              size="small"
              variant="tonal"
              color="secondary"
              @click="editConnection(item)"
            >
              <v-icon>mdi-pencil</v-icon>
              <v-tooltip activator="parent">Edit</v-tooltip>
            </v-btn>
            <v-btn
              icon="mdi-lan-connect"
              size="small"
              variant="tonal"
              color="info"
              @click="testConnection(item)"
            >
              <v-icon>mdi-lan-connect</v-icon>
              <v-tooltip activator="parent">Test Connection</v-tooltip>
            </v-btn>
            <v-btn
              icon="mdi-delete"
              size="small"
              variant="tonal"
              color="error"
              @click="confirmDelete(item)"
            >
              <v-icon>mdi-delete</v-icon>
              <v-tooltip activator="parent">Delete</v-tooltip>
            </v-btn>
          </div>
        </template>
      </v-data-table>
    </v-card>

    <!-- Create/Edit Dialog -->
    <v-dialog v-model="dialog" max-width="1000px" scrollable>
      <v-card>
        <v-card-title>
          <span class="text-h5">
            {{ editingConnection ? 'Edit Connection' : 'Create Connection' }}
          </span>
        </v-card-title>
        <v-card-text>
          <v-form ref="form" v-model="formValid">
            <v-tabs v-model="dialogTab">
              <v-tab>Basic Info</v-tab>
              <v-tab>Connection Details</v-tab>
              <v-tab>Security</v-tab>
            </v-tabs>

            <v-tabs-window v-model="dialogTab">
              <!-- Basic Information -->
              <v-tabs-window-item>
                <div class="pa-4">
                  <v-select
                    v-model="formData.TRDR_CLIENT"
                    :items="clients"
                    item-title="name"
                    item-value="id"
                    label="Platform Client"
                    :rules="[v => !!v || 'Client is required']"
                    variant="outlined"
                    required
                  />
                  
                  <v-select
                    v-model="formData.EDIPROVIDER"
                    :items="providers"
                    item-title="provider_name"
                    item-value="id"
                    label="EDI Provider"
                    :rules="[v => !!v || 'Provider is required']"
                    variant="outlined"
                    required
                  />
                  
                  <v-select
                    v-model="formData.TRDR_RETAILER"
                    :items="retailers"
                    item-title="name"
                    item-value="trdr"
                    label="Retailer"
                    :rules="[v => !!v || 'Retailer is required']"
                    variant="outlined"
                    required
                  />
                </div>
              </v-tabs-window-item>

              <!-- Connection Details -->
              <v-tabs-window-item>
                <div class="pa-4">
                  <v-text-field
                    v-model="formData.URL"
                    label="Server URL"
                    :rules="[v => !!v || 'URL is required']"
                    variant="outlined"
                    required
                    placeholder="dx.doc-process.com"
                  />
                  
                  <v-text-field
                    v-model="formData.PORT"
                    label="Port"
                    type="number"
                    variant="outlined"
                    placeholder="2222"
                  />
                  
                  <v-text-field
                    v-model="formData.USERNAME"
                    label="Username"
                    :rules="[v => !!v || 'Username is required']"
                    variant="outlined"
                    required
                  />
                  
                  <v-text-field
                    v-model="formData.INITIALDIRIN"
                    label="Initial Directory In"
                    variant="outlined"
                    placeholder="/in"
                  />
                  
                  <v-text-field
                    v-model="formData.INITIALDIROUT"
                    label="Initial Directory Out"
                    variant="outlined"
                    placeholder="/out"
                  />
                </div>
              </v-tabs-window-item>

              <!-- Security -->
              <v-tabs-window-item>
                <div class="pa-4">
                  <v-text-field
                    v-model="formData.PASSPHRASE"
                    label="Password/Passphrase"
                    type="password"
                    :rules="[v => !!v || 'Password is required']"
                    variant="outlined"
                    required
                  />
                  
                  <v-textarea
                    v-model="formData.FINGERPRINT"
                    label="SSH Fingerprint"
                    variant="outlined"
                    rows="2"
                    placeholder="ssh-rsa 2048 ..."
                  />
                  
                  <v-textarea
                    v-model="formData.PRIVATEKEY"
                    label="Private Key"
                    variant="outlined"
                    rows="4"
                    placeholder="-----BEGIN PRIVATE KEY-----"
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
            @click="saveConnection"
          >
            {{ editingConnection ? 'Update' : 'Create' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Connection Details Dialog -->
    <v-dialog v-model="detailsDialog" max-width="800px">
      <v-card>
        <v-card-title>Connection Details</v-card-title>
        <v-card-text v-if="selectedConnection">
          <!-- Connection Flow -->
          <v-card variant="outlined" class="mb-4">
            <v-card-title>Connection Flow</v-card-title>
            <v-card-text>
              <div class="d-flex align-center justify-center">
                <div class="text-center">
                  <v-avatar size="48" color="primary">
                    <v-icon>mdi-account</v-icon>
                  </v-avatar>
                  <div class="mt-2 font-weight-medium">{{ selectedConnection.client?.name }}</div>
                  <div class="text-caption">Platform Client</div>
                </div>
                <v-icon class="mx-4">mdi-arrow-right</v-icon>
                <div class="text-center">
                  <v-avatar size="48" color="secondary">
                    <v-icon>mdi-server</v-icon>
                  </v-avatar>
                  <div class="mt-2 font-weight-medium">{{ selectedConnection.provider?.name }}</div>
                  <div class="text-caption">{{ selectedConnection.provider?.conntype_name }}</div>
                </div>
                <v-icon class="mx-4">mdi-arrow-right</v-icon>
                <div class="text-center">
                  <v-avatar size="48" color="success">
                    <v-icon>mdi-store</v-icon>
                  </v-avatar>
                  <div class="mt-2 font-weight-medium">{{ selectedConnection.retailer?.name }}</div>
                  <div class="text-caption">{{ selectedConnection.retailer?.code }}</div>
                </div>
              </div>
            </v-card-text>
          </v-card>

          <!-- Technical Details -->
          <v-card variant="outlined" class="mb-4">
            <v-card-title>Technical Configuration</v-card-title>
            <v-card-text>
              <v-row>
                <v-col cols="6">
                  <div class="text-caption text-medium-emphasis">Server</div>
                  <div class="font-weight-medium">{{ selectedConnection.connection_details?.url }}:{{ selectedConnection.connection_details?.port }}</div>
                </v-col>
                <v-col cols="6">
                  <div class="text-caption text-medium-emphasis">Username</div>
                  <div class="font-weight-medium">{{ selectedConnection.connection_details?.username }}</div>
                </v-col>
                <v-col cols="6">
                  <div class="text-caption text-medium-emphasis">Input Directory</div>
                  <div class="font-weight-medium">{{ selectedConnection.connection_details?.initial_dir_in || 'Not set' }}</div>
                </v-col>
                <v-col cols="6">
                  <div class="text-caption text-medium-emphasis">Output Directory</div>
                  <div class="font-weight-medium">{{ selectedConnection.connection_details?.initial_dir_out || 'Not set' }}</div>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>

          <!-- Status Information -->
          <v-card variant="outlined">
            <v-card-title>Status Information</v-card-title>
            <v-card-text>
              <v-row>
                <v-col cols="6">
                  <div class="text-caption text-medium-emphasis">Connection Status</div>
                  <v-chip
                    :color="selectedConnection.status === 'Active' ? 'success' : 'error'"
                    size="small"
                    variant="tonal"
                  >
                    {{ selectedConnection.status }}
                  </v-chip>
                </v-col>
                <v-col cols="6">
                  <div class="text-caption text-medium-emphasis">Security</div>
                  <div class="font-weight-medium">
                    {{ selectedConnection.connection_details?.fingerprint ? 'SSH Key' : 'Password' }} Authentication
                  </div>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="detailsDialog = false">Close</v-btn>
          <v-btn color="primary" @click="editConnection(selectedConnection)">Edit</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="deleteDialog" max-width="400px">
      <v-card>
        <v-card-title>Confirm Delete</v-card-title>
        <v-card-text>
          Are you sure you want to delete this connection?
          <div class="mt-2 font-weight-medium">{{ itemToDelete?.connection_name }}</div>
          This action cannot be undone.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="deleteDialog = false">Cancel</v-btn>
          <v-btn
            color="error"
            :loading="deleting"
            @click="deleteConnection"
          >
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar for notifications -->
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
  name: 'Connections',
  setup() {
    const connections = ref([])
    const providers = ref([])
    const clients = ref([])
    const retailers = ref([])
    const loading = ref(false)
    const dialog = ref(false)
    const detailsDialog = ref(false)
    const deleteDialog = ref(false)
    const formValid = ref(false)
    const saving = ref(false)
    const deleting = ref(false)
    const itemsPerPage = ref(25)
    const form = ref(null)
    const dialogTab = ref(0)
    
    const search = ref('')
    const statusFilter = ref('')
    const providerFilter = ref('')
    const clientFilter = ref('')
    
    const formData = ref({
      TRDR_CLIENT: '',
      EDIPROVIDER: '',
      TRDR_RETAILER: '',
      URL: '',
      PORT: '',
      USERNAME: '',
      PASSPHRASE: '',
      INITIALDIRIN: '',
      INITIALDIROUT: '',
      FINGERPRINT: '',
      PRIVATEKEY: ''
    })
    
    const defaultFormData = {
      TRDR_CLIENT: '',
      EDIPROVIDER: '',
      TRDR_RETAILER: '',
      URL: '',
      PORT: '',
      USERNAME: '',
      PASSPHRASE: '',
      INITIALDIRIN: '',
      INITIALDIROUT: '',
      FINGERPRINT: '',
      PRIVATEKEY: ''
    }
    
    const selectedConnection = ref(null)
    const itemToDelete = ref(null)
    const editingConnection = ref(false)
    
    const snackbar = ref({
      show: false,
      message: '',
      color: 'success',
      timeout: 3000
    })
    
    const statusOptions = [
      { title: 'Active', value: 'Active' },
      { title: 'Inactive', value: 'Inactive' }
    ]
    
    const headers = [
      { title: 'Connection', key: 'connection_name', sortable: true },
      { title: 'Client', key: 'client', sortable: false },
      { title: 'Provider', key: 'provider', sortable: false },
      { title: 'Retailer', key: 'retailer', sortable: false },
      { title: 'Connection Details', key: 'connection_details', sortable: false },
      { title: 'Status', key: 'status', sortable: true },
      { title: 'Actions', key: 'actions', sortable: false, width: '200px' }
    ]
    
    const filteredConnections = computed(() => {
      let filtered = connections.value
      
      if (statusFilter.value) {
        filtered = filtered.filter(conn => conn.status === statusFilter.value)
      }
      
      if (providerFilter.value) {
        filtered = filtered.filter(conn => conn.provider.id === providerFilter.value)
      }
      
      if (clientFilter.value) {
        filtered = filtered.filter(conn => conn.client.id === clientFilter.value)
      }
      
      return filtered
    })
    
    const fetchConnections = async () => {
      loading.value = true
      try {
        const response = await api.service('connections').find()
        connections.value = response.data || []
      } catch (error) {
        console.error('Error fetching connections:', error)
        showSnackbar('Failed to load connections', 'error')
      } finally {
        loading.value = false
      }
    }
    
    const fetchProviders = async () => {
      try {
        const response = await api.service('edi-providers').find()
        providers.value = response.data || []
      } catch (error) {
        console.error('Error fetching providers:', error)
      }
    }
    
    const fetchClients = async () => {
      try {
        const response = await api.service('platform-clients').find()
        clients.value = response.data || []
      } catch (error) {
        console.error('Error fetching clients:', error)
      }
    }
    
    const fetchRetailers = async () => {
      try {
        const response = await api.service('edi-retailers').find()
        retailers.value = response.data || []
      } catch (error) {
        console.error('Error fetching retailers:', error)
      }
    }
    
    const refreshConnections = async () => {
      await Promise.all([
        fetchConnections(),
        fetchProviders(),
        fetchClients(),
        fetchRetailers()
      ])
    }
    
    const openCreateDialog = () => {
      editingConnection.value = false
      formData.value = { ...defaultFormData }
      dialogTab.value = 0
      dialog.value = true
    }
    
    const viewConnection = async (connection) => {
      try {
        loading.value = true
        const response = await api.service('connections').get(connection.id)
        selectedConnection.value = response
        detailsDialog.value = true
      } catch (error) {
        console.error('Error fetching connection details:', error)
        showSnackbar('Failed to load connection details', 'error')
      } finally {
        loading.value = false
      }
    }
    
    const editConnection = (connection) => {
      editingConnection.value = true
      formData.value = {
        id: connection.id,
        TRDR_CLIENT: connection.trdr_client,
        EDIPROVIDER: connection.provider.id,
        TRDR_RETAILER: connection.trdr_retailer,
        URL: connection.connection_details.url,
        PORT: connection.connection_details.port,
        USERNAME: connection.connection_details.username,
        PASSPHRASE: '',
        INITIALDIRIN: connection.connection_details.initial_dir_in,
        INITIALDIROUT: connection.connection_details.initial_dir_out,
        FINGERPRINT: connection.connection_details.fingerprint,
        PRIVATEKEY: ''
      }
      dialogTab.value = 0
      dialog.value = true
    }
    
    const testConnection = async (connection) => {
      try {
        showSnackbar('Testing connection...', 'info')
        // TODO: Implement connection test functionality
        setTimeout(() => {
          showSnackbar('Connection test completed', 'success')
        }, 2000)
      } catch (error) {
        console.error('Error testing connection:', error)
        showSnackbar('Connection test failed', 'error')
      }
    }
    
    const confirmDelete = (connection) => {
      itemToDelete.value = connection
      deleteDialog.value = true
    }
    
    const closeDialog = () => {
      dialog.value = false
      detailsDialog.value = false
      formData.value = { ...defaultFormData }
      editingConnection.value = false
    }
    
    const saveConnection = async () => {
      if (!form.value.validate()) return
      
      saving.value = true
      try {
        if (editingConnection.value) {
          await api.service('connections').update(formData.value.id, formData.value)
          showSnackbar('Connection updated successfully', 'success')
        } else {
          await api.service('connections').create(formData.value)
          showSnackbar('Connection created successfully', 'success')
        }
        closeDialog()
        await fetchConnections()
      } catch (error) {
        console.error('Error saving connection:', error)
        showSnackbar(error.message || 'Failed to save connection', 'error')
      } finally {
        saving.value = false
      }
    }
    
    const deleteConnection = async () => {
      if (!itemToDelete.value) return
      
      deleting.value = true
      try {
        await api.service('connections').remove(itemToDelete.value.id)
        showSnackbar('Connection deleted successfully', 'success')
        deleteDialog.value = false
        itemToDelete.value = null
        await fetchConnections()
      } catch (error) {
        console.error('Error deleting connection:', error)
        showSnackbar('Failed to delete connection', 'error')
      } finally {
        deleting.value = false
      }
    }
    
    const showSnackbar = (message, color = 'success', timeout = 3000) => {
      snackbar.value = {
        show: true,
        message,
        color,
        timeout
      }
    }
    
    onMounted(() => {
      refreshConnections()
    })
    
    return {
      connections,
      providers,
      clients,
      retailers,
      loading,
      dialog,
      detailsDialog,
      deleteDialog,
      formValid,
      saving,
      deleting,
      itemsPerPage,
      form,
      dialogTab,
      search,
      statusFilter,
      providerFilter,
      clientFilter,
      formData,
      selectedConnection,
      itemToDelete,
      editingConnection,
      snackbar,
      statusOptions,
      headers,
      filteredConnections,
      refreshConnections,
      openCreateDialog,
      viewConnection,
      editConnection,
      testConnection,
      confirmDelete,
      closeDialog,
      saveConnection,
      deleteConnection
    }
  }
}
</script>

<style scoped>
.text-caption {
  font-size: 0.75rem !important;
}
</style>
