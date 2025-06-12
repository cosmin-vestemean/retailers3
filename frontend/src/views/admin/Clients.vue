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
    </v-toolbar>

    <!-- Data Table -->
    <v-data-table
      v-model:items-per-page="itemsPerPage"
      :headers="headers"
      :items="clients"
      :loading="loading"
      class="elevation-1"
    >      <template #item.active="{ item }">
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

        <v-card-text>
          <v-form ref="form" v-model="formValid">
            <v-text-field
              v-model="editedItem.name"
              label="Client Name"
              :rules="nameRules"
              required
            />
            
            <v-text-field
              v-model="editedItem.contact_email"
              label="Contact Email"
              type="email"
              :rules="emailRules"
              required
            />
            
            <v-text-field
              v-model="editedItem.contact_phone"
              label="Contact Phone"
              :rules="phoneRules"
            />
            
            <v-textarea
              v-model="editedItem.description"
              label="Description"
              rows="3"
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
      contact_email: '',
      contact_phone: '',
      description: '',
      active: true
    })
    
    const defaultItem = {
      name: '',
      contact_email: '',
      contact_phone: '',
      description: '',
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
      { title: 'Contact Email', key: 'contact_email', sortable: true },
      { title: 'Contact Phone', key: 'contact_phone', sortable: false },
      { title: 'Status', key: 'active', sortable: true },
      { title: 'Actions', key: 'actions', sortable: false, width: '120px' }
    ]
    
    const nameRules = [
      v => !!v || 'Name is required',
      v => v.length >= 3 || 'Name must be at least 3 characters'
    ]
    
    const emailRules = [
      v => !!v || 'Email is required',
      v => /.+@.+\..+/.test(v) || 'Email must be valid'
    ]
    
    const phoneRules = [
      v => !v || v.length >= 10 || 'Phone must be at least 10 characters'
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
      formValid,
      saving,
      deleting,
      itemsPerPage,
      form,
      editedItem,
      itemToDelete,
      isEditing,
      snackbar,
      headers,
      nameRules,
      emailRules,
      phoneRules,
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
