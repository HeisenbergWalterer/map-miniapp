<template>
  <div>
    <div class="table-wrapper">
      <table>
        <thead>
          <tr>
            <th v-for="c in columns" :key="c">{{ c }}</th>
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
      <div v-if="!loading && list.length===0" class="empty-tip">暂无数据</div>
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
        <h3>{{ isCreate ? '新建信息' : '编辑信息' }}</h3>
        <button class="icon-btn" @click="closeModal">✕</button>
      </div>
      <div class="modal-body">
        <div class="form-item" v-for="key in formKeys" :key="key">
          <label :for="'form-'+key">{{ key }}</label>
          <textarea v-if="isLongText(form[key])" :id="'form-'+key" rows="3" v-model.trim="form[key]"></textarea>
          <input v-else type="text" :id="'form-'+key" v-model.trim="form[key]" />
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

const props = defineProps<{ keyword?: string }>()
const route = useRoute()
const router = useRouter()

const pageSize = 10
const pageNo = ref(1)
const total = ref(0)
const list = ref<any[]>([])
const loading = ref(false)
const columns = ref<string[]>([])
const error = ref('')

const modalVisible = ref(false)
const isCreate = ref(false)
const form = reactive<Record<string, any>>({})

const saving = ref(false)
const moduleKey = computed(() => route.params.module as string)
const currentModule = computed(() => modules[moduleKey.value as keyof typeof modules])
const maxPage = computed(() => Math.max(1, Math.ceil(total.value / pageSize)))

function calcColumns(rows: any[]) {
  const IGNORE = new Set(['_id', '_openid', 'remark'])
  const keys = new Set<string>()
  rows.forEach((r) => Object.keys(r || {}).forEach((k) => { if (!IGNORE.has(k)) keys.add(k) }))
  const ordered = ['name','phone','address'].filter((k) => keys.has(k))
  const rest = Array.from(keys).filter((k) => !ordered.includes(k)).sort()
  return [...ordered, ...rest]
}

function display(v: any) { if (v==null) return ''; return typeof v==='object' ? JSON.stringify(v) : String(v) }
function cellClass(key: string) {
  const small = ['latitude','longitude','rphotoUrl','photoUrl','imageUrl']
  return small.includes(key) ? 'cell-small' : /url/i.test(key) ? 'cell-url' : ''
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const { list: rows, total: t } = await queryCollection({ collection: currentModule.value.collection, pageNo: pageNo.value, pageSize, keyword: props.keyword })
    list.value = rows
    total.value = t
    columns.value = rows.length ? calcColumns(rows) : currentModule.value.fallbackFields
  } catch (e: any) {
    error.value = e?.message || '加载失败'
    if (/未登录|登录已过期/.test(error.value)) router.replace({ name: 'login' })
  } finally {
    loading.value = false
  }
}

function changePage(n: number) { if (n>=1 && n<=maxPage.value) { pageNo.value = n; load() } }

function openCreate() {
  isCreate.value = true
  Object.keys(form).forEach((k) => delete form[k])
  ;(currentModule.value.fallbackFields || []).forEach((k: string) => form[k] = '')
  modalVisible.value = true
}

function openEdit(row: any) {
  isCreate.value = false
  Object.keys(form).forEach((k) => delete form[k])
  const keys = calcColumns([row])
  keys.forEach((k) => form[k] = row[k] ?? '')
  ;(form as any)._id = row._id
  modalVisible.value = true
}

function closeModal() { modalVisible.value = false }

function isLongText(v: any) { return typeof v === 'string' && v.length > 60 }
const formKeys = computed(() => Object.keys(form).filter((k) => k !== '_id'))

async function onSave() {
  saving.value = true
  try {
    if (!form.name) throw new Error('名称不能为空')
    if (isCreate.value) {
      await createDoc(currentModule.value.collection, { ...form })
    } else {
      const id = (form as any)._id
      if (!id) throw new Error('未选择记录')
      const payload: any = { ...form }
      delete payload._id
      await updateDoc(currentModule.value.collection, id, payload)
    }
    closeModal()
    load()
  } catch (e: any) {
    error.value = e?.message || '保存失败'
  }
  saving.value = false
}

async function onDelete(row: any) {
  if (!confirm('确认删除该记录？该操作不可恢复。')) return
  try {
    await deleteDoc(currentModule.value.collection, row._id)
    load()
  } catch (e: any) {
    alert(e?.message || '删除失败')
  }
}

onMounted(load)
watch(() => [moduleKey.value, props.keyword], () => { pageNo.value = 1; load() })

defineExpose({ reload: load, openCreate })
</script>


