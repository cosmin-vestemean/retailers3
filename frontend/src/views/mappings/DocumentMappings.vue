<template>
  <div>
    <v-toolbar flat>
      <v-toolbar-title>
        <v-icon class="mr-2">mdi-file-document</v-icon>
        Document Mappings
      </v-toolbar-title>
      <v-spacer />
      <v-btn
        color="secondary"
        prepend-icon="mdi-auto-fix"
        class="mr-2"
        @click="$router.push('/mappings/wizard')"
      >
        Mapping Wizard
      </v-btn>
      <v-btn
        color="primary"
        prepend-icon="mdi-plus"
        @click="openCreateDialog"
      >
        Add Document Mapping
      </v-btn>
    </v-toolbar>

    <!-- Filters -->
    <v-card flat class="ma-4">
      <v-card-text>
        <v-row>
          <v-col cols="12" md="3">
            <v-select
              v-model="filters.selectedClient"
              :items="clients"
              item-title="name"
              item-value="id"
              label="Client"
              clearable
              @update:model-value="fetchDocumentMappings"
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-select
              v-model="filters.documentType"
              :items="documentTypes"
              label="Document Type"
              clearable
              @update:model-value="fetchDocumentMappings"
            />
          </v-col>          <v-col cols="12" md="3">
            <v-select
              v-model="filters.retailerName"
              :items="uniqueRetailers"
              label="Retailer"
              clearable
              @update:model-value="fetchDocumentMappings"
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-select
              v-model="filters.direction"
              :items="directions"
              label="Direction"
              clearable
              @update:model-value="fetchDocumentMappings"
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-select
              v-model="filters.active"
              :items="activeOptions"
              item-title="text"
              item-value="value"
              label="Status"
              clearable
              @update:model-value="fetchDocumentMappings"
            />
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Data Table -->
    <v-data-table
      v-model:items-per-page="itemsPerPage"
      :headers="headers"
      :items="filteredMappings"
      :loading="loading"
      class="elevation-1"
    >      <template #item.client_name="{ item }">
        <v-chip color="primary" size="small" variant="tonal">
          {{ item.client_name || 'Unknown' }}
        </v-chip>
      </template>      <template #item.retailer_name="{ item }">
        <v-chip color="secondary" size="small" variant="tonal">
          {{ item.retailer_name || 'Unknown' }}
        </v-chip>
      </template>

      <template #item.document_type="{ item }">
        <v-chip 
          :color="getDocumentTypeColor(item.document_type)" 
          size="small" 
          variant="tonal"
        >
          {{ item.document_type }}
        </v-chip>
      </template>

      <template #item.direction="{ item }">
        <v-chip 
          :color="item.direction === 'INBOUND' ? 'green' : 'orange'" 
          size="small" 
          variant="tonal"
        >
          <v-icon start>
            {{ item.direction === 'INBOUND' ? 'mdi-download' : 'mdi-upload' }}
          </v-icon>
          {{ item.direction }}
        </v-chip>
      </template>

      <template #item.active="{ item }">
        <v-switch
          :model-value="item.active"
          color="success"
          hide-details
          @update:model-value="toggleActiveStatus(item)"
        />
      </template>

      <template #item.auto_process="{ item }">
        <v-icon 
          :color="item.auto_process ? 'success' : 'error'"
          :icon="item.auto_process ? 'mdi-check-circle' : 'mdi-close-circle'"
        />
      </template>

      <template #item.actions="{ item }">
        <v-btn
          icon="mdi-format-list-bulleted"
          size="small"
          variant="text"
          color="info"
          @click="viewFieldMappings(item)"
        >
          <v-icon>mdi-format-list-bulleted</v-icon>
          <v-tooltip activator="parent">Field Mappings</v-tooltip>
        </v-btn>
        <v-btn
          icon="mdi-pencil"
          size="small"
          variant="text"
          @click="openEditDialog(item)"
        />
        <v-btn
          icon="mdi-content-copy"
          size="small"
          variant="text"
          color="secondary"
          @click="cloneMapping(item)"
        >
          <v-icon>mdi-content-copy</v-icon>
          <v-tooltip activator="parent">Clone Mapping</v-tooltip>
        </v-btn>
        <v-btn
          icon="mdi-delete"
          size="small"
          variant="text"
          color="error"
          @click="openDeleteDialog(item)"
        />
      </template>
    </v-data-table>

    <!-- Create/Edit Dialog -->
    <v-dialog v-model="dialog" max-width="800px" scrollable>
      <v-card>
        <v-card-title>
          <span class="text-h5">{{ isEditing ? 'Edit' : 'Create' }} Document Mapping</span>
        </v-card-title>

        <v-card-text>
          <v-form ref="form" v-model="formValid">
            <v-row>
              <!-- Client Selection -->
              <v-col cols="12" md="6">
                <v-select
                  v-model="editedItem.trdr_client"
                  :items="clients"
                  item-title="name"
                  item-value="id"
                  label="Client *"
                  :rules="requiredRules"
                  required
                />
              </v-col>

              <!-- Retailer ID -->
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="editedItem.trdr_retailer"
                  label="Retailer ID *"
                  type="number"
                  :rules="requiredRules"
                  required
                />
              </v-col>

              <!-- Document Configuration -->
              <v-col cols="12" md="4">
                <v-select
                  v-model="editedItem.document_type"
                  :items="documentTypes"
                  label="Document Type *"
                  :rules="requiredRules"
                  required
                />
              </v-col>

              <v-col cols="12" md="4">
                <v-select
                  v-model="editedItem.direction"
                  :items="directions"
                  label="Direction *"
                  :rules="requiredRules"
                  required
                />
              </v-col>

              <v-col cols="12" md="4">
                <v-text-field
                  v-model="editedItem.sosource"
                  label="SO Source *"
                  type="number"
                  :rules="requiredRules"
                  required
                />
              </v-col>

              <!-- S1 Configuration -->
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="editedItem.fprms"
                  label="FPRMS *"
                  type="number"
                  :rules="requiredRules"
                  required
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="editedItem.series"
                  label="Series *"
                  type="number"
                  :rules="requiredRules"
                  required
                />
              </v-col>

              <!-- XML Paths -->
              <v-col cols="12" md="4">
                <v-text-field
                  v-model="editedItem.xml_root_path"
                  label="XML Root Path"
                  placeholder="/Order"
                />
              </v-col>

              <v-col cols="12" md="4">
                <v-text-field
                  v-model="editedItem.header_path"
                  label="Header Path"
                  placeholder="/Order/OrderHeader"
                />
              </v-col>

              <v-col cols="12" md="4">
                <v-text-field
                  v-model="editedItem.lines_path"
                  label="Lines Path"
                  placeholder="/Order/OrderLine"
                />
              </v-col>

              <!-- Directory Configuration -->
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="editedItem.initialdirin"
                  label="Input Directory"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="editedItem.initialdirout"
                  label="Output Directory"
                />
              </v-col>

              <!-- Switches -->
              <v-col cols="12" md="4">
                <v-switch
                  v-model="editedItem.active"
                  label="Active"
                  color="success"
                />
              </v-col>

              <v-col cols="12" md="4">
                <v-switch
                  v-model="editedItem.auto_process"
                  label="Auto Process"
                  color="primary"
                />
              </v-col>

              <v-col cols="12" md="4">
                <v-switch
                  v-model="editedItem.test_mode"
                  label="Test Mode"
                  color="warning"
                />
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn text @click="closeDialog">Cancel</v-btn>
          <v-btn
            color="primary"
            :disabled="!formValid"
            :loading="saving"
            @click="saveMapping"
          >
            {{ isEditing ? 'Update' : 'Create' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="deleteDialog" max-width="400px">
      <v-card>
        <v-card-title>Confirm Delete</v-card-title>
        <v-card-text>
          Are you sure you want to delete this document mapping?
          <br><br>
          <strong>Client:</strong> {{ itemToDelete?.client_name }}<br>
          <strong>Document:</strong> {{ itemToDelete?.document_type }} ({{ itemToDelete?.direction }})<br>
          <br>
          This will also delete all associated field mappings. This action cannot be undone.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn text @click="deleteDialog = false">Cancel</v-btn>
          <v-btn
            color="error"
            :loading="deleting"
            @click="deleteMapping"
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
      :timeout="3000"
    >
      {{ snackbar.message }}
    </v-snackbar>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { api } from '@/services/api'

export default {
  name: 'DocumentMappings',  setup() {
    const router = useRouter()
    const appStore = useAppStore()
    
    const documentMappings = ref([])
    const loading = ref(false)
    const dialog = ref(false)
    const deleteDialog = ref(false)
    const formValid = ref(false)
    const saving = ref(false)
    const deleting = ref(false)
    const itemsPerPage = ref(10)
    const form = ref(null)
      const filters = ref({
      selectedClient: null,
      retailerName: null,
      documentType: null,
      direction: null,
      active: null
    })
    
    const editedItem = ref({
      trdr_retailer: null,
      trdr_client: null,
      sosource: null,
      fprms: null,
      series: null,
      initialdirin: '',
      initialdirout: '',
      document_type: 'ORDER',
      direction: 'INBOUND',
      auto_process: true,
      active: true,
      test_mode: false,
      xml_root_path: '',
      header_path: '',
      lines_path: ''
    })
    
    const defaultItem = {
      trdr_retailer: null,
      trdr_client: null,
      sosource: null,
      fprms: null,
      series: null,
      initialdirin: '',
      initialdirout: '',
      document_type: 'ORDER',
      direction: 'INBOUND',
      auto_process: true,
      active: true,
      test_mode: false,
      xml_root_path: '',
      header_path: '',
      lines_path: ''
    }
    
    const itemToDelete = ref(null)
    const isEditing = ref(false)
    
    const snackbar = ref({
      show: false,
      message: '',
      color: 'success'    })
      // Computed
    const clients = computed(() => appStore.clients)
      const uniqueRetailers = computed(() => {
      const retailers = documentMappings.value
        .filter(m => m.retailer_name)
        .map(m => m.retailer_name)
      return [...new Set(retailers)].sort()
    })
    
    const filteredMappings = computed(() => {
      // Ensure we always have an array to work with
      const mappings = Array.isArray(documentMappings.value) ? documentMappings.value : []
      console.log('filteredMappings computed - input mappings:', mappings.length)
      
      let filtered = [...mappings]
      
      if (filters.value.selectedClient) {
        filtered = filtered.filter(m => m.trdr_client === filters.value.selectedClient)
      }
        if (filters.value.retailerName) {
        filtered = filtered.filter(m => m.retailer_name === filters.value.retailerName)
      }
      
      if (filters.value.documentType) {
        filtered = filtered.filter(m => m.document_type === filters.value.documentType)
      }
      
      if (filters.value.direction) {
        filtered = filtered.filter(m => m.direction === filters.value.direction)
      }
      
      if (filters.value.active !== null) {
        filtered = filtered.filter(m => m.active === filters.value.active)
      }
      
      console.log('filteredMappings computed - output filtered:', filtered.length)
      return filtered
    })
    
    // Static data
    const documentTypes = ['ORDER', 'INVOICE', 'DESADV', 'RECADV', 'RETANN']
    const directions = ['INBOUND', 'OUTBOUND']
    const activeOptions = [
      { text: 'Active', value: true },
      { text: 'Inactive', value: false }
    ]
      const headers = [
      { title: 'Client', key: 'client_name', sortable: true },
      { title: 'Retailer ID', key: 'trdr_retailer', sortable: true },
      { title: 'Retailer Name', key: 'retailer_name', sortable: true },
      { title: 'Document Type', key: 'document_type', sortable: true },
      { title: 'Direction', key: 'direction', sortable: true },
      { title: 'SO Source', key: 'sosource', sortable: true },
      { title: 'FPRMS', key: 'fprms', sortable: true },
      { title: 'Series', key: 'series', sortable: true },
      { title: 'Active', key: 'active', sortable: true },
      { title: 'Auto Process', key: 'auto_process', sortable: true },
      { title: 'Actions', key: 'actions', sortable: false, width: '200px' }
    ]
    
    const requiredRules = [
      v => !!v || 'This field is required'
    ]    // Methods
    const fetchDocumentMappings = async () => {
      loading.value = true
      try {
        console.log('Fetching document mappings...')
        const response = await api.service('document-mappings').find()
        console.log('API response:', response)
        
        // Ensure we always have an array, even if the API returns something else
        const data = response.data || response
        console.log('Extracted data:', data)
          if (Array.isArray(data)) {
          // Map backend field names to frontend expectations
          documentMappings.value = data.map(item => ({
            ...item,
            client_name: item.clientName || item.client_name || 'Unknown',
            retailer_name: item.retailerName || item.retailer_name || 'Unknown'
          }))
          console.log('Set document mappings to:', documentMappings.value.length, 'items')
        } else {
          console.warn('API returned non-array data, using fallback mock data')
          documentMappings.value = [
            {
              id: 1,
              trdr_retailer: 12345,
              trdr_client: 1,
              client_name: 'Pet Factory SRL',
              sosource: 100,
              fprms: 2001,
              series: 7001,
              initialdirin: 'C:\\EDI\\IN',
              initialdirout: 'C:\\EDI\\OUT',
              document_type: 'ORDER',
              direction: 'INBOUND',
              auto_process: true,
              active: true,
              test_mode: false,
              xml_root_path: '/Order',
              header_path: '/Order/OrderHeader',
              lines_path: '/Order/OrderLine'
            },
            {
              id: 2,
              trdr_retailer: 67890,
              trdr_client: 1,
              client_name: 'Pet Factory SRL',
              sosource: 200,
              fprms: 3001,
              series: 8001,
              initialdirin: 'C:\\EDI\\IN',
              initialdirout: 'C:\\EDI\\OUT',
              document_type: 'INVOICE',
              direction: 'OUTBOUND',
              auto_process: false,
              active: true,
              test_mode: true,
              xml_root_path: '/Invoice',
              header_path: '/Invoice/InvoiceHeader',
              lines_path: '/Invoice/InvoiceLine'
            }
          ]
          showSnackbar('Using mock data - API returned invalid format', 'warning')
        }
      } catch (error) {
        // Fallback to mock data for development
        console.error('API call failed:', error)
        documentMappings.value = [
          {
            id: 1,
            trdr_retailer: 12345,
            trdr_client: 1,
            client_name: 'Pet Factory SRL',
            sosource: 100,
            fprms: 2001,
            series: 7001,
            initialdirin: 'C:\\EDI\\IN',
            initialdirout: 'C:\\EDI\\OUT',
            document_type: 'ORDER',
            direction: 'INBOUND',
            auto_process: true,
            active: true,
            test_mode: false,
            xml_root_path: '/Order',
            header_path: '/Order/OrderHeader',
            lines_path: '/Order/OrderLine'
          },
          {
            id: 2,
            trdr_retailer: 67890,
            trdr_client: 1,
            client_name: 'Pet Factory SRL',
            sosource: 200,
            fprms: 3001,
            series: 8001,
            initialdirin: 'C:\\EDI\\IN',
            initialdirout: 'C:\\EDI\\OUT',
            document_type: 'INVOICE',
            direction: 'OUTBOUND',
            auto_process: false,
            active: true,
            test_mode: true,
            xml_root_path: '/Invoice',
            header_path: '/Invoice/InvoiceHeader',
            lines_path: '/Invoice/InvoiceLine'
          }
        ]
        showSnackbar('Using mock data - API unavailable', 'warning')
      } finally {
        loading.value = false
      }
    }
    
    const getDocumentTypeColor = (docType) => {
      const colors = {
        'ORDER': 'blue',
        'INVOICE': 'green',
        'DESADV': 'orange',
        'RECADV': 'purple',
        'RETANN': 'red'
      }
      return colors[docType] || 'grey'
    }
    
    const openCreateDialog = () => {
      isEditing.value = false
      editedItem.value = { ...defaultItem }
      dialog.value = true
    }
    
    const openEditDialog = (item) => {
      isEditing.value = true
      editedItem.value = { ...item }
      dialog.value = true
    }
    
    const openDeleteDialog = (item) => {
      itemToDelete.value = item
      deleteDialog.value = true
    }
    
    const closeDialog = () => {
      dialog.value = false
      if (form.value) {
        form.value.reset()
      }
    }
    
    const saveMapping = async () => {
      if (!formValid.value) return
      
      saving.value = true
      try {
        if (isEditing.value) {
          await api.service('document-mappings').patch(editedItem.value.id, editedItem.value)
          showSnackbar('Document mapping updated successfully', 'success')
        } else {
          await api.service('document-mappings').create(editedItem.value)
          showSnackbar('Document mapping created successfully', 'success')
        }
        
        closeDialog()
        await fetchDocumentMappings()
      } catch (error) {
        showSnackbar('Failed to save document mapping', 'error')
        console.error('Error saving document mapping:', error)
      } finally {
        saving.value = false
      }
    }
    
    const deleteMapping = async () => {
      if (!itemToDelete.value) return
      
      deleting.value = true
      try {
        await api.service('document-mappings').remove(itemToDelete.value.id)
        showSnackbar('Document mapping deleted successfully', 'success')
        deleteDialog.value = false
        await fetchDocumentMappings()
      } catch (error) {
        showSnackbar('Failed to delete document mapping', 'error')
        console.error('Error deleting document mapping:', error)
      } finally {
        deleting.value = false
      }
    }
    
    const toggleActiveStatus = async (item) => {
      try {
        await api.service('document-mappings').patch(item.id, {
          active: !item.active
        })
        item.active = !item.active
        showSnackbar(`Mapping ${item.active ? 'activated' : 'deactivated'}`, 'success')
      } catch (error) {
        showSnackbar('Failed to update status', 'error')
        console.error('Error updating status:', error)
      }
    }
    
    const viewFieldMappings = (item) => {
      router.push(`/mappings/fields/${item.id}`)
    }
    
    const cloneMapping = (item) => {
      const cloned = { ...item }
      delete cloned.id
      cloned.trdr_retailer = null // User will need to set new retailer
      cloned.series = null // User will need to set new series
      
      isEditing.value = false
      editedItem.value = cloned
      dialog.value = true
      
      showSnackbar('Mapping cloned - please update Retailer ID and Series', 'info')
    }
    
    const showSnackbar = (message, color = 'success') => {
      snackbar.value = {
        show: true,
        message,
        color
      }
    }
    
    onMounted(async () => {
      await appStore.loadReferenceData()
      await fetchDocumentMappings()
    })
    
    return {
      documentMappings,
      loading,
      dialog,
      deleteDialog,
      formValid,
      saving,
      deleting,
      itemsPerPage,
      form,
      filters,
      editedItem,
      itemToDelete,
      isEditing,      snackbar,
      clients,
      uniqueRetailers,
      filteredMappings,
      documentTypes,
      directions,
      activeOptions,
      headers,
      requiredRules,
      fetchDocumentMappings,
      getDocumentTypeColor,
      openCreateDialog,
      openEditDialog,
      openDeleteDialog,
      closeDialog,
      saveMapping,
      deleteMapping,
      toggleActiveStatus,
      viewFieldMappings,
      cloneMapping
    }
  }
}
</script>
