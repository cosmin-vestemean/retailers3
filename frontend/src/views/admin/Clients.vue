<template>
  <div>
    <v-toolbar flat>
      <v-toolbar-title>
        <v-icon class="mr-2">mdi-domain</v-icon>
        Platform Clients
      </v-toolbar-title>
      <v-spacer />
      <v-btn
        color="primary"
        prepend-icon="mdi-plus"
        @click="openCreateDialog"
      >
        Add Client
      </v-btn>
    </v-toolbar>    <!-- Data Table -->
    <v-data-table
      v-model:items-per-page="itemsPerPage"
      :headers="headers"
      :items="clients"
      :loading="loading"
      class="elevation-1"
    >
      <!-- Company/Branch Column -->
      <template #item.company_branch="{ item }">
        <div class="text-caption">
          <div><strong>Company:</strong> {{ item.company }}</div>
          <div><strong>Branch:</strong> {{ item.branch }}</div>
        </div>
      </template>

      <!-- Statistics Column -->
      <template #item.statistics="{ item }">
        <div class="text-caption" v-if="item.statistics">
          <div><strong>Retailers:</strong> {{ item.statistics.retailer_count }}</div>
          <div><strong>Connections:</strong> {{ item.statistics.connection_count }}</div>
          <div><strong>Providers:</strong> {{ item.statistics.provider_count }}</div>
        </div>
      </template>

      <template #item.active="{ item }">
        <v-chip
          :color="item.active ? 'success' : 'error'"
          size="small"
          variant="tonal"
        >
          {{ item.active ? 'Active' : 'Inactive' }}
        </v-chip>
      </template>

      <template #item.actions="{ item }">
        <v-btn
          icon="mdi-pencil"
          size="small"
          variant="text"
          @click="openEditDialog(item)"
        />
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
    <v-dialog v-model="dialog" max-width="600px">
      <v-card>
        <v-card-title>
          <span class="text-h5">{{ isEditing ? 'Edit' : 'Create' }} Client</span>
        </v-card-title>

        <v-card-text>          <v-form ref="form" v-model="formValid">
            <v-text-field
              v-model="editedItem.name"
              label="Client Name"
              :rules="nameRules"
              required
            />
            
            <v-text-field
              v-model="editedItem.wsurl"
              label="Web Service URL"
              :rules="urlRules"
              required
              placeholder="https://yourcompany.oncloud.gr/s1services"
            />
            
            <v-text-field
              v-model="editedItem.wsuser"
              label="Web Service User"
              :rules="requiredRules"
              required
            />
            
            <v-text-field
              v-model="editedItem.wspass"
              label="Web Service Password"
              type="password"
              :rules="requiredRules"
              required
            />
            
            <v-text-field
              v-model="editedItem.appid"
              label="App ID"
              type="number"
              :rules="appidRules"
              required
            />
            
            <v-text-field
              v-model="editedItem.company"
              label="Company"
              type="number"
              :rules="requiredRules"
              required
            />
            
            <v-text-field
              v-model="editedItem.branch"
              label="Branch"
              type="number"
              :rules="requiredRules"
              required
            />
            
            <v-switch
              v-model="editedItem.active"
              label="Active"
              color="primary"
            />
          </v-form>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn text @click="closeDialog">Cancel</v-btn>
          <v-btn
            color="primary"
            :disabled="!formValid"
            :loading="saving"
            @click="saveClient"
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
          Are you sure you want to delete client "{{ itemToDelete?.name }}"?
          This action cannot be undone.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn text @click="deleteDialog = false">Cancel</v-btn>
          <v-btn
            color="error"
            :loading="deleting"
            @click="deleteClient"
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
import { ref, onMounted } from 'vue'
import { api } from '@/services/api'

export default {
  name: 'Clients',
  setup() {
    const clients = ref([])
    const loading = ref(false)
    const dialog = ref(false)
    const deleteDialog = ref(false)
    const formValid = ref(false)
    const saving = ref(false)
    const deleting = ref(false)
    const itemsPerPage = ref(10)
    const form = ref(null)
      const editedItem = ref({
      name: '',
      wsurl: '',
      wsuser: '',
      wspass: '',
      appid: '',
      company: '',
      branch: '',
      active: true
    })
    
    const defaultItem = {
      name: '',
      wsurl: '',
      wsuser: '',
      wspass: '',
      appid: '',
      company: '',
      branch: '',
      active: true
    }
    
    const itemToDelete = ref(null)
    const isEditing = ref(false)
    
    const snackbar = ref({
      show: false,
      message: '',
      color: 'success'
    })
    
    const headers = [
      { title: 'Name', key: 'name', sortable: true },
      { title: 'Web Service URL', key: 'wsurl', sortable: true },
      { title: 'App ID', key: 'appid', sortable: true },
      { title: 'Company/Branch', key: 'company_branch', sortable: false },
      { title: 'Statistics', key: 'statistics', sortable: false },
      { title: 'Status', key: 'active', sortable: true },
      { title: 'Actions', key: 'actions', sortable: false, width: '120px' }
    ]
    
    const nameRules = [
      v => !!v || 'Name is required',
      v => v.length >= 3 || 'Name must be at least 3 characters'
    ]
    
    const urlRules = [
      v => !!v || 'Web Service URL is required',
      v => /^https?:\/\/.+/.test(v) || 'Must be a valid URL'
    ]
    
    const requiredRules = [
      v => !!v || 'This field is required'
    ]    
    const appidRules = [
      v => !!v || 'App ID is required',
      v => !isNaN(v) && parseInt(v) > 0 || 'Must be a positive number'
    ]
    
    const fetchClients = async () => {
      loading.value = true
      try {
        const response = await api.service('platform-clients').find()
        clients.value = response.data || response
      } catch (error) {
        showSnackbar('Failed to load clients', 'error')
        console.error('Error fetching clients:', error)
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
    
    const saveClient = async () => {
      if (!formValid.value) return
      
      saving.value = true
      try {
        if (isEditing.value) {
          await api.service('platform-clients').patch(editedItem.value.id, editedItem.value)
          showSnackbar('Client updated successfully', 'success')
        } else {
          await api.service('platform-clients').create(editedItem.value)
          showSnackbar('Client created successfully', 'success')
        }
        
        closeDialog()
        await fetchClients()
      } catch (error) {
        showSnackbar('Failed to save client', 'error')
        console.error('Error saving client:', error)
      } finally {
        saving.value = false
      }
    }
    
    const deleteClient = async () => {
      if (!itemToDelete.value) return
      
      deleting.value = true
      try {
        await api.service('platform-clients').remove(itemToDelete.value.id)
        showSnackbar('Client deleted successfully', 'success')
        deleteDialog.value = false
        await fetchClients()
      } catch (error) {
        showSnackbar('Failed to delete client', 'error')
        console.error('Error deleting client:', error)
      } finally {
        deleting.value = false
      }
    }
    
    const showSnackbar = (message, color = 'success') => {
      snackbar.value = {
        show: true,
        message,
        color
      }
    }
    
    onMounted(() => {
      fetchClients()
    })
    
    return {
      clients,
      loading,
      dialog,
      deleteDialog,
      formValid,      saving,
      deleting,
      itemsPerPage,
      form,
      editedItem,
      itemToDelete,
      isEditing,
      snackbar,
      headers,
      nameRules,
      urlRules,
      requiredRules,
      appidRules,
      fetchClients,
      openCreateDialog,
      openEditDialog,
      openDeleteDialog,
      closeDialog,
      saveClient,
      deleteClient
    }
  }
}
</script>
