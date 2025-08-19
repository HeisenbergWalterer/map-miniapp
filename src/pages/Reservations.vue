<template>
    <div class="page-wrapper">
        <nav class="nav-bar">
            <button class="btn" :class="{active: activeTab==='venue'}" @click="goVenue">场馆预约</button>
            <button class="btn" :class="{active: activeTab==='event'}" @click="goEvent">活动报名</button>
        </nav>
        <router-view />
    </div>
</template>


<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()
const activeTab = ref('venue')

// 根据当前路由设置初始状态
function updateActiveTab() {
    if (route.name === 'event-registrations') {
        activeTab.value = 'event'
    } else {
        activeTab.value = 'venue'
    }
}

// 初始化时设置状态
updateActiveTab()

// 监听路由变化，动态更新activeTab状态
watch(() => route.name, () => {
    updateActiveTab()
})

function goVenue() {
    activeTab.value = 'venue'
    router.push({ name: 'venue-reservations' })
}
function goEvent() {
    activeTab.value = 'event'
    router.push({ name: 'event-registrations' })
}

onMounted(() => {
    if (route.name === 'reservations' && route.fullPath === '/module/reservations') {
        router.replace({ name: 'venue-reservations' })
    }
})
</script>
<style scoped>
.page-wrapper {
    padding: 32px;
}
.nav-bar {
    margin-bottom: 24px;
}
.btn {
    margin-right: 16px;
    padding: 8px 24px;
    border: none;
    background: #f5f5f5;
    color: #333;
    border-radius: 4px;
    cursor: pointer;
    font-size: 16px;
}
.btn.active {
    background: #409eff;
    color: #fff;
}
</style>