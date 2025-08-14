<template>
  <div>
    <!-- 类型筛选器 -->
    <div class="filter-bar">
      <label>点位类型：</label>
      <select v-model="currentTypeFilter" @change="onTypeFilterChange" class="filter-select">
        <option value="">全部类型</option>
        <option v-for="(config, key) in siteTypes" :key="key" :value="key">{{ config.name }}</option>
      </select>
      <span class="filter-info">共 {{total}} 个点位</span>
    </div>

    <div class="table-wrapper">
      <table>
        <thead>
          <tr>
            <th v-for="c in columns" :key="c">{{ getColumnName(c) }}</th>
            <th style="width:160px">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in list" :key="row._id">
            <td v-for="c in columns" :key="c" :class="cellClass(c)">{{ display(row[c]) }}</td>
            <td class="actions-cell">
              <button class="btn sm primary" @click="openEdit(row)">编辑</button>
              <button class="btn sm danger" @click="onDelete(row)">删除</button>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-if="!loading && list.length===0" class="empty-tip">
        {{ currentTypeFilter ? `暂无${siteTypes[currentTypeFilter]?.name || '该类型'}点位` : '暂无点位数据' }}
      </div>
      <div class="pagination">
        <button class="btn" :disabled="pageNo<=1" @click="changePage(pageNo-1)">上一页</button>
        <span>第 {{pageNo}} / {{maxPage}} 页（共 {{total}} 条）</span>
        <button class="btn" :disabled="pageNo>=maxPage" @click="changePage(pageNo+1)">下一页</button>
      </div>
    </div>

    <!-- 编辑/新建弹窗 -->
    <div v-show="modalVisible" class="modal-mask" @click.self="closeModal"></div>
    <div v-show="modalVisible" class="modal" role="dialog" aria-modal="true">
      <div class="modal-header">
        <h3>{{ isCreate ? '新建点位' : '编辑点位' }}</h3>
        <button class="icon-btn" @click="closeModal">✕</button>
      </div>
      <div class="modal-body">
        <div class="form-item">
          <label for="form-type">点位类型 *</label>
          <select id="form-type" v-model="form.type" :disabled="!isCreate" required>
            <option value="">请选择点位类型</option>
            <option v-for="(config, key) in siteTypes" :key="key" :value="key">{{ config.name }}</option>
          </select>
        </div>
        <div class="form-item" v-for="key in formKeys" :key="key">
          <label :for="'form-'+key">{{ getFieldName(key) }} {{ key === 'name' ? '*' : '' }}</label>
          <textarea v-if="isLongText(form[key])" :id="'form-'+key" rows="3" v-model.trim="form[key]"></textarea>
          <input v-else type="text" :id="'form-'+key" v-model.trim="form[key]" :required="key === 'name'" />
        </div>
        <div class="error-text" v-if="error">{{ error }}</div>
      </div>
      <div class="modal-footer">
        <button class="btn" @click="closeModal">取消</button>
        <button class="btn primary" :disabled="saving" @click="onSave">{{ saving ? '保存中...' : '保存' }}</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref, watch, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { modules } from '../config/modules'
import { queryCollection, updateDoc, createDoc, deleteDoc } from '../services/cloud'

const route = useRoute()
const router = useRouter()

const keyword = computed(() => route.query.keyword as string || '')

const pageSize = 10
const pageNo = ref(1)
const total = ref(0)
const list = ref<any[]>([])
const loading = ref(false)
const columns = ref<string[]>([])
const error = ref('')
const currentTypeFilter = ref('')

const modalVisible = ref(false)
const isCreate = ref(false)
const form = reactive<Record<string, any>>({})
const saving = ref(false)

const siteTypes = (modules.sites as any).siteTypes || {}
const maxPage = computed(() => Math.max(1, Math.ceil(total.value / pageSize)))

// 字段名称映射
const fieldNameMap: Record<string, string> = {
  id: 'ID',
  name: '名称',
  address: '地址',
  latitude: '纬度',
  longitude: '经度',
  type: '类型',
  photoUrl: '图片链接',
  serviceContent: '服务内容',
  serviceTime: '服务时间',
  _collection: '所属集合'
}

function getColumnName(key: string) {
  return fieldNameMap[key] || key
}

function getFieldName(key: string) {
  return fieldNameMap[key] || key
}

