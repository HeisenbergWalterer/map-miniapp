<template>
  <div>
    <!-- 搜索栏 -->
    <div class="search-bar">
      <input 
        v-model="searchKeyword" 
        placeholder="搜索反馈类型、内容、联系方式或位置..." 
        class="search-input"
        @input="onSearchInput"
      />
      <button class="btn primary" @click="search">搜索</button>
      <button class="btn" @click="clearSearch">清空</button>
    </div>

    <!-- 反馈列表 -->
    <div class="table-wrapper">
      <table>
        <thead>
          <tr>
            <th v-for="c in columns" :key="c">{{ getColumnTitle(c) }}</th>
            <th style="width:120px">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in list" :key="row._id">
            <td v-for="c in columns" :key="c" :class="cellClass(c)">
              {{ displayValue(row[c], c) }}
            </td>
            <td class="actions-cell">
              <button class="btn sm primary" @click="viewDetail(row)">查看详情</button>
            </td>
          </tr>
        </tbody>
      </table>
      
      <div v-if="!loading && list.length===0" class="empty-tip">暂无反馈数据</div>
      
      <!-- 分页 -->
      <div class="pagination">
        <button class="btn" :disabled="pageNo<=1" @click="changePage(pageNo-1)">上一页</button>
        <span>第 {{pageNo}} / {{maxPage}} 页（共 {{total}} 条）</span>
        <button class="btn" :disabled="pageNo>=maxPage" @click="changePage(pageNo+1)">下一页</button>
      </div>
    </div>

    <!-- 反馈详情弹窗 -->
    <div v-show="detailModalVisible" class="modal-mask" @click.self="closeDetailModal"></div>
    <div v-show="detailModalVisible" class="modal" role="dialog" aria-modal="true">
      <div class="modal-header">
        <h3>反馈详情</h3>
        <button class="icon-btn" @click="closeDetailModal">✕</button>
      </div>
      <div class="modal-body">
        <div class="detail-item" v-for="key in detailKeys" :key="key">
          <label class="detail-label">{{ getColumnTitle(key) }}：</label>
          <div class="detail-value">
            <span v-if="key === 'content'" class="feedback-content">{{ selectedFeedback[key] }}</span>
            <span v-else>{{ displayValue(selectedFeedback[key], key) }}</span>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn" @click="closeDetailModal">关闭</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref, computed } from 'vue'
import { queryCollection } from '../services/cloud'

const pageSize = 10
const pageNo = ref(1)
const total = ref(0)
const list = ref<any[]>([])
const loading = ref(false)
const columns = ref<string[]>([])
const searchKeyword = ref('')
const searchTimeout = ref<NodeJS.Timeout>()

// 详情弹窗
const detailModalVisible = ref(false)
const selectedFeedback = ref<any>({})

// 计算最大页数
const maxPage = computed(() => Math.max(1, Math.ceil(total.value / pageSize)))

// 列标题映射 - 只保留核心字段
const columnTitles: Record<string, string> = {
  // 核心字段
  type: '反馈类型',
  content: '反馈内容',
  createTime: '提交时间',
  contact: '联系方式',
  selectedPoint: '选择定位',
  
  // 其他可能出现的字段（备用）
  userName: '用户名',
  phone: '手机号',
  status: '状态',
  address: '地址',
  email: '邮箱'
}

// 获取列标题
function getColumnTitle(key: string): string {
  return columnTitles[key] || key
}

// 核心字段列表 - 固定顺序（5个核心字段）
const coreFields = ['type', 'content', 'createTime', 'contact', 'selectedPoint']

// 计算列 - 只显示核心字段
function calcColumns(rows: any[]) {
  // 直接返回固定的5个核心字段，不再动态计算
  return coreFields
}

