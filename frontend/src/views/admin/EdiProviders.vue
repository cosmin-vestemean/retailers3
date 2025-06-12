<template>
  <div>
    <v-toolbar flat>
      <v-toolbar-title>
        <v-icon class="mr-2">mdi-server-network</v-icon>
        EDI Providers
      </v-toolbar-title>
      <v-spacer />
      <v-btn
        color="primary"
        prepend-icon="mdi-plus"
        @click="openCreateDialog"
      >
        Add Provider
      </v-btn>
    </v-toolbar>

    <v-card class="ma-4">
      <v-card-text>
        <v-alert type="info" variant="tonal">
          <v-icon class="mr-2">mdi-information</v-icon>
          EDI Providers management will be implemented here.
          This will manage providers like DocProcess and Infinite.
        </v-alert>
      </v-card-text>
    </v-card>
  </div>
</template>

<script>
export default {
  name: 'EdiProviders',
  setup() {
    const openCreateDialog = () => {
      console.log('Create EDI Provider dialog would open here')
    }
    
    return {
      openCreateDialog
    }
  }
}
</script>
