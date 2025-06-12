<template>
  <div>
    <v-toolbar flat>
      <v-toolbar-title>
        <v-icon class="mr-2">mdi-format-list-bulleted</v-icon>
        Field Mappings
      </v-toolbar-title>
    </v-toolbar>

    <v-card class="ma-4">
      <v-card-text>
        <v-alert type="info" variant="tonal">
          <v-icon class="mr-2">mdi-information</v-icon>
          Field Mappings management will be implemented here.
          This will configure which XML fields map to which S1 table fields.
        </v-alert>
      </v-card-text>
    </v-card>
  </div>
</template>

<script>
export default {
  name: 'FieldMappings'
}
</script>
