<template>
  <div>
    <v-toolbar flat>
      <v-toolbar-title>
        <v-icon class="mr-2">mdi-alert-circle</v-icon>
        Error Logs
      </v-toolbar-title>
    </v-toolbar>

    <v-card class="ma-4">
      <v-card-text>
        <v-alert type="info" variant="tonal">
          <v-icon class="mr-2">mdi-information</v-icon>
          Error logs and troubleshooting interface will be implemented here.
          This will show processing errors, failed documents, and debugging information.
        </v-alert>
      </v-card-text>
    </v-card>
  </div>
</template>

<script>
export default {
  name: 'ErrorLogs'
}
</script>
