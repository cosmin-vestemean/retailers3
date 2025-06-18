<template>
  <div>
    <!-- App Bar -->
    <v-app-bar color="primary" dark>
      <v-app-bar-title>
        <v-icon class="mr-2">mdi-factory</v-icon>
        EDI Platform
      </v-app-bar-title>
      
      <v-spacer />
      
      <v-menu>
        <template #activator="{ props }">
          <v-btn icon v-bind="props">
            <v-avatar size="32">
              <v-icon>mdi-account-circle</v-icon>
            </v-avatar>
          </v-btn>
        </template>
        
        <v-list>
          <v-list-item>
            <v-list-item-title>{{ user?.email }}</v-list-item-title>
            <v-list-item-subtitle>{{ user?.role }}</v-list-item-subtitle>
          </v-list-item>
          <v-divider />
          <v-list-item @click="handleLogout">
            <v-list-item-title>
              <v-icon class="mr-2">mdi-logout</v-icon>
              Logout
            </v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </v-app-bar>

    <!-- Navigation Drawer -->
    <v-navigation-drawer permanent>
      <v-list nav>
        <v-list-item
          prepend-icon="mdi-view-dashboard"
          title="Dashboard"
          value="dashboard"
          @click="$router.push('/')"
        />
        
        <v-divider class="my-2" />
        
        <!-- Admin Section -->
        <template v-if="isAdmin">
          <v-list-subheader>Platform Management</v-list-subheader>
          
          <v-list-item
            prepend-icon="mdi-domain"
            title="Clients"
            value="clients"
            @click="$router.push('/admin/clients')"
          />
            <v-list-item
            prepend-icon="mdi-server-network"
            title="EDI Providers"
            value="edi-providers"
            @click="$router.push('/admin/edi-providers')"
          />
          
          <v-list-item
            prepend-icon="mdi-lan-connect"
            title="Connections"
            value="connections"
            @click="$router.push('/admin/connections')"
          />
          
          <v-list-item
            prepend-icon="mdi-connection"
            title="Connection Types"
            value="connection-types"
            @click="$router.push('/admin/connection-types')"
          />
          
          <v-divider class="my-2" />
        </template>
        
        <!-- Configuration Section -->
        <v-list-subheader>Configuration</v-list-subheader>
        
        <v-list-item
          prepend-icon="mdi-file-document"
          title="Document Mappings"
          value="document-mappings"
          @click="$router.push('/mappings/documents')"
        />
        
        <v-list-item
          prepend-icon="mdi-format-list-bulleted"
          title="Field Mappings"
          value="field-mappings"
          @click="$router.push('/mappings/fields')"
        />
        
        <v-list-item
          prepend-icon="mdi-auto-fix"
          title="Mapping Wizard"
          value="mapping-wizard"
          @click="$router.push('/mappings/wizard')"
        />
        
        <v-divider class="my-2" />
        
        <!-- Monitoring Section -->
        <v-list-subheader>Monitoring</v-list-subheader>
        
        <v-list-item
          prepend-icon="mdi-pulse"
          title="Processing Status"
          value="processing-status"
          @click="$router.push('/monitoring/status')"
        />
        
        <v-list-item
          prepend-icon="mdi-alert-circle"
          title="Error Logs"
          value="error-logs"
          @click="$router.push('/monitoring/errors')"
        />
      </v-list>
    </v-navigation-drawer>

    <!-- Main Content Area -->
    <v-main>
      <v-container fluid>
        <!-- Dashboard Cards -->
        <v-row>
          <v-col cols="12" sm="6" md="3">
            <v-card color="primary">
              <v-card-text class="text-white">
                <div class="d-flex align-center">
                  <v-icon size="40" class="mr-4">mdi-file-document</v-icon>
                  <div>
                    <div class="text-h4 font-weight-bold">{{ stats.documentsToday }}</div>
                    <div class="text-subtitle-1">Documents Today</div>
                  </div>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
          
          <v-col cols="12" sm="6" md="3">
            <v-card color="success">
              <v-card-text class="text-white">
                <div class="d-flex align-center">
                  <v-icon size="40" class="mr-4">mdi-check-circle</v-icon>
                  <div>
                    <div class="text-h4 font-weight-bold">{{ stats.successRate }}%</div>
                    <div class="text-subtitle-1">Success Rate</div>
                  </div>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
          
          <v-col cols="12" sm="6" md="3">
            <v-card color="warning">
              <v-card-text class="text-white">
                <div class="d-flex align-center">
                  <v-icon size="40" class="mr-4">mdi-clock</v-icon>
                  <div>
                    <div class="text-h4 font-weight-bold">{{ stats.pending }}</div>
                    <div class="text-subtitle-1">Pending</div>
                  </div>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
          
          <v-col cols="12" sm="6" md="3">
            <v-card color="error">
              <v-card-text class="text-white">
                <div class="d-flex align-center">
                  <v-icon size="40" class="mr-4">mdi-alert-circle</v-icon>
                  <div>
                    <div class="text-h4 font-weight-bold">{{ stats.errors }}</div>
                    <div class="text-subtitle-1">Errors</div>
                  </div>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <!-- Recent Activity -->
        <v-row class="mt-4">
          <v-col cols="12">
            <v-card>
              <v-card-title>
                <v-icon class="mr-2">mdi-history</v-icon>
                Recent Activity
              </v-card-title>
              
              <v-card-text>
                <v-list>
                  <v-list-item
                    v-for="activity in recentActivity"
                    :key="activity.id"
                    :prepend-icon="activity.icon"
                    :title="activity.title"
                    :subtitle="activity.subtitle"
                  >
                    <template #append>
                      <v-chip
                        :color="activity.statusColor"
                        size="small"
                        variant="tonal"
                      >
                        {{ activity.status }}
                      </v-chip>
                    </template>
                  </v-list-item>
                </v-list>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

export default {
  name: 'Dashboard',
  setup() {
    const router = useRouter()
    const authStore = useAuthStore()
    
    // Mock data - replace with real API calls
    const stats = ref({
      documentsToday: 124,
      successRate: 96,
      pending: 8,
      errors: 3
    })
    
    const recentActivity = ref([
      {
        id: 1,
        icon: 'mdi-file-document',
        title: 'Order processed from Auchan',
        subtitle: '2 minutes ago',
        status: 'Success',
        statusColor: 'success'
      },
      {
        id: 2,
        icon: 'mdi-file-document',
        title: 'Invoice sent to Dedeman',
        subtitle: '5 minutes ago',
        status: 'Success',
        statusColor: 'success'
      },
      {
        id: 3,
        icon: 'mdi-alert-circle',
        title: 'Error processing Sezamo order',
        subtitle: '10 minutes ago',
        status: 'Error',
        statusColor: 'error'
      }
    ])
    
    const user = computed(() => authStore.user)
    const isAdmin = computed(() => authStore.isAdmin)
    
    const handleLogout = async () => {
      await authStore.logout()
      router.push('/login')
    }
    
    onMounted(() => {
      // Load dashboard data
      // TODO: Implement real API calls
    })
    
    return {
      stats,
      recentActivity,
      user,
      isAdmin,
      handleLogout
    }
  }
}
</script>
