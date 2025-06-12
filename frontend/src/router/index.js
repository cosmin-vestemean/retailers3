import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

// Lazy load components
const Dashboard = () => import('@/views/Dashboard.vue')
const Login = () => import('@/views/auth/Login.vue')

// Admin views
const Clients = () => import('@/views/admin/Clients.vue')
const EdiProviders = () => import('@/views/admin/EdiProviders.vue')
const ConnectionTypes = () => import('@/views/admin/ConnectionTypes.vue')

// Mapping views  
const DocumentMappings = () => import('@/views/mappings/DocumentMappings.vue')
const FieldMappings = () => import('@/views/mappings/FieldMappings.vue')
const MappingWizard = () => import('@/views/mappings/MappingWizard.vue')

// Monitoring views
const ProcessingStatus = () => import('@/views/monitoring/ProcessingStatus.vue')
const ErrorLogs = () => import('@/views/monitoring/ErrorLogs.vue')

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    name: 'Dashboard',
    component: Dashboard,
    meta: { requiresAuth: true }
  },
  {
    path: '/admin',
    meta: { requiresAuth: true, requiresAdmin: true },
    children: [
      {
        path: 'clients',
        name: 'AdminClients',
        component: Clients
      },
      {
        path: 'edi-providers',
        name: 'AdminEdiProviders',
        component: EdiProviders
      },
      {
        path: 'connection-types',
        name: 'AdminConnectionTypes',
        component: ConnectionTypes
      }
    ]
  },
  {
    path: '/mappings',
    meta: { requiresAuth: true },
    children: [
      {
        path: 'documents',
        name: 'DocumentMappings',
        component: DocumentMappings
      },
      {
        path: 'fields/:documentId?',
        name: 'FieldMappings',
        component: FieldMappings,
        props: true
      },
      {
        path: 'wizard',
        name: 'MappingWizard',
        component: MappingWizard
      }
    ]
  },
  {
    path: '/monitoring',
    meta: { requiresAuth: true },
    children: [
      {
        path: 'status',
        name: 'ProcessingStatus',
        component: ProcessingStatus
      },
      {
        path: 'errors',
        name: 'ErrorLogs',
        component: ErrorLogs
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Navigation guards
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login')
  } else if (to.meta.requiresAdmin && !authStore.isAdmin) {
    next('/')
  } else if (to.path === '/login' && authStore.isAuthenticated) {
    next('/')
  } else {
    next()
  }
})

export default router
