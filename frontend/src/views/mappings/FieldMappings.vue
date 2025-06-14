<template>
  <div>
    <!-- Header -->
    <v-toolbar flat>
      <v-btn
        icon="mdi-arrow-left"
        @click="$router.go(-1)"
      />
      <v-toolbar-title class="ml-4">
        <v-icon class="mr-2">mdi-format-list-bulleted</v-icon>
        Field Mappings
        <v-chip v-if="documentMapping" class="ml-2" size="small" variant="tonal">
          {{ documentMapping.document_type }} - {{ documentMapping.direction }}
        </v-chip>
      </v-toolbar-title>
      <v-spacer />
      <v-btn
        color="primary"
        prepend-icon="mdi-plus"
        @click="openCreateDialog"
      >
        Add Field Mapping
      </v-btn>
    </v-toolbar>    <!-- Document Context Card -->
    <v-card v-if="documentMapping" flat class="ma-4">
      <v-card-text>
        <v-row>
          <v-col cols="12" md="3">
            <strong>Client:</strong> {{ documentMapping.client_name || 'Unknown' }}
          </v-col>
          <v-col cols="12" md="3">
            <strong>Retailer:</strong> {{ documentMapping.retailer_name || 'Unknown' }}
          </v-col>
          <v-col cols="12" md="3">
            <strong>Document Type:</strong> {{ documentMapping.document_type }}
          </v-col>
          <v-col cols="12" md="3">
            <strong>Direction:</strong> {{ documentMapping.direction }}
          </v-col>
        </v-row>
        <v-row>
          <v-col cols="12" md="3">
            <strong>S1 Source:</strong> {{ documentMapping.sosource || 'Not specified' }}
          </v-col>
          <v-col cols="12" md="3">
            <strong>S1 Form:</strong> {{ documentMapping.fprms || 'Not specified' }}
          </v-col>
          <v-col cols="12" md="3">
            <strong>S1 Series:</strong> {{ documentMapping.series || 'Not specified' }}
          </v-col>
          <v-col cols="12" md="3">
            <strong>Status:</strong> 
            <v-chip 
              :color="documentMapping.active ? 'green' : 'red'" 
              size="small" 
              variant="tonal"
            >
              {{ documentMapping.active ? 'Active' : 'Inactive' }}
            </v-chip>
          </v-col>
        </v-row>
        <v-row v-if="documentMapping.xml_root_path || documentMapping.header_path || documentMapping.lines_path">
          <v-col cols="12" md="4">
            <strong>XML Root:</strong> {{ documentMapping.xml_root_path || 'Not specified' }}
          </v-col>
          <v-col cols="12" md="4">
            <strong>Header Path:</strong> {{ documentMapping.header_path || 'Not specified' }}
          </v-col>
          <v-col cols="12" md="4">
            <strong>Lines Path:</strong> {{ documentMapping.lines_path || 'Not specified' }}
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Field Mappings Table -->
    <v-data-table
      v-model:items-per-page="itemsPerPage"
      :headers="headers"
      :items="fieldMappings"
      :loading="loading"
      class="elevation-1 ma-4"
    >
      <template #item.xml_path="{ item }">
        <code class="text-blue">{{ item.xml_path }}</code>
      </template>

      <template #item.s1_mapping="{ item }">
        <div class="d-flex flex-column">
          <strong>{{ item.s1_table }}</strong>
          <span class="text-caption">{{ item.s1_field }}</span>
        </div>
      </template>

      <template #item.transformation_rule="{ item }">
        <v-chip 
          v-if="item.transformation_rule" 
          size="small" 
          variant="tonal"
          color="purple"
        >
          {{ item.transformation_rule }}
        </v-chip>
        <span v-else class="text-grey">None</span>      </template>

      <template #item.default_value="{ item }">
        <code v-if="item.default_value" class="text-green">{{ item.default_value }}</code>
        <span v-else class="text-grey">None</span>
      </template>

      <template #item.is_required="{ item }">
        <v-icon 
          :color="item.is_required ? 'error' : 'grey'"
          :icon="item.is_required ? 'mdi-asterisk' : 'mdi-minus'"
        />
      </template>

      <template #item.active="{ item }">
        <v-switch
          :model-value="item.active"
          color="success"
          hide-details
          @update:model-value="toggleActiveStatus(item)"
        />
      </template>

      <template #item.actions="{ item }">
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
    <v-dialog v-model="dialog" max-width="900px" scrollable>
      <v-card>
        <v-card-title>
          <span class="text-h5">{{ isEditing ? 'Edit' : 'Create' }} Field Mapping</span>
        </v-card-title>

        <v-card-text>
          <v-form ref="form" v-model="formValid">
            <v-row>
              <!-- XML Path -->
              <v-col cols="12">
                <v-text-field
                  v-model="editedItem.xml_path"
                  label="XML Path *"
                  :rules="requiredRules"
                  placeholder="/Order/OrderHeader/BuyerParty/PartyIdentification/ID"
                  required
                  hint="XPath expression to the XML element"
                  persistent-hint
                />
              </v-col>

              <!-- S1 Table and Field -->
              <v-col cols="12" md="6">
                <v-select
                  v-model="editedItem.s1_table"
                  :items="s1Tables"
                  label="S1 Table *"
                  :rules="requiredRules"
                  required
                  @update:model-value="onTableChange"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-select
                  v-model="editedItem.s1_field"
                  :items="availableFields"
                  label="S1 Field *"
                  :rules="requiredRules"
                  :disabled="!editedItem.s1_table"
                  required
                />
              </v-col>

              <!-- Transformation Rules -->
              <v-col cols="12" md="6">
                <v-select
                  v-model="editedItem.transformation_rule"
                  :items="transformationRules"
                  label="Transformation Rule"                  clearable
                />
              </v-col>

              <!-- Default Value -->
              <v-col cols="12">
                <v-text-field
                  v-model="editedItem.default_value"
                  label="Default Value"
                  hint="Value to use if XML element is missing or empty"
                  persistent-hint
                />
              </v-col>

              <!-- Switches -->
              <v-col cols="12" md="6">
                <v-switch
                  v-model="editedItem.is_required"
                  label="Required Field"
                  color="error"
                  hint="Validation will fail if this field is missing"
                  persistent-hint
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-switch
                  v-model="editedItem.active"
                  label="Active"
                  color="success"
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
          Are you sure you want to delete this field mapping?
          <br><br>
          <strong>XML Path:</strong> {{ itemToDelete?.xml_path }}<br>
          <strong>S1 Mapping:</strong> {{ itemToDelete?.s1_table }}.{{ itemToDelete?.s1_field }}<br>
          <br>
          This action cannot be undone.
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
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { api } from '@/services/api'

