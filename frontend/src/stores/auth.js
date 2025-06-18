import { defineStore } from 'pinia'
// import { api } from '@/services/api' // TODO: Use for real authentication

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: localStorage.getItem('token'),
    isLoading: false,
    error: null
  }),

  getters: {
    isAuthenticated: (state) => !!state.token && !!state.user,
    isAdmin: (state) => state.user?.role === 'ADMIN',
    isClient: (state) => state.user?.role === 'CLIENT',
    currentClientId: (state) => state.user?.trdr_client
  },
  actions: {
    async login(credentials) {
      this.isLoading = true
      this.error = null
      
      try {
        // Mock authentication for development
        if (credentials.email === 'admin@petfactory.ro' && credentials.password === 'admin123') {
          this.token = 'mock-jwt-token-admin'
          this.user = {
            id: 1,
            email: 'admin@petfactory.ro',
            role: 'ADMIN',
            trdr_client: null
          }
        } else if (credentials.email === 'client@petfactory.ro' && credentials.password === 'client123') {
          this.token = 'mock-jwt-token-client'
          this.user = {
            id: 2,
            email: 'client@petfactory.ro',
            role: 'CLIENT',
            trdr_client: 1
          }
        } else {
          throw new Error('Invalid credentials')
        }
        
        localStorage.setItem('token', this.token)
        return { accessToken: this.token, user: this.user }
      } catch (error) {
        this.error = error.message || 'Login failed'
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async logout() {
      this.token = null
      this.user = null
      this.error = null
      localStorage.removeItem('token')
    },

    async fetchCurrentUser() {
      if (!this.token) return
      
      try {
        // Mock user fetch based on token
        if (this.token === 'mock-jwt-token-admin') {
          this.user = {
            id: 1,
            email: 'admin@petfactory.ro',
            role: 'ADMIN',
            trdr_client: null
          }
        } else if (this.token === 'mock-jwt-token-client') {
          this.user = {
            id: 2,
            email: 'client@petfactory.ro',
            role: 'CLIENT',
            trdr_client: 1
          }
        }
      } catch (error) {
        console.warn('Failed to fetch current user:', error)
        await this.logout()
      }
    },

    clearError() {
      this.error = null
    }
  }
})
