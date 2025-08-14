import { createRouter, createWebHashHistory } from 'vue-router'
import Login from '../pages/Login.vue'
import ModulePage from '../pages/ModulePage.vue'
import SitesPage from '../pages/SitesPage.vue'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', redirect: { name: 'module', params: { module: 'contact' } } },
    { name: 'login', path: '/login', component: Login },
    { name: 'module', path: '/module/:module', component: ModulePage, props: true },
    { name: 'sites', path: '/module/sites', component: SitesPage, props: (route) => ({ keyword: route.query.keyword }) },
  ],
})

export default router




