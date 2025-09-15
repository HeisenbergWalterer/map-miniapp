<template>
  <div class="content">
    <div class="table-wrapper">
      <h2 style="margin:0 0 12px 0;">公告管理</h2>
      <!-- 工具栏：筛选 + 操作 -->
      <div class="toolbar">
        <label class="toolbar-label">类型</label>
        <select class="toolbar-select" v-model="typeFilter">
          <option value="all">全部</option>
          <option value="article">文章链接</option>
          <option value="text">文字公告</option>
        </select>

        <label class="toolbar-label">状态</label>
        <select class="toolbar-select" v-model="statusFilter">
          <option value="all">全部</option>
          <option value="active">生效</option>
          <option value="inactive">未生效</option>
        </select>

        <button class="btn" @click="reload({ pageNo: 1 })">刷新</button>
        <button class="btn primary" @click="openCreate">新建公告</button>

        <span class="cell-small total-tip">共 {{ total }} 条</span>
      </div>

      <div v-if="loadError" class="error-tip">{{ loadError }}</div>
      <table>
        <thead>
          <tr>
            <th style="width: 20%">标题</th>
            <th style="width: 8%">类型</th>
            <th style="width: 8%">状态</th>
            <th style="width: 14%">创建时间</th>
            <th style="width: 14%">更新时间</th>
            <th style="width: 30%">内容/链接</th>
            <th style="width: 160px">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in list" :key="row._id" :class="{ 'inactive-row': row.status==='inactive' }">
            <td>{{ row.title }}</td>
            <td>
              <span :class="['tag', 'tag-type', row.type==='article' ? 'tag-blue' : 'tag-green']">{{ typeLabel(row.type) }}</span>
            </td>
            <td>
              <span :class="['tag', row.status==='active' ? 'tag-success' : 'tag-muted']">{{ statusLabel(row.status) }}</span>
            </td>
            <td>{{ formatTime(row.created_at) }}</td>
            <td>{{ formatTime(row.updated_at) }}</td>
            <td :class="row.type==='text' ? 'cell-small' : 'cell-url'">
              <template v-if="row.type==='article'">
                <a v-if="row.link" :href="row.link" target="_blank" rel="noopener" class="link-pill">打开文章</a>
                <span v-else>未填写链接</span>
              </template>
              <template v-else>
                <span :title="displayText(row.content)">{{ snippet(displayText(row.content)) }}</span>
              </template>
            </td>
            <td class="actions-cell">
              <button class="btn sm primary" @click="openEdit(row)">编辑</button>
              <button class="btn sm danger" @click="onDelete(row)">删除</button>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-if="!loading && list.length===0" class="empty-tip">暂无公告</div>
      <div class="pagination">
        <button class="btn" :disabled="pageNo<=1" @click="changePage(pageNo-1)">上一页</button>
        <span>第 {{pageNo}} / {{maxPage}} 页（共 {{total}} 条）</span>
        <button class="btn" :disabled="pageNo>=maxPage" @click="changePage(pageNo+1)">下一页</button>
      </div>
    </div>
  </div>

  <!-- 编辑/新建弹窗 -->
  <div v-show="modalVisible" class="modal-mask" @click.self="closeModal"></div>
  <div v-show="modalVisible" class="modal" role="dialog" aria-modal="true">
    <div class="modal-header">
      <h3>{{ isCreate ? '新建公告' : '编辑公告' }}</h3>
      <button class="icon-btn" @click="closeModal">✕</button>
    </div>
    <div class="modal-body">
      <div class="form-item">
        <label for="title">标题</label>
        <input id="title" type="text" v-model.trim="form.title" placeholder="请输入标题" />
      </div>
      <div class="form-item">
        <label for="type">类型</label>
        <select id="type" v-model="form.type">
          <option value="article">文章链接</option>
          <option value="text">文字公告</option>
        </select>
      </div>
      <div class="form-item">
        <label for="status">状态</label>
        <select id="status" v-model="form.status">
          <option value="active">生效</option>
          <option value="inactive">未生效</option>
        </select>
      </div>
      <div class="form-item" v-if="form.type==='article'">
        <label for="link">文章链接</label>
        <input id="link" type="text" v-model.trim="form.link" placeholder="https://..." />
      </div>
      <div class="form-item" v-else>
        <label for="content">文字内容</label>
        <textarea id="content" rows="6" v-model="form.content" placeholder="输入文字内容（回车换行）"></textarea>
        <div class="cell-small">保存时会将换行转换为 \n 存储，方便小程序解析显示。</div>
      </div>
      <div class="error-text" v-if="error" style="color:#e11d48;">{{ error }}</div>
    </div>
    <div class="modal-footer">
      <button class="btn" @click="closeModal">取消</button>
      <button class="btn primary" :disabled="saving" @click="onSave">{{ saving ? '保存中...' : '保存' }}</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { getDb, getAuth, createDoc, updateDoc, deleteDoc } from '../services/cloud'

type AnnType = 'article' | 'text'
type AnnStatus = 'active' | 'inactive'

const db = getDb()

// 列表与分页
const pageSize = 10
const pageNo = ref(1)
const total = ref(0)
const list = ref<any[]>([])
const loading = ref(false)
const keyword = ref('')
const typeFilter = ref<'all' | AnnType>('all')
const statusFilter = ref<'all' | AnnStatus>('all')
const loadError = ref('')
const maxPage = computed(() => Math.max(1, Math.ceil(total.value / pageSize)))

// 弹窗与表单
const modalVisible = ref(false)
const isCreate = ref(false)
const saving = ref(false)
const error = ref('')
const form = reactive<{ _id?: string; title: string; type: AnnType; status: AnnStatus; link?: string; content?: string }>({
  title: '',
  type: 'article',
  status: 'active',
  link: '',
  content: ''
})

