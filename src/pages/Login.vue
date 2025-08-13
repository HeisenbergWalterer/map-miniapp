<template>
  <div class="login-page">
    <div class="login-container">
      <h2>登录管理系统</h2>
      <div class="form-item">
        <label>用户名</label>
        <input v-model.trim="username" type="text" placeholder="请输入用户名" />
      </div>
      <div class="form-item">
        <label>密码</label>
        <input v-model="password" type="password" placeholder="请输入密码" />
      </div>
      <button class="btn primary" :disabled="loading" @click="onLogin">{{ loading ? '登录中...' : '登录' }}</button>
      <div class="error-text" v-if="error">{{ error }}</div>
    </div>
  </div>
  </template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { signInWithUsernameAndPassword, getAuth } from '../services/cloud'

const router = useRouter()
const username = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

getAuth().getLoginState().then((s: any) => { if (s) router.replace({ name: 'module', params: { module: 'contact' } }) })

async function onLogin() {
  error.value = ''
  loading.value = true
  try {
    await signInWithUsernameAndPassword(username.value, password.value)
    router.replace({ name: 'module', params: { module: 'contact' } })
  } catch (e: any) {
    error.value = e?.message || '登录失败'
  } finally {
    loading.value = false
  }
}
</script>




