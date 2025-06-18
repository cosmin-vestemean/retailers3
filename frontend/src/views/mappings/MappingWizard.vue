<template>
  <div>
    <v-toolbar flat>
      <v-btn
        icon="mdi-arrow-left"
        @click="$router.go(-1)"
      />
      <v-toolbar-title class="ml-4">
        <v-icon class="mr-2">mdi-auto-fix</v-icon>
        Mapping Wizard
      </v-toolbar-title>
      <v-spacer />
      <v-btn
        v-if="currentStep > 1"
        variant="outlined"
        @click="previousStep"
      >
        <v-icon left>mdi-arrow-left</v-icon>
        Previous
      </v-btn>
      <v-btn
        v-if="currentStep < totalSteps"
        color="primary"
        class="ml-2"
        :disabled="!canProceed"
        @click="nextStep"
      >
        Next
        <v-icon right>mdi-arrow-right</v-icon>
      </v-btn>
      <v-btn
        v-if="currentStep === totalSteps"
        color="success"
        class="ml-2"
        :disabled="!canFinish"
        :loading="creating"
        @click="createMapping"
      >
        Create Mapping
        <v-icon right>mdi-check</v-icon>
      </v-btn>
    </v-toolbar>

    <!-- Progress Stepper -->
    <v-stepper
      v-model="currentStep"
      class="ma-4"
      :items="steps"
      hide-actions
    >
      <!-- Step 1: Document Configuration -->
      <template #item.1>
        <v-card flat>
          <v-card-title>Document Configuration</v-card-title>
          <v-card-text>
            <v-form ref="documentForm" v-model="documentFormValid">
              <v-row>
                <v-col cols="12" md="6">
                  <v-select
                    v-model="documentConfig.trdr_client"
                    :items="clients"
                    item-title="name"
                    item-value="id"
                    label="Client *"
                    :rules="requiredRules"
                    required
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="documentConfig.trdr_retailer"
                    label="Retailer ID *"
                    :rules="requiredRules"
                    type="number"
                    required
                  />
                </v-col>
              </v-row>
              <v-row>
                <v-col cols="12" md="4">
                  <v-select
                    v-model="documentConfig.document_type"
                    :items="documentTypes"
                    label="Document Type *"
                    :rules="requiredRules"
                    required
                  />
                </v-col>
                <v-col cols="12" md="4">
                  <v-select
                    v-model="documentConfig.direction"
                    :items="directions"
                    label="Direction *"
                    :rules="requiredRules"
                    required
                  />
                </v-col>
                <v-col cols="12" md="4">
                  <v-text-field
                    v-model="documentConfig.sosource"
                    label="SO Source"
                    type="number"
                  />
                </v-col>
              </v-row>
              <v-row>
                <v-col cols="12" md="4">
                  <v-text-field
                    v-model="documentConfig.fprms"
                    label="FPRMS"
                    type="number"
                  />
                </v-col>
                <v-col cols="12" md="4">
                  <v-text-field
                    v-model="documentConfig.series"
                    label="Series"
                    type="number"
                  />
                </v-col>
                <v-col cols="12" md="4">
                  <v-switch
                    v-model="documentConfig.auto_process"
                    label="Auto Process"
                    color="primary"
                  />
                </v-col>
              </v-row>
            </v-form>
          </v-card-text>
        </v-card>
      </template>

      <!-- Step 2: XML Upload and Analysis -->
      <template #item.2>
        <v-card flat>
          <v-card-title>XML Upload and Analysis</v-card-title>
          <v-card-text>
            <!-- XML Upload Area -->
            <v-card 
              variant="outlined" 
              class="mb-4"
              :class="{ 'border-primary': dragOver }"
              @dragover.prevent="dragOver = true"
              @dragleave.prevent="dragOver = false"
              @drop.prevent="handleFileDrop"
            >
              <v-card-text class="text-center py-8">
                <div v-if="!xmlContent">
                  <v-icon size="64" color="grey-lighten-1" class="mb-4">
                    mdi-file-xml-outline
                  </v-icon>
                  <h3 class="mb-2">Upload XML Sample</h3>
                  <p class="text-grey">
                    Drag and drop an XML file here or click to browse
                  </p>                  <v-file-input
                    ref="fileInput"
                    v-model="selectedFile"
                    accept=".xml"
                    label="Select XML file"
                    variant="outlined"
                    class="mt-4"
                    @update:model-value="handleFileSelect"
                    @click:clear="clearXml"
                  />
                  <v-btn
                    v-if="selectedFile && !xmlContent"
                    color="primary"
                    class="mt-2"
                    @click="processSelectedFile"
                  >
                    Process XML File
                  </v-btn>
                </div>                <div v-else>
                  <v-icon size="64" color="success" class="mb-4">
                    mdi-check-circle
                  </v-icon>
                  <h3 class="mb-2">XML Loaded Successfully</h3>
                  <p class="text-grey mb-4">
                    {{ detectedFields.length }} fields detected
                  </p>
                  
                  <!-- Debug info -->
                  <v-alert type="info" class="mb-4">
                    <strong>Debug Info:</strong><br>
                    XML Content Length: {{ xmlContent.length }}<br>
                    Detected Fields: {{ detectedFields.length }}<br>
                    Field Mappings: {{ fieldMappings.length }}
                  </v-alert>
                  
                  <v-btn
                    variant="outlined"
                    @click="clearXml"
                  >
                    Upload Different File
                  </v-btn>
                </div>
              </v-card-text>
            </v-card>            <!-- XML Structure Preview -->
            <v-card v-if="xmlStructure.length" variant="outlined">
              <v-card-title>
                Detected XML Structure
                <v-spacer />
                <v-chip size="small" variant="tonal">
                  {{ detectedFields.length }} fields found
                </v-chip>
              </v-card-title>              <v-card-text>
                <div class="xml-structure">
                  <div v-for="item in flatXmlFields" :key="item.id" class="xml-field mb-1">
                    <div class="d-flex align-center">
                      <v-icon size="small" color="primary" class="mr-2">
                        mdi-xml
                      </v-icon>
                      <code class="text-primary mr-2">{{ item.path }}</code>
                      <v-chip
                        v-if="item.value"
                        size="x-small"
                        variant="tonal"
                        color="success"
                      >
                        {{ item.value.length > 30 ? item.value.substring(0, 30) + '...' : item.value }}
                      </v-chip>
                    </div>
                  </div>
                </div>
              </v-card-text>
            </v-card>
          </v-card-text>
        </v-card>
      </template>

      <!-- Step 3: Field Mapping -->
      <template #item.3>
        <v-card flat>
          <v-card-title>
            Field Mapping
            <v-spacer />
            <v-btn
              variant="outlined"
              size="small"
              @click="openS1Browser"
            >
              <v-icon left>mdi-database-search</v-icon>
              Browse S1 Objects
            </v-btn>
          </v-card-title>
          <v-card-text>
            <!-- Auto-Mapping Suggestions -->
            <v-alert v-if="autoMappingSuggestions.length" type="info" variant="tonal" class="mb-4">
              <div class="d-flex align-center">
                <v-icon class="mr-2">mdi-lightbulb-outline</v-icon>
                <span>{{ autoMappingSuggestions.length }} auto-mapping suggestions found</span>
                <v-spacer />
                <v-btn
                  size="small"
                  variant="outlined"
                  @click="applyAutoMappings"
                >
                  Apply All
                </v-btn>
              </div>
            </v-alert>

            <!-- Field Mappings Table -->
            <v-data-table
              :headers="mappingHeaders"
              :items="fieldMappings"
              class="elevation-1"
              density="compact"
            >
              <template #item.xml_path="{ item }">
                <div class="d-flex align-center">
                  <code class="text-primary">{{ item.xml_path }}</code>
                  <v-tooltip v-if="item.sample_value" activator="parent">
                    Sample: {{ item.sample_value }}
                  </v-tooltip>
                </div>
              </template>              <template #item.s1_mapping="{ item, index }">
                <div class="d-flex">
                  <v-select
                    :model-value="item.s1_table"
                    :items="s1Tables"
                    item-title="title"
                    item-value="value"
                    label="Table"
                    density="compact"
                    variant="outlined"
                    class="mr-2"
                    style="max-width: 150px"
                    :loading="loadingS1Data"
                    @update:model-value="updateMapping(index, 's1_table', $event)"
                  />
                  <v-select
                    :model-value="item.s1_field"
                    :items="s1Fields[item.s1_table] || []"
                    item-title="title"
                    item-value="value"
                    label="Field"
                    density="compact"
                    variant="outlined"
                    :disabled="!item.s1_table"
                    style="max-width: 150px"
                    @update:model-value="updateMapping(index, 's1_field', $event)"
                    @click:prepend="loadS1Fields(item.s1_table)"
                  />
                </div>
              </template>

              <template #item.transformation="{ item, index }">
                <v-select
                  :model-value="item.transformation_rule"
                  :items="transformationRules"
                  label="Transform"
                  density="compact"
                  variant="outlined"
                  clearable
                  @update:model-value="updateMapping(index, 'transformation_rule', $event)"
                />
              </template>

              <template #item.actions="{ item, index }">
                <v-btn
                  icon="mdi-tune"
                  size="small"
                  variant="text"
                  @click="openTransformationBuilder(item, index)"
                >
                  <v-tooltip activator="parent">
                    Advanced Transform
                  </v-tooltip>
                </v-btn>
                <v-btn
                  icon="mdi-delete"
                  size="small"
                  variant="text"
                  color="error"
                  @click="removeMapping(index)"
                />
              </template>
            </v-data-table>
          </v-card-text>
        </v-card>
      </template>

      <!-- Step 4: Validation and Test -->
      <template #item.4>
        <v-card flat>
          <v-card-title>Validation and Test</v-card-title>
          <v-card-text>
            <!-- Mapping Summary -->
            <v-card variant="outlined" class="mb-4">
              <v-card-title>Mapping Summary</v-card-title>
              <v-card-text>
                <v-row>
                  <v-col cols="6">
                    <v-list-item>
                      <v-list-item-title>Document Type</v-list-item-title>
                      <v-list-item-subtitle>{{ documentConfig.document_type }} - {{ documentConfig.direction }}</v-list-item-subtitle>
                    </v-list-item>
                  </v-col>
                  <v-col cols="6">
                    <v-list-item>
                      <v-list-item-title>Field Mappings</v-list-item-title>
                      <v-list-item-subtitle>{{ fieldMappings.length }} mappings created</v-list-item-subtitle>
                    </v-list-item>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>

            <!-- Test Results -->
            <v-card v-if="testResults" variant="outlined">
              <v-card-title>
                Test Results
                <v-spacer />
                <v-chip
                  :color="testResults.success ? 'success' : 'error'"
                  size="small"
                  variant="tonal"
                >
                  {{ testResults.success ? 'Passed' : 'Failed' }}
                </v-chip>
              </v-card-title>
              <v-card-text>
                <div v-if="testResults.success" class="text-success">
                  <v-icon class="mr-2">mdi-check-circle</v-icon>
                  All field mappings validated successfully!
                </div>
                <div v-else>
                  <v-alert type="error" variant="tonal">
                    <h4>Validation Issues Found:</h4>
                    <ul class="mt-2">
                      <li v-for="error in testResults.errors" :key="error">
                        {{ error }}
                      </li>
                    </ul>
                  </v-alert>
                </div>
              </v-card-text>
            </v-card>

            <div class="text-center mt-4">
              <v-btn
                color="primary"
                variant="outlined"
                :loading="testing"
                @click="testMappings"
              >
                <v-icon left>mdi-play</v-icon>
                Test Mappings
              </v-btn>
            </div>
          </v-card-text>
        </v-card>
      </template>
    </v-stepper>

    <!-- S1 Object Browser Dialog -->
    <v-dialog v-model="s1BrowserDialog" max-width="1000px" scrollable>
      <v-card>
        <v-card-title>
          S1 Object Browser
          <v-spacer />
          <v-btn icon="mdi-close" @click="s1BrowserDialog = false" />
        </v-card-title>
        <v-card-text>          <v-row>
            <v-col cols="4">
              <v-card variant="outlined">
                <v-card-title>SALDOC Tables</v-card-title>
                <v-list density="compact">
                  <v-list-item
                    v-for="table in s1Tables"
                    :key="table.value"
                    :active="selectedS1Table === table.value"
                    @click="selectedS1Table = table.value; loadS1Fields(table.value)"
                  >
                    <v-list-item-title>{{ table.title }}</v-list-item-title>
                  </v-list-item>
                  <v-list-item v-if="s1Tables.length === 0 && !loadingS1Data">
                    <v-list-item-title class="text-grey">No tables available</v-list-item-title>
                  </v-list-item>
                  <v-list-item v-if="loadingS1Data">
                    <v-progress-circular size="small" indeterminate />
                    <v-list-item-title class="ml-2">Loading...</v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-card>
            </v-col>
            <v-col cols="8">
              <v-card v-if="selectedS1Table" variant="outlined">
                <v-card-title>{{ selectedS1Table }} Fields</v-card-title>
                <v-list density="compact">
                  <v-list-item
                    v-for="field in s1Fields[selectedS1Table] || []"
                    :key="field.value"
                    @click="selectS1Field(selectedS1Table, field.value)"
                  >
                    <v-list-item-title>{{ field.title }}</v-list-item-title>
                    <v-list-item-subtitle>{{ field.type }}</v-list-item-subtitle>
                  </v-list-item>
                  <v-list-item v-if="!s1Fields[selectedS1Table] && selectedS1Table">
                    <v-progress-circular size="small" indeterminate />
                    <v-list-item-title class="ml-2">Loading fields...</v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-card>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- Advanced Transformation Builder -->
    <v-dialog v-model="transformationDialog" max-width="800px" scrollable>
      <v-card>
        <v-card-title>Advanced Transformation Builder</v-card-title>
        <v-card-text>
          <v-card v-if="selectedMappingForTransform" variant="outlined" class="mb-4">
            <v-card-text>
              <strong>XML Path:</strong> {{ selectedMappingForTransform.xml_path }}<br>
              <strong>Sample Value:</strong> {{ selectedMappingForTransform.sample_value || 'N/A' }}
            </v-card-text>
          </v-card>

          <v-tabs v-model="transformTab">
            <v-tab>Simple Rules</v-tab>
            <v-tab>Custom Script</v-tab>
            <v-tab>SQL Transform</v-tab>
          </v-tabs>

          <v-tabs-window v-model="transformTab">
            <!-- Simple Rules -->
            <v-tabs-window-item>
              <div class="pa-4">
                <v-select
                  v-model="customTransformation.simple_rule"
                  :items="transformationRules"
                  label="Transformation Rule"
                  multiple
                  chips
                />
                <v-text-field
                  v-model="customTransformation.default_value"
                  label="Default Value"
                  hint="Value to use if source is empty"
                />
              </div>
            </v-tabs-window-item>

            <!-- Custom Script -->
            <v-tabs-window-item>
              <div class="pa-4">
                <v-textarea
                  v-model="customTransformation.script"
                  label="JavaScript Transformation"
                  rows="8"
                  hint="Available variables: sourceValue, xmlDoc, mapping"
                  placeholder="// Transform the source value
