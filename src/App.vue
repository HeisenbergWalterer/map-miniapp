<template>
  <header class="page-header">
    <button class="icon-btn" @click="toggleSidebar" aria-label="展开/收起导航">☰</button>
  <h1>微光驿站 · 管理后台</h1>
    <div class="header-actions">
      <input v-model.trim="keyword" type="text" placeholder="搜索关键词" />
      <button class="btn" @click="onSearch">搜索</button>
      <button class="btn primary" @click="onCreate">新建</button>
      <button class="btn danger" @click="onLogout">退出</button>
    </div>
  </header>
  <div class="layout">
    <aside v-show="sidebarVisible" class="sidebar">
      <nav>
        <div class="nav-group">
          <div class="nav-group-title">安新地图</div>
          <a :class="{active: currentModuleKey==='sites'}" href="javascript:void(0)" @click="switchModule('sites')">点位修改</a>
        </div>
        <div class="nav-group">
          <div class="nav-group-title">安新联系</div>
          <a :class="{active: currentModuleKey==='contact'}" href="javascript:void(0)" @click="switchModule('contact')">联系信息</a>
          <a :class="{active: currentModuleKey==='emergency'}" href="javascript:void(0)" @click="switchModule('emergency')">紧急服务</a>
        </div>
        <div class="nav-group">
          <div class="nav-group-title">安新活动</div>
          <a :class="{active: currentModuleKey==='reservations' || currentRouteIsReservation}" href="javascript:void(0)" @click="switchModule('reservations')">预约管理</a>
        </div>
        <div class="nav-group">
          <div class="nav-group-title">其他</div>
          <a :class="{active: currentModuleKey==='feedback'}" href="javascript:void(0)" @click="switchModule('feedback')">用户反馈</a>
          <a :class="{active: currentModuleKey==='announcements'}" href="javascript:void(0)" @click="switchModule('announcements')">公告管理</a>
        </div>
      </nav>
    </aside>
    <router-view v-slot="{ Component }">
      <component :is="Component" ref="pageRef" :keyword="keyword" class="content" />
    </router-view>
  </div>

  <!-- 弹窗由各页面自行控制渲染 -->
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ensureLogin, signOut } from './services/cloud'
import { modules, defaultModule } from './config/modules'

const router = useRouter()
const sidebarVisible = ref(true)
const keyword = ref('')

const moduleList = Object.values(modules)
const currentModuleKey = computed(() => {
  const route = router.currentRoute.value
  console.log('当前路由:', route)
  if (route.name === 'module') 
    return route.params.module as string || defaultModule
  
  // 处理预约管理的子路由
  if (route.name === 'venue-reservations' || route.name === 'event-registrations') {
    return 'reservations'
  }
  
  return route.name;
})

const currentRouteIsReservation = computed(() => {
  const name = router.currentRoute.value.name
  return name === 'reservations' || name === 'venue-reservations' || name === 'event-registrations'
})

ensureLogin().catch(() => router.replace({ name: 'login' }))

function toggleSidebar() { sidebarVisible.value = !sidebarVisible.value }
function onSearch() { 
  const currentRoute = router.currentRoute.value
  if (currentRoute.name === 'sites') {
    // 对于sites页面，通过路由参数传递搜索关键词
    router.push({ name: 'sites', query: { keyword: keyword.value } })
  } else {
    // 对于其他页面，调用reload方法
    (pageRef.value as any)?.reload({ pageNo: 1, keyword: keyword.value })
  }
}
function onCreate() { (pageRef.value as any)?.openCreate() }
async function onLogout() { await signOut(); router.replace({ name: 'login' }) }
function switchModule(key: string) { 
  console.log("switch:", key)
  if (key === 'sites') {
    router.push({ name: 'sites' })
  } else if (key === 'reservations'){
    console.log("switch to reservations")
    router.push({ name: 'reservations', params: { module: key } });
  } else if (key === 'feedback') {
    router.push({ name: 'feedback' })
  } else if (key === 'announcements') {
    router.push({ name: 'announcements' })
  } else {
    router.push({ name: 'module', params: { module: key } })
  }
}

const pageRef = ref()
</script>


