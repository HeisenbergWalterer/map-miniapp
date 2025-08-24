import { createRouter, createWebHashHistory } from 'vue-router'
import Login from '../pages/Login.vue'
import ModulePage from '../pages/ModulePage.vue'
import SitesPage from '../pages/SitesPage.vue'
import Reservations from '../pages/Reservations.vue'
import FeedbackPage from '../pages/FeedbackPage.vue'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', redirect: { name: 'module', params: { module: 'contact' } } },
    { name: 'login', path: '/login', component: Login },
    { name: 'module', path: '/module/:module', component: ModulePage, props: true },
    { name: 'sites', path: '/module/sites', component: SitesPage, props: (route) => ({ keyword: route.query.keyword }) },
    {
      name: 'reservations',
      path: '/module/reservations',
      component: Reservations,
      props: true,
      children: [
        {
          name: 'venue-reservations',
          path: 'venue',
          component: () => import('../pages/VenueReservations.vue')
        },
        {
          name: 'event-registrations',
          path: 'event',
          component: () => import('../pages/EventRegistrations.vue')
        },
        {
          path: '',
          redirect: { name: 'venue-reservations' }
        }
      ]
    },
    { name: 'feedback', path: '/feedback', component: FeedbackPage }
  ],
})

export default router