return sourceValue.toUpperCase().trim();"
                />
              </div>
            </v-tabs-window-item>

            <!-- SQL Transform -->
            <v-tabs-window-item>
              <div class="pa-4">
                <v-textarea
                  v-model="customTransformation.sql"
                  label="SQL Transformation"
                  rows="6"
                  hint="SQL query to transform/lookup values"
                  placeholder="SELECT NAME FROM TRDR WHERE CODE = :sourceValue"
                />
              </div>
            </v-tabs-window-item>
          </v-tabs-window>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="transformationDialog = false">Cancel</v-btn>
          <v-btn color="primary" @click="applyCustomTransformation">Apply</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Loading Overlay -->
    <v-overlay v-model="loading" class="align-center justify-center">
      <v-progress-circular
        color="primary"
        indeterminate
        size="64"
      />
    </v-overlay>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { api } from '@/services/api'

export default {
  name: 'MappingWizard',
  setup() {
    const router = useRouter()
    const appStore = useAppStore()

    // Reactive data
    const currentStep = ref(1)
    const totalSteps = 4
    const loading = ref(false)
    const creating = ref(false)
    const testing = ref(false)

    // Forms
    const documentForm = ref(null)
    const documentFormValid = ref(false)

    // Document configuration
    const documentConfig = ref({
      trdr_client: null,
      trdr_retailer: null,
      document_type: 'ORDER',
      direction: 'INBOUND',
      sosource: null,
      fprms: null,
      series: null,
      auto_process: true,
      active: true,
      xml_root_path: '',
      header_path: '',
      lines_path: ''
    })

    // XML handling
    const selectedFile = ref(null)
    const xmlContent = ref('')
    const xmlStructure = ref([])
    const detectedFields = ref([])
    const dragOver = ref(false)

    // Field mappings
    const fieldMappings = ref([])
    const autoMappingSuggestions = ref([])

    // Dialogs
    const s1BrowserDialog = ref(false)
    const selectedS1Table = ref('')
    const transformationDialog = ref(false)
    const selectedMappingForTransform = ref(null)
    const selectedMappingIndex = ref(-1)

    // Transformation builder
    const transformTab = ref(0)
    const customTransformation = ref({
      simple_rule: [],
      script: '',
      sql: '',
      default_value: ''
    })

    // Test results
    const testResults = ref(null)

    // Static data
    const steps = [
      { title: 'Document Config', value: 1 },
      { title: 'XML Upload', value: 2 },
      { title: 'Field Mapping', value: 3 },
      { title: 'Validation', value: 4 }
    ]

    const documentTypes = ['ORDER', 'INVOICE', 'DESADV', 'RECADV', 'RETANN']
    const directions = ['INBOUND', 'OUTBOUND']

    const s1Tables = ref([])
    const s1Fields = ref({}) // Cache fields by table name
    const loadingS1Data = ref(false)    // Load S1 tables for SALDOC
    const loadS1Tables = async () => {
      if (s1Tables.value.length > 0) return // Already loaded
      
      loadingS1Data.value = true
      try {
        console.log('Loading S1 tables for SALDOC...')
        const response = await api.service('field-mappings').getS1Tables({ object: 'SALDOC' })
        console.log('S1 tables response:', response)
          if (response.success && response.tables) {
          s1Tables.value = response.tables.map(table => ({
            value: table.name,
            title: table.name,
            description: table.description || table.name
          }))
          console.log('Loaded S1 tables:', s1Tables.value.length)
        } else {
          console.error('Failed to load S1 tables:', response.error || 'Unknown error')
          // Fallback to basic tables for now
          s1Tables.value = [
            { value: 'FINDOC', title: 'FINDOC - Document Header', name: 'Document Header' },
            { value: 'ITELINES', title: 'ITELINES - Document Lines', name: 'Document Lines' },
            { value: 'TRDR', title: 'TRDR - Trading Partner', name: 'Trading Partner' }
          ]
        }
      } catch (error) {
        console.error('Error loading S1 tables:', error)
        // Fallback to basic tables
        s1Tables.value = [
          { value: 'FINDOC', title: 'FINDOC - Document Header', name: 'Document Header' },
          { value: 'ITELINES', title: 'ITELINES - Document Lines', name: 'Document Lines' },
          { value: 'TRDR', title: 'TRDR - Trading Partner', name: 'Trading Partner' }
        ]
      } finally {
        loadingS1Data.value = false
      }
    }    // Load S1 fields for a specific table
    const loadS1Fields = async (tableName) => {
      if (s1Fields.value[tableName]) return s1Fields.value[tableName] // Already cached
      
      try {
        console.log('Loading S1 fields for table:', tableName)
        const response = await api.service('field-mappings').getS1Fields({ 
          object: 'SALDOC', 
          table: tableName 
        })
        console.log('S1 fields response for', tableName, ':', response)
          if (response.success && response.fields) {
          const fields = response.fields.map(field => ({
            value: field.name,
            title: field.name,
            description: field.description || field.name,
            type: field.type || 'VARCHAR'
          }))
          s1Fields.value[tableName] = fields
          return fields
        } else {
          console.error('Failed to load S1 fields for', tableName, ':', response.error || 'Unknown error')
          // Fallback to basic fields based on table
          const fallbackFields = getFallbackFields(tableName)
          s1Fields.value[tableName] = fallbackFields
          return fallbackFields
        }
      } catch (error) {
        console.error('Error loading S1 fields for', tableName, ':', error)
        // Fallback to basic fields
        const fallbackFields = getFallbackFields(tableName)
        s1Fields.value[tableName] = fallbackFields
        return fallbackFields
      }
    }    // Fallback fields for common tables
    const getFallbackFields = (tableName) => {
      const fallbacks = {
        FINDOC: [
          { value: 'TRDR', title: 'TRDR', description: 'Trading Partner', type: 'NUMBER' },
          { value: 'FINCODE', title: 'FINCODE', description: 'Document Code', type: 'VARCHAR' },
          { value: 'FINDATE', title: 'FINDATE', description: 'Document Date', type: 'DATE' },
          { value: 'SERIES', title: 'SERIES', description: 'Document Series', type: 'NUMBER' }
        ],
        ITELINES: [
          { value: 'MTRL', title: 'MTRL', description: 'Material', type: 'NUMBER' },
          { value: 'QTY', title: 'QTY', description: 'Quantity', type: 'NUMBER' },
          { value: 'PRICE', title: 'PRICE', description: 'Unit Price', type: 'NUMBER' },
          { value: 'VAL', title: 'VAL', description: 'Line Value', type: 'NUMBER' }
        ],
        TRDR: [
          { value: 'CODE', title: 'CODE', description: 'Trader Code', type: 'VARCHAR' },
          { value: 'NAME', title: 'NAME', description: 'Trader Name', type: 'VARCHAR' },
          { value: 'AFM', title: 'AFM', description: 'Tax ID', type: 'VARCHAR' }
        ]
      }
      return fallbacks[tableName] || []
    }

    const transformationRules = [
      'UPPERCASE', 'LOWERCASE', 'TRIM', 'DATE_FORMAT', 'NUMBER_FORMAT',
      'DECIMAL_2', 'BOOLEAN_01', 'SPLIT_FIRST', 'SPLIT_LAST'
    ]

    const mappingHeaders = [
      { title: 'XML Path', key: 'xml_path', width: '300px' },
      { title: 'S1 Mapping', key: 's1_mapping', width: '250px' },
      { title: 'Transformation', key: 'transformation', width: '200px' },
      { title: 'Actions', key: 'actions', width: '100px', sortable: false }
    ]

    const requiredRules = [
      v => !!v || 'This field is required'
    ]    // Computed
    const clients = computed(() => appStore.clients)

    const flatXmlFields = computed(() => {
      return detectedFields.value.map((field, index) => ({
        id: `field_${index}`,
        path: field.xml_path,
        value: field.sample_value
      }))
    })

    const canProceed = computed(() => {
      switch (currentStep.value) {
        case 1:
          return documentFormValid.value
        case 2:
          return xmlContent.value && detectedFields.value.length > 0
        case 3:
          return fieldMappings.value.length > 0
        default:
          return true
      }
    })

    const canFinish = computed(() => {
      return fieldMappings.value.length > 0 && 
             fieldMappings.value.some(m => m.s1_table && m.s1_field)
    })

    // Methods
    const nextStep = () => {
      if (currentStep.value < totalSteps) {
        currentStep.value++
      }
    }

    const previousStep = () => {
      if (currentStep.value > 1) {
        currentStep.value--      }
    }

    const handleFileSelect = (files) => {
      console.log('handleFileSelect called with:', files)
      // v-file-input can return different formats, so just log for now
      // The actual processing happens when user clicks "Process XML File"
    }

    const processSelectedFile = () => {
      console.log('processSelectedFile called, selectedFile:', selectedFile.value)
      if (selectedFile.value) {
        // Handle both single file and array of files
        const file = Array.isArray(selectedFile.value) ? selectedFile.value[0] : selectedFile.value
        if (file) {
          console.log('Processing file:', file.name)
          processXmlFile(file)
        } else {
          console.error('No valid file found')
          alert('Please select an XML file first')
        }
      } else {
        console.error('No file selected')
        alert('Please select an XML file first')
      }
    }

    const handleFileDrop = (event) => {
      dragOver.value = false
      const files = event.dataTransfer.files
      if (files.length > 0 && (files[0].name.endsWith('.xml') || files[0].type === 'text/xml')) {
        selectedFile.value = [files[0]]
        processXmlFile(files[0])
      }
    }

    const processXmlFile = async (file) => {
      console.log('processXmlFile called with:', file)
      loading.value = true
      try {
        const text = await file.text()
        console.log('XML text loaded, length:', text.length)
        xmlContent.value = text
        analyzeXmlStructure(text)
        generateAutoMappingSuggestions()
        console.log('XML processing complete')
      } catch (error) {
        console.error('Error processing XML file:', error)
        alert('Error processing XML file: ' + error.message)
      } finally {
        loading.value = false
      }
    }

    const analyzeXmlStructure = (xmlText) => {
      console.log('analyzeXmlStructure called with text length:', xmlText.length)
      try {
        const parser = new DOMParser()
        const xmlDoc = parser.parseFromString(xmlText, 'text/xml')
        
        // Check for parsing errors
        const parseError = xmlDoc.querySelector('parsererror')
        if (parseError) {
          console.error('XML parsing error:', parseError.textContent)
          alert('XML parsing error: ' + parseError.textContent)
          return
        }
        
        console.log('XML parsed successfully, root element:', xmlDoc.documentElement.nodeName)
        
        const fields = []
        const structure = []
        
        const processNode = (node, path = '', parentId = null) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const currentPath = path ? `${path}/${node.nodeName}` : node.nodeName
            const nodeId = currentPath.replace(/\//g, '_')
            
            // Get text content, handling CDATA sections
            let textContent = ''
            if (node.childNodes.length === 1 && node.firstChild.nodeType === Node.TEXT_NODE) {
              textContent = node.firstChild.textContent?.trim() || ''
            } else if (node.childNodes.length === 1 && node.firstChild.nodeType === Node.CDATA_SECTION_NODE) {
              textContent = node.firstChild.textContent?.trim() || ''
            }
            
            const hasElementChildren = Array.from(node.children).length > 0
            
            // Add attributes as fields
            if (node.attributes && node.attributes.length > 0) {
              for (let attr of node.attributes) {
                fields.push({
                  xml_path: `${currentPath}/@${attr.name}`,
                  sample_value: attr.value,
                  s1_table: '',
                  s1_field: '',
                  transformation_rule: null,
                  default_value: '',
                  is_required: false,
                  active: true
                })
              }
            }
            
            // Add text content as field if no element children
            if (!hasElementChildren && textContent) {
              fields.push({
                xml_path: currentPath,
                sample_value: textContent,
                s1_table: '',
                s1_field: '',
                transformation_rule: null,
                default_value: '',
                is_required: false,
                active: true
              })
            }
            
            structure.push({
              id: nodeId,
              name: hasElementChildren ? node.nodeName : `${node.nodeName}: ${textContent}`,
              path: currentPath,
              value: textContent,
              children: hasElementChildren ? [] : undefined,
              parent: parentId
            })
            
            // Process child elements
            for (const child of node.children) {
              processNode(child, currentPath, nodeId)
            }
          }
        }
        
        processNode(xmlDoc.documentElement)
        
        detectedFields.value = fields
        fieldMappings.value = [...fields]
        
        // Build tree structure (keeping this for potential future use)
        const buildTree = (items, parentId = null) => {
          return items
            .filter(item => item.parent === parentId)
            .map(item => ({
              ...item,
              children: buildTree(items, item.id)
            }))
            .filter(item => item.children.length > 0 || item.value)
        }
        
        xmlStructure.value = buildTree(structure)
        
        console.log('XML Analysis Complete:', {
          fieldsDetected: fields.length,
          structureNodes: structure.length
        })
        
      } catch (error) {
        console.error('Error analyzing XML structure:', error)
      }
    }

    const generateAutoMappingSuggestions = () => {
      const suggestions = []
      
      detectedFields.value.forEach((field, index) => {
        const pathLower = field.xml_path.toLowerCase()
        
        // Simple field name matching
        if (pathLower.includes('id') && pathLower.includes('invoice')) {
          suggestions.push({ index, table: 'FINDOC', field: 'FINCODE' })
        } else if (pathLower.includes('date')) {
          suggestions.push({ index, table: 'FINDOC', field: 'FINDATE' })
        } else if (pathLower.includes('quantity') || pathLower.includes('qty')) {
          suggestions.push({ index, table: 'ITELINES', field: 'QTY' })
        } else if (pathLower.includes('price')) {
          suggestions.push({ index, table: 'ITELINES', field: 'PRICE' })
        } else if (pathLower.includes('amount') || pathLower.includes('total')) {
          suggestions.push({ index, table: 'ITELINES', field: 'VAL' })
        }
      })
      
      autoMappingSuggestions.value = suggestions
    }

    const applyAutoMappings = () => {
      autoMappingSuggestions.value.forEach(suggestion => {
        if (fieldMappings.value[suggestion.index]) {
          fieldMappings.value[suggestion.index].s1_table = suggestion.table
          fieldMappings.value[suggestion.index].s1_field = suggestion.field
        }
      })
      autoMappingSuggestions.value = []
    }

    const updateMapping = async (index, field, value) => {
      if (fieldMappings.value[index]) {
        fieldMappings.value[index][field] = value
        
        // Clear field and load new fields when table changes
        if (field === 's1_table') {
          fieldMappings.value[index].s1_field = ''
          if (value) {
            await loadS1Fields(value)
          }
        }
      }
    }

    const removeMapping = (index) => {
      fieldMappings.value.splice(index, 1)
    }

    const getFieldsForTable = async (table) => {
      if (!table) return []
      
      // Load fields if not cached
      await loadS1Fields(table)
      return s1Fields.value[table] || []
    }

    const openS1Browser = async () => {
      // Load S1 tables if not already loaded
      if (s1Tables.value.length === 0) {
        await loadS1Tables()
      }
      s1BrowserDialog.value = true
    }

    const selectS1Field = (table, field) => {
      // This would be used when selecting from browser
      // TODO: Implement field selection logic
      console.log('Selected field:', table, field)
      s1BrowserDialog.value = false
    }

    const openTransformationBuilder = (mapping, index) => {
      selectedMappingForTransform.value = mapping
      selectedMappingIndex.value = index
      transformationDialog.value = true
      
      // Reset transformation settings
      customTransformation.value = {
        simple_rule: mapping.transformation_rule ? [mapping.transformation_rule] : [],
        script: '',
        sql: '',
        default_value: mapping.default_value || ''
      }
    }

    const applyCustomTransformation = () => {
      if (selectedMappingIndex.value >= 0) {
        const mapping = fieldMappings.value[selectedMappingIndex.value]
        
        if (customTransformation.value.simple_rule.length > 0) {
          mapping.transformation_rule = customTransformation.value.simple_rule.join(',')
        }
        
        mapping.default_value = customTransformation.value.default_value
        
        // TODO: Handle custom script and SQL transformations
      }
      
      transformationDialog.value = false
    }

    const testMappings = async () => {
      testing.value = true
      try {
        // Simulate testing logic
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        const errors = []
        fieldMappings.value.forEach(mapping => {
          if (!mapping.s1_table || !mapping.s1_field) {
            errors.push(`Missing S1 mapping for: ${mapping.xml_path}`)
          }
        })
        
        testResults.value = {
          success: errors.length === 0,
          errors: errors
        }
        
      } catch (error) {
        console.error('Error testing mappings:', error)
        testResults.value = {
          success: false,
          errors: ['Failed to test mappings: ' + error.message]
        }
      } finally {
        testing.value = false
      }
    }

    const clearXml = () => {
      xmlContent.value = ''
      xmlStructure.value = []
      detectedFields.value = []
      fieldMappings.value = []
      selectedFile.value = null
      testResults.value = null
    }

    const createMapping = async () => {
      creating.value = true
      try {
        // First create the document mapping
        const docMapping = await api.service('document-mappings').create({
          ...documentConfig.value,
          lines_path: detectLinesPath()
        })
        
        // Then create all field mappings
        const fieldMappingPromises = fieldMappings.value
          .filter(fm => fm.s1_table && fm.s1_field)
          .map(fm => api.service('field-mappings').create({
            document_mapping_id: docMapping.id,
            xml_path: fm.xml_path,
            s1_table: fm.s1_table,
            s1_field: fm.s1_field,
            transformation_rule: fm.transformation_rule,
            default_value: fm.default_value,
            is_required: fm.is_required,
            active: fm.active
          }))
        
        await Promise.all(fieldMappingPromises)
        
        // Navigate to the field mappings view
        router.push(`/mappings/fields/${docMapping.id}`)
        
      } catch (error) {
        console.error('Error creating mapping:', error)
      } finally {
        creating.value = false
      }
    }

    const detectLinesPath = () => {
      // Try to detect repeating line elements
      const commonLinePaths = ['InvoiceLine', 'OrderLine', 'Line', 'Item']
      for (const field of detectedFields.value) {
        for (const linePath of commonLinePaths) {
          if (field.xml_path.includes(linePath)) {
            const parts = field.xml_path.split('/')
            const lineIndex = parts.findIndex(p => p.includes(linePath))
            if (lineIndex > 0) {
              return parts.slice(0, lineIndex + 1).join('/')
            }
          }
        }
      }
      return ''
    }

    onMounted(async () => {
      await appStore.loadReferenceData()
      // Pre-load S1 tables for better UX
      await loadS1Tables()
    })

    return {      // State
      currentStep,
      totalSteps,
      loading,
      creating,
      testing,
      documentForm,
      documentFormValid,
      documentConfig,
      selectedFile,
      xmlContent,
      xmlStructure,
      detectedFields,
      dragOver,
      fieldMappings,
      autoMappingSuggestions,
      s1BrowserDialog,
      selectedS1Table,
      transformationDialog,
      selectedMappingForTransform,
      transformTab,
      customTransformation,
      testResults,
      s1Tables,
      s1Fields,
      loadingS1Data,
        // Static data
      steps,
      documentTypes,
      directions,
      transformationRules,
      mappingHeaders,
      requiredRules,
        // Computed
      clients,
      flatXmlFields,
      canProceed,
      canFinish,      // Methods
      nextStep,
      previousStep,
      handleFileSelect,
      processSelectedFile,
      handleFileDrop,
      applyAutoMappings,
      updateMapping,
      removeMapping,      getFieldsForTable,
      loadS1Tables,
      loadS1Fields,
      getFallbackFields,
      openS1Browser,
      selectS1Field,
      openTransformationBuilder,
      applyCustomTransformation,
      testMappings,
      clearXml,
      createMapping
    }
  }
}
</script>

<style scoped>
.border-primary {
  border-color: rgb(var(--v-theme-primary)) !important;
  border-width: 2px !important;
}

code {
  font-family: 'Courier New', monospace;
  font-size: 0.875rem;
  padding: 2px 4px;
  border-radius: 3px;
  background-color: rgba(0, 0, 0, 0.05);
}

.text-primary {
  color: rgb(var(--v-theme-primary));
}
</style>