function calcColumns(rows: any[]) {
  const IGNORE = new Set(['_id', '_openid', 'remark', '_collection'])
  const keys = new Set<string>()
  rows.forEach((r) => Object.keys(r || {}).forEach((k) => { if (!IGNORE.has(k)) keys.add(k) }))
  const ordered = ['name','type','address','serviceTime'].filter((k) => keys.has(k))
  const rest = Array.from(keys).filter((k) => !ordered.includes(k)).sort()
  return [...ordered, ...rest]
}

function display(v: any) { 
  if (v == null) return ''
  if (typeof v === 'object') return JSON.stringify(v)
  if (typeof v === 'string' && siteTypes[v]) return siteTypes[v].name
  return String(v)
}

function cellClass(key: string) {
  const small = ['id','latitude','longitude','photoUrl']
  return small.includes(key) ? 'cell-small' : /url/i.test(key) ? 'cell-url' : ''
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const { list: rows, total: t } = await queryCollection({ 
      collection: 'sites', 
      pageNo: pageNo.value, 
      pageSize, 
      keyword: keyword.value,
      typeFilter: currentTypeFilter.value
    })
    list.value = rows
    total.value = t
    columns.value = rows.length ? calcColumns(rows) : modules.sites.fallbackFields
  } catch (e: any) {
    error.value = e?.message || '加载失败'
    if (/未登录|登录已过期/.test(error.value)) router.replace({ name: 'login' })
  } finally {
    loading.value = false
  }
}

function changePage(n: number) { 
  if (n >= 1 && n <= maxPage.value) { 
    pageNo.value = n
    load() 
  } 
}

function onTypeFilterChange() {
  pageNo.value = 1
  load()
}

function openCreate() {
  isCreate.value = true
  Object.keys(form).forEach((k) => delete form[k])
  modules.sites.fallbackFields.forEach((k: string) => form[k] = '')
  form.type = currentTypeFilter.value || ''
  modalVisible.value = true
}

function openEdit(row: any) {
  isCreate.value = false
  Object.keys(form).forEach((k) => delete form[k])
  const keys = calcColumns([row])
  keys.forEach((k) => form[k] = row[k] ?? '')
  form._id = row._id
  form._collection = row._collection || row.type
  modalVisible.value = true
}

function closeModal() { 
  modalVisible.value = false 
  saving.value = false
  error.value = ''
}

function isLongText(v: any) { return typeof v === 'string' && v.length > 60 }
const formKeys = computed(() => Object.keys(form).filter((k) => !['_id', '_collection'].includes(k)))

async function onSave() {
  saving.value = true
  error.value = ''
  try {
    if (!form.name) throw new Error('名称不能为空')
    if (!form.type) throw new Error('请选择点位类型')
    
    if (isCreate.value) {
      const actualCollection = form.type
      if (!actualCollection) throw new Error('请选择点位类型')
      
      const payload: any = { ...form }
      delete payload._id
      delete payload._collection
      
      await createDoc(actualCollection, payload)
    } else {
      const id = form._id
      if (!id) throw new Error('未选择记录')
      const actualCollection = form._collection || form.type
      if (!actualCollection) throw new Error('无法确定要更新的集合')
      
      const payload: any = { ...form }
      delete payload._id
      delete payload._collection
      
      await updateDoc(actualCollection, id, payload)
    }
    closeModal()
    load()
  } catch (e: any) {
    error.value = e?.message || '保存失败'
  } finally {
    saving.value = false
  }
}

async function onDelete(row: any) {
  if (!confirm(`确认删除点位"${row.name}"？该操作不可恢复。`)) return
  try {
    const actualCollection = row._collection || row.type
    if (!actualCollection) throw new Error('无法确定要删除的集合')
    
    await deleteDoc(actualCollection, row._id)
    load()
  } catch (e: any) {
    alert(e?.message || '删除失败')
  }
}

onMounted(load)
watch(() => [keyword.value], () => { pageNo.value = 1; load() })

defineExpose({ reload: load, openCreate })
</script>

<style scoped>
.filter-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  padding: 12px 16px;
  background: var(--white);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow-sm);
}

.filter-select {
  padding: 6px 12px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--white);
  min-width: 120px;
}

.filter-info {
  color: var(--muted);
  font-size: 14px;
  margin-left: auto;
}

.empty-tip {
  text-align: center;
  padding: 40px 20px;
  color: var(--muted);
}
</style>

