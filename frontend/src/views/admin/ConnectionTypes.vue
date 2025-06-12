<template>
  <div>
    <v-toolbar flat>
      <v-toolbar-title>
        <v-icon class="mr-2">mdi-connection</v-icon>
        Connection Types
      </v-toolbar-title>
    </v-toolbar>

    <v-card class="ma-4">
      <v-card-text>
        <v-alert type="info" variant="tonal">
          <v-icon class="mr-2">mdi-information</v-icon>
          Connection Types management (SFTP, FTP, FTPS) will be implemented here.
        </v-alert>
      </v-card-text>
    </v-card>
  </div>
</template>

<script>
export default {
  name: 'ConnectionTypes'
}
</script>