// 显示值
function displayValue(v: any, key: string): string {
  if (v == null || v === '') return getDefaultValue(key)
  
  // 时间字段
  if (key === 'createTime') {
    try {
      return new Date(v).toLocaleString('zh-CN')
    } catch {
      return '时间格式错误'
    }
  }
  
  // 反馈类型
  if (key === 'type') {
    const typeMap: Record<string, string> = {
      'bug': '问题反馈',
      'suggestion': '意见建议',
      'complaint': '投诉',
      'praise': '表扬',
      'point': '地点反馈',
      'other': '其他'
    }
    return typeMap[v] || v
  }
  
  // 选择定位
  if (key === 'selectedPoint') {
    if (v && typeof v === 'object') {
      if (v.latitude && v.longitude) {
        return `${v.latitude.toFixed(6)}, ${v.longitude.toFixed(6)}`
      }
      if (v.address) {
        return v.address
      }
    }
    return v || '未选择位置'
  }
  
  // 联系方式
  if (key === 'contact') {
    if (v && typeof v === 'object') {
      const parts = []
      if (v.userName) parts.push(`姓名: ${v.userName}`)
      if (v.phone) parts.push(`电话: ${v.phone}`)
      if (v.email) parts.push(`邮箱: ${v.email}`)
      return parts.length > 0 ? parts.join(', ') : '无联系方式'
    }
    return v || '未提供'
  }
  
  // 反馈内容
  if (key === 'content') {
    if (typeof v === 'string' && v.length > 50) {
      return v.substring(0, 50) + '...'
    }
    return v
  }
  
  return typeof v === 'object' ? JSON.stringify(v) : String(v)
}

// 获取字段的默认值
function getDefaultValue(key: string): string {
  const defaultValues: Record<string, string> = {
    type: '未分类',
    content: '暂无内容',
    createTime: '时间未知',
    contact: '未提供',
    selectedPoint: '未选择位置'
  }
  return defaultValues[key] || '暂无数据'
}

// 单元格样式
function cellClass(key: string) {
  if (key === 'content') return 'cell-content'
  if (key === 'createTime') return 'cell-time'
  if (key === 'status') return 'cell-status'
  return ''
}

// 搜索输入处理
function onSearchInput() {
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value)
  }
  searchTimeout.value = setTimeout(() => {
    search()
  }, 500)
}

// 搜索
function search() {
  pageNo.value = 1
  load()
}

// 清空搜索
function clearSearch() {
  searchKeyword.value = ''
  pageNo.value = 1
  load()
}

// 切换页面
function changePage(page: number) {
  pageNo.value = page
  load()
}

// 查看详情
function viewDetail(row: any) {
  selectedFeedback.value = row
  detailModalVisible.value = true
}

// 关闭详情弹窗
function closeDetailModal() {
  detailModalVisible.value = false
  selectedFeedback.value = {}
}

// 获取详情显示的字段 - 只显示核心字段
const detailKeys = computed(() => {
  // 只返回6个核心字段，按指定顺序
  return coreFields
})

// 加载数据
async function load() {
  loading.value = true
  try {
    const { list: rows, total: t } = await queryCollection({ 
      collection: 'feedback', 
      pageNo: pageNo.value, 
      pageSize, 
      keyword: searchKeyword.value 
    })
    list.value = rows
    total.value = t
    
    // 始终显示6个核心字段的列标题，不管是否有数据
    columns.value = coreFields
  } catch (error) {
    console.error('加载反馈数据失败:', error)
    // 即使出错也显示列标题
    columns.value = coreFields
  } finally {
    loading.value = false
  }
}

// 页面加载时获取数据
onMounted(() => {
  load()
})
</script>

<style scoped>
.search-bar {
  margin-bottom: 20px;
  display: flex;
  gap: 10px;
  align-items: center;
}

.search-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.cell-content {
  max-width: 200px;
  word-break: break-all;
}

.cell-time {
  white-space: nowrap;
  font-size: 12px;
  color: #666;
}

.cell-status {
  text-align: center;
}

.detail-item {
  margin-bottom: 15px;
}

.detail-label {
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 5px;
}

.detail-value {
  color: #666;
  line-height: 1.5;
}

.feedback-content {
  white-space: pre-wrap;
  background: #f5f5f5;
  padding: 10px;
  border-radius: 4px;
  display: block;
  max-height: 200px;
  overflow-y: auto;
}

.empty-tip {
  text-align: center;
  padding: 40px;
  color: #999;
  font-size: 14px;
}
</style>