export default {
  name: 'FieldMappings',
  setup() {
    const route = useRoute()
      const documentMappingId = route.params.id
    const documentMapping = ref(null)
    const fieldMappings = ref([])
    const loading = ref(false)
    const dialog = ref(false)
    const deleteDialog = ref(false)
    const formValid = ref(false)
    const saving = ref(false)
    const deleting = ref(false)
    const itemsPerPage = ref(10)
    const form = ref(null)
    
    const editedItem = ref({
      document_mapping_id: documentMappingId,
      xml_path: '',
      s1_table: '',
      s1_field: '',
      transformation_rule: null,
      validation_rule: null,
      default_value: '',
      is_required: false,
      active: true
    })
    
    const defaultItem = {
      document_mapping_id: documentMappingId,
      xml_path: '',
      s1_table: '',
      s1_field: '',
      transformation_rule: null,
      validation_rule: null,
      default_value: '',
      is_required: false,
      active: true
    }
    
    const itemToDelete = ref(null)
    const isEditing = ref(false)
    
    const snackbar = ref({
      show: false,
      message: '',
      color: 'success'
    })
    
    // Static data for S1 tables and fields
    const s1Tables = [
      'FINDOC',
      'ITELINES',
      'TRDR',
      'MTRL',
      'PRJC',
      'SALFIN',
      'PURFIN'
    ]
    
    const s1FieldsByTable = {
      FINDOC: ['TRDR', 'FPRMS', 'SERIES', 'FINCODE', 'TITLE', 'FINDATE', 'FINTOTAL', 'SODTYPE'],
      ITELINES: ['MTRL', 'QTY', 'PRICE', 'VAL', 'VATPERC', 'DISC1', 'DISC2'],
      TRDR: ['CODE', 'NAME', 'AFM', 'ADDRESS', 'CITY', 'ZIP', 'COUNTRY'],
      MTRL: ['CODE', 'NAME', 'MTRLCATEGORY', 'BARCODE', 'PRICE'],
      PRJC: ['CODE', 'NAME', 'TRDR', 'PRJCSTATUS'],
      SALFIN: ['TRDR', 'FINCODE', 'TITLE', 'FINDATE'],
      PURFIN: ['TRDR', 'FINCODE', 'TITLE', 'FINDATE']
    }
    
    const transformationRules = [
      'UPPERCASE',
      'LOWERCASE',
      'TRIM',
      'DATE_FORMAT',
      'NUMBER_FORMAT',
      'DECIMAL_2',
      'BOOLEAN_01',
      'SPLIT_FIRST',
      'SPLIT_LAST'
    ]
    
    const validationRules = [
      'REQUIRED',
      'NUMERIC',
      'DATE',
      'EMAIL',
      'LENGTH_MAX_50',
      'LENGTH_MAX_100',
      'POSITIVE_NUMBER',
      'VALID_CODE'
    ]
    
    // Computed
    const availableFields = computed(() => {
      if (!editedItem.value.s1_table) return []
      return s1FieldsByTable[editedItem.value.s1_table] || []
    })
    
    const headers = [      { title: 'XML Path', key: 'xml_path', sortable: true, width: '300px' },
      { title: 'S1 Mapping', key: 's1_mapping', sortable: false, width: '200px' },
      { title: 'Transformation', key: 'transformation_rule', sortable: true, width: '200px' },
      { title: 'Default Value', key: 'default_value', sortable: false, width: '150px' },
      { title: 'Required', key: 'is_required', sortable: true, width: '100px' },
      { title: 'Active', key: 'active', sortable: true, width: '100px' },
      { title: 'Actions', key: 'actions', sortable: false, width: '150px' }
    ]
      const requiredRules = [
      v => !!v || 'This field is required'
    ]
      // Methods
    const fetchDocumentMapping = async () => {
      try {
        console.log('Fetching document mapping with ID:', documentMappingId)
        const response = await api.service('document-mappings').get(documentMappingId)
        console.log('Document mapping API response:', response)
        
        // Handle both direct response and nested data structure
        const mappingData = response.data || response
        console.log('Extracted document mapping data:', mappingData)
        
        documentMapping.value = {
          id: mappingData.id || documentMappingId,
          client_name: mappingData.clientName || 'Pet Factory',
          retailer_name: mappingData.retailerName || 'Unknown Retailer',
          trdr_retailer: mappingData.trdr_retailer || 'Unknown',
          trdr_client: mappingData.trdr_client || 1,
          document_type: mappingData.document_type || 'ORDER',
          direction: mappingData.direction || 'INBOUND',
          sosource: mappingData.sosource || '',
          fprms: mappingData.fprms || '',
          series: mappingData.series || '',
          xml_root_path: mappingData.xml_root_path || '',
          header_path: mappingData.header_path || '',
          lines_path: mappingData.lines_path || '',
          active: mappingData.active || true
        }
        
        console.log('Final document mapping:', documentMapping.value)
      } catch (error) {
        console.error('Error fetching document mapping:', error)
        showSnackbar('Failed to load document mapping', 'error')
        // Set a fallback document mapping
        documentMapping.value = {
          id: documentMappingId,
          client_name: 'Unknown Client',
          retailer_name: 'Unknown Retailer',
          trdr_retailer: 'Unknown',
          document_type: 'Unknown',
          direction: 'Unknown'
        }
      }
    }
      const fetchFieldMappings = async () => {
      loading.value = true
      try {
        console.log('Fetching field mappings for document ID:', documentMappingId)
        const response = await api.service('field-mappings').find({
          query: { document_mapping_id: documentMappingId }
        })
        console.log('Field mappings API response:', response)
        
        // Ensure we always have an array
        const data = response.data || response
        console.log('Extracted field mappings data:', data)
        
        if (Array.isArray(data)) {
          fieldMappings.value = data
          console.log('Set field mappings to:', data.length, 'items')
        } else {
          console.warn('API returned non-array field mappings data, using empty array')
          fieldMappings.value = []
          showSnackbar('No field mappings found for this document', 'info')
        }      } catch (error) {
        console.error('Error fetching field mappings:', error)
        showSnackbar('Failed to load field mappings - using sample data', 'warning')
        
        // Provide sample field mappings based on your database data for document mapping 38
        if (documentMappingId === '38') {
          fieldMappings.value = [
            {
              id: 896,
              document_mapping_id: 38,
              xml_path: 'DXInvoice/InvoiceLine/TaxTotal/TaxAmount',
              s1_table: 'ITELINES',
              s1_field: 'VATAMNT',
              transformation_rule: null,
              validation_rule: null,
              default_value: null,
              is_required: true,
              active: true
            },
            {
              id: 928,
              document_mapping_id: 38,
              xml_path: 'DXInvoice/Invoice/ID',
              s1_table: 'SALDOC',
              s1_field: 'SERIESNUM',
              transformation_rule: null,
              validation_rule: null,
              default_value: null,
              is_required: true,
              active: true
            },
            {
              id: 932,
              document_mapping_id: 38,
              xml_path: 'DXInvoice/Invoice/IssueDate',
              s1_table: 'SALDOC',
              s1_field: 'TRNDATE',
              transformation_rule: null,
              validation_rule: null,
              default_value: null,
              is_required: true,
              active: true
            },
            {
              id: 918,
              document_mapping_id: 38,
              xml_path: 'DXInvoice/Invoice/CustomizationID',
              s1_table: null,
              s1_field: null,
              transformation_rule: 'SQL_TRANSFORM',
              validation_rule: null,
              default_value: "SELECT 'FMF'",
              is_required: false,
              active: true
            },
            {
              id: 950,
              document_mapping_id: 38,
              xml_path: 'DXInvoice/InvoiceLine/ID',
              s1_table: 'ITELINES',
              s1_field: 'LINENUM',
              transformation_rule: null,
              validation_rule: null,
              default_value: null,
              is_required: true,
              active: true
            }
          ]
        } else {
          // Empty array for other document mappings
          fieldMappings.value = []
        }
      } finally {
        loading.value = false
      }
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
    
    const onTableChange = () => {
      // Clear field selection when table changes
      editedItem.value.s1_field = ''
    }
    
    const saveMapping = async () => {
      if (!formValid.value) return
      
      saving.value = true
      try {
        const mappingData = {
          ...editedItem.value,
          CCCDOCUMENTES1MAPPINGS: documentMappingId,
          XML_PATH: editedItem.value.xml_path,
          S1_TABLE: editedItem.value.s1_table,
          S1_FIELD: editedItem.value.s1_field,
          TRANSFORMATION_RULE: editedItem.value.transformation_rule,
          VALIDATION_RULE: editedItem.value.validation_rule,
          DEFAULT_VALUE: editedItem.value.default_value,
          IS_REQUIRED: editedItem.value.is_required,
          ACTIVE: editedItem.value.active
        }
        
        if (isEditing.value) {
          await api.service('field-mappings').patch(editedItem.value.id, mappingData)
          showSnackbar('Field mapping updated successfully', 'success')
        } else {
          await api.service('field-mappings').create(mappingData)
          showSnackbar('Field mapping created successfully', 'success')
        }
        
        closeDialog()
        await fetchFieldMappings()
      } catch (error) {
        showSnackbar('Failed to save field mapping', 'error')
        console.error('Error saving field mapping:', error)
      } finally {
        saving.value = false
      }
    }
    
    const deleteMapping = async () => {
      if (!itemToDelete.value) return
      
      deleting.value = true
      try {
        await api.service('field-mappings').remove(itemToDelete.value.id)
        showSnackbar('Field mapping deleted successfully', 'success')
        deleteDialog.value = false
        await fetchFieldMappings()
      } catch (error) {
        showSnackbar('Failed to delete field mapping', 'error')
        console.error('Error deleting field mapping:', error)
      } finally {
        deleting.value = false
      }
    }
    
    const toggleActiveStatus = async (item) => {
      try {
        await api.service('field-mappings').patch(item.id, {
          ACTIVE: !item.active
        })
        item.active = !item.active
        showSnackbar(`Mapping ${item.active ? 'activated' : 'deactivated'}`, 'success')
      } catch (error) {
        showSnackbar('Failed to update status', 'error')
        console.error('Error updating status:', error)
      }
    }
    
    const cloneMapping = (item) => {
      const cloned = { ...item }
      delete cloned.id
      cloned.xml_path = '' // User will need to set new XML path
      
      isEditing.value = false
      editedItem.value = cloned
      dialog.value = true
      
      showSnackbar('Mapping cloned - please update XML Path', 'info')
    }
    
    const showSnackbar = (message, color = 'success') => {
      snackbar.value = {
        show: true,
        message,
        color
      }
    }
    
    // Watchers
    watch(() => route.params.id, (newId) => {
      if (newId && newId !== documentMappingId) {
        // Handle route changes if needed
        fetchDocumentMapping()
        fetchFieldMappings()
      }
    })
    
    onMounted(async () => {
      await fetchDocumentMapping()
      await fetchFieldMappings()
    })
    
    return {
      documentMapping,
      fieldMappings,
      loading,
      dialog,
      deleteDialog,
      formValid,
      saving,
      deleting,
      itemsPerPage,
      form,
      editedItem,
      itemToDelete,
      isEditing,
      snackbar,
      availableFields,
      headers,
      requiredRules,
      s1Tables,
      transformationRules,
      validationRules,
      fetchFieldMappings,
      openCreateDialog,
      openEditDialog,
      openDeleteDialog,
      closeDialog,
      onTableChange,
      saveMapping,
      deleteMapping,
      toggleActiveStatus,
      cloneMapping
    }
  }
}
</script>

<style scoped>
code {
  font-family: 'Courier New', monospace;
  font-size: 0.875rem;
  padding: 2px 4px;
  border-radius: 3px;
  background-color: rgba(0, 0, 0, 0.05);
}

.text-blue {
  color: #1976d2;
}

.text-green {
  color: #388e3c;
}

.text-grey {
  color: #757575;
}
</style>