function typeLabel(t: AnnType) { return t === 'article' ? '文章链接' : '文字公告' }
function statusLabel(s: AnnStatus) { return s === 'active' ? '生效' : '未生效' }
function formatTime(v?: string) { if (!v) return ''; try { return new Date(v).toLocaleString('zh-CN') } catch { return v || '' } }
function snippet(s?: string) { if (!s) return ''; return s.length > 80 ? s.slice(0, 80) + '…' : s }
function displayText(stored?: string) { return (stored || '').replace(/\\n/g, '\n') }
function toStorageText(input?: string) { return (input || '').replace(/\r?\n/g, '\\n') }

async function load() {
  loading.value = true
  error.value = ''
  loadError.value = ''
  try {
    const where: any = {}
    if (keyword.value) {
      const reg = db.RegExp({ regexp: keyword.value, options: 'i' })
      where['$or'] = [{ title: reg }, { content: reg }]
    }
    if (typeFilter.value !== 'all') where.type = typeFilter.value
    if (statusFilter.value !== 'all') where.status = statusFilter.value
    const skip = (pageNo.value - 1) * pageSize
    const countRes = await db.collection('announcements').where(where).count()
    total.value = countRes?.total || 0
    const res = await db.collection('announcements')
      .where(where)
      .orderBy('updated_at', 'desc')
      .skip(skip)
      .limit(pageSize)
      .get()
    list.value = res.data || []
  } catch (e: any) {
    const msg = e?.message || '加载失败'
    error.value = msg
    loadError.value = msg
  } finally {
    loading.value = false
  }
}

function changePage(n: number) { if (n>=1 && n<=maxPage.value) { pageNo.value = n; load() } }

function resetForm() {
  form._id = undefined
  form.title = ''
  form.type = 'article'
  form.status = 'active'
  form.link = ''
  form.content = ''
}

function openCreate() {
  isCreate.value = true
  resetForm()
  modalVisible.value = true
}

function openEdit(row: any) {
  isCreate.value = false
  form._id = row._id
  form.title = row.title || ''
  form.type = (row.type as AnnType) || 'article'
  form.status = (row.status as AnnStatus) || 'active'
  form.link = row.link || ''
  // 将存储中的 \n 转换为真实换行，便于 textarea 编辑
  form.content = displayText(row.content || '')
  modalVisible.value = true
}

function closeModal() { modalVisible.value = false }

async function onSave() {
  saving.value = true
  error.value = ''
  try {
    if (!form.title) throw new Error('标题不能为空')
    if (form.type === 'article') {
      if (!form.link) throw new Error('文章链接不能为空')
      if (!/^https?:\/\//i.test(form.link)) throw new Error('文章链接需以 http(s) 开头')
    } else {
      if (!form.content || !form.content.trim()) throw new Error('文字内容不能为空')
    }

    const now = new Date().toISOString()
    const auth = getAuth()
    const state = await auth.getLoginState()
    const createdBy = (state as any)?.user?.uid || (state as any)?.user?.username || 'admin'

    if (isCreate.value) {
      const payload: any = {
        title: form.title,
        type: form.type,
        status: form.status,
        link: form.type==='article' ? form.link : '',
        content: form.type==='text' ? toStorageText(form.content) : '',
        created_at: now,
        updated_at: now,
        created_by: createdBy
      }
      await createDoc('announcements', payload)
    } else {
      if (!form._id) throw new Error('未选择记录')
      const payload: any = {
        title: form.title,
        type: form.type,
        status: form.status,
        link: form.type==='article' ? form.link : '',
        content: form.type==='text' ? toStorageText(form.content) : '',
        updated_at: now
      }
      await updateDoc('announcements', form._id, payload)
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
  if (!confirm('确认删除该公告？该操作不可恢复。')) return
  try {
    await deleteDoc('announcements', row._id)
    load()
  } catch (e: any) {
    alert(e?.message || '删除失败')
  }
}

// 供顶部搜索与刷新调用
function reload(opts?: { pageNo?: number; keyword?: string }) {
  if (opts?.pageNo) pageNo.value = opts.pageNo
  if (opts && 'keyword' in opts) keyword.value = opts.keyword || ''
  load()
}

// 默认首次加载
reload({ pageNo: 1 })

defineExpose({ reload, openCreate })

// 变更筛选时重载
watch([typeFilter, statusFilter], () => { pageNo.value = 1; load() })
</script>

<style scoped>
.toolbar { display:flex; gap:10px; align-items:center; flex-wrap:wrap; margin-bottom:12px; }
.toolbar-label { color:#64748b; font-size:12px; }
.toolbar-select { height:32px; padding:4px 8px; border:1px solid var(--border); border-radius:8px; background:#fff; }
.total-tip { margin-left:auto; }
.error-tip { color:#e11d48; margin-bottom:8px; }

.tag { display:inline-block; padding:2px 8px; border-radius:999px; font-size:12px; line-height:18px; border:1px solid transparent; }
.tag-type { min-width: 80px; text-align:center; white-space: nowrap; }
.tag-blue { background:#eff6ff; color:#1d4ed8; border-color:#bfdbfe; }
.tag-green { background:#ecfdf5; color:#047857; border-color:#a7f3d0; }
.tag-success { background:#ecfdf5; color:#065f46; border-color:#a7f3d0; }
.tag-muted { background:#f3f4f6; color:#6b7280; border-color:#e5e7eb; }

.inactive-row { opacity:.7; }
.link-pill { display:inline-block; padding:6px 10px; background:#111827; color:#fff; text-decoration:none; border-radius:999px; box-shadow: var(--shadow-sm); }
.link-pill:hover { background:#000; }
</style>

