<template>
  <div>
    <v-toolbar flat>
      <v-toolbar-title>
        <v-icon class="mr-2">mdi-auto-fix</v-icon>
        Mapping Wizard
      </v-toolbar-title>
    </v-toolbar>

    <v-card class="ma-4">
      <v-card-text>
        <v-alert type="info" variant="tonal">
          <v-icon class="mr-2">mdi-information</v-icon>
          The sophisticated Mapping Wizard will be implemented here.
          This will provide step-by-step guidance for creating new mappings with XML upload and drag-and-drop functionality.
        </v-alert>
      </v-card-text>
    </v-card>
  </div>
</template>

<script>
export default {
  name: 'MappingWizard'
}
</script>
