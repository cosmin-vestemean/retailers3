<template>
  <v-app>
    <v-main>
      <v-container fluid class="pa-0">
        <router-view />
      </v-container>
    </v-main>
    
    <!-- Global Loading Overlay -->
    <v-overlay v-model="isGlobalLoading" class="align-center justify-center">
      <v-progress-circular size="64" indeterminate color="primary" />
    </v-overlay>
  </v-app>
</template>

<script>
import { computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'

export default {
  name: 'App',
  setup() {
    const authStore = useAuthStore()
    const appStore = useAppStore()

    // Initialize the app
    onMounted(async () => {
      // Try to authenticate with stored token
      if (authStore.token) {
        try {
          await authStore.fetchCurrentUser()
          // Load reference data if authenticated
          if (authStore.isAuthenticated) {
            await appStore.loadReferenceData()
          }
        } catch (error) {
          console.warn('Failed to initialize app:', error)
        }
      }
    })

    return {
      isGlobalLoading: computed(() => Object.values(appStore.isLoading).some(loading => loading))
    }
  }
}
</script>

<style scoped>
/* Global app styles can go here */
</style>
