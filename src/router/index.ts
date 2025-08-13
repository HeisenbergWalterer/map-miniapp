import { createRouter, createWebHashHistory } from 'vue-router'
import Login from '../pages/Login.vue'
import ModulePage from '../pages/ModulePage.vue'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', redirect: { name: 'module', params: { module: 'contact' } } },
    { name: 'login', path: '/login', component: Login },
    { name: 'module', path: '/module/:module', component: ModulePage, props: true },
  ],
})

export default router




