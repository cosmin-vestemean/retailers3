<template>
  <v-container fluid fill-height class="pa-0">
    <v-row align="center" justify="center" no-gutters class="fill-height">
      <v-col cols="12" sm="8" md="6" lg="4" xl="3">
        <v-card class="elevation-12" rounded="lg">
          <v-card-title class="text-center py-6">
            <v-icon size="48" color="primary" class="mb-4">mdi-factory</v-icon>
            <h2 class="text-h4 font-weight-light">EDI Platform</h2>
            <p class="text-subtitle-1 text-medium-emphasis">Pet Factory Integration</p>
          </v-card-title>
          
          <v-card-text class="px-8 pb-8">
            <v-form @submit.prevent="handleLogin" ref="form">
              <v-text-field
                v-model="credentials.email"
                label="Email"
                type="email"
                prepend-inner-icon="mdi-email"
                variant="outlined"
                density="comfortable"
                :rules="emailRules"
                :error-messages="errors.email"
                class="mb-4"
                required
              />
              
              <v-text-field
                v-model="credentials.password"
                label="Password"
                :type="showPassword ? 'text' : 'password'"
                prepend-inner-icon="mdi-lock"
                :append-inner-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
                @click:append-inner="showPassword = !showPassword"
                variant="outlined"
                density="comfortable"
                :rules="passwordRules"
                :error-messages="errors.password"
                class="mb-6"
                required
              />
              
              <v-btn
                type="submit"
                color="primary"
                size="large"
                block
                :loading="isLoading"
                :disabled="!isFormValid"
                class="mb-4"
              >
                Sign In
              </v-btn>
              
              <v-alert
                v-if="authError"
                type="error"
                variant="tonal"
                density="compact"
                class="mb-4"
              >
                {{ authError }}
              </v-alert>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

export default {
  name: 'Login',
  setup() {
    const router = useRouter()
    const authStore = useAuthStore()
    const form = ref(null)
    
    const credentials = ref({
      email: '',
      password: ''
    })
    
    const showPassword = ref(false)
    const errors = ref({})
    
    const emailRules = [
      v => !!v || 'Email is required',
      v => /.+@.+\..+/.test(v) || 'Email must be valid'
    ]
    
    const passwordRules = [
      v => !!v || 'Password is required',
      v => v.length >= 6 || 'Password must be at least 6 characters'
    ]
    
    const isFormValid = computed(() => {
      return credentials.value.email && 
             credentials.value.password && 
             /.+@.+\..+/.test(credentials.value.email) &&
             credentials.value.password.length >= 6
    })
    
    const isLoading = computed(() => authStore.isLoading)
    const authError = computed(() => authStore.error)
    
    const handleLogin = async () => {
      if (!isFormValid.value) return
      
      try {
        await authStore.login(credentials.value)
        router.push('/')
      } catch (error) {
        console.error('Login failed:', error)
      }
    }
    
    // Clear errors when component mounts
    onMounted(() => {
      authStore.clearError()
    })
    
    return {
      form,
      credentials,
      showPassword,
      errors,
      emailRules,
      passwordRules,
      isFormValid,
      isLoading,
      authError,
      handleLogin
    }
  }
}
</script>

<style scoped>
.v-container {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
}
</style>
