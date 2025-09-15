<template>
  <div class="page-wrapper">
    <h2>场馆预约管理页面</h2>
    <div class="card-list" v-show="!showReservation">
      <div v-if="venues.length === 0" class="empty-tip">暂无场馆</div>
      <div v-else>
        <div 
        v-for="venue in venues" 
        :key="venue._id" 
        class="activity-card"
        @click="openVenue(venue)">
          <div class="card-header">
            <h3 class="card-title">{{ venue.name || '未命名活动' }}</h3>
            <span class="card-date">{{ venue.all_time || '未设置时间' }}</span>
          </div>
          <div class="card-meta">
            <span class="card-location">{{ venue.address || '未设置地点' }}</span>
          </div>
        </div>
      </div>
    </div>
    <!-- 场馆预约详情 -->
    <div class="reservation-container" v-show="showReservation">
      <div class="reservation-header">
        <button @click="backToVenueList" class="back-btn">返回场馆列表</button>
        <h3>{{ currentVenue?.name || '未命名场馆' }}</h3>
        <button @click="toggleCancelledUsers" class="toggle-cancelled-btn">
          {{ showCancelled ? '隐藏已取消用户' : '显示已取消用户' }}
        </button>
        <button @click="exportToExcel" class="export-btn">导出表格</button>
        <button @click="openVenueModal" class="venue-manage-btn">场馆管理</button>
      </div>
      <div class="reservation-list">
        <table class="reservation-table">
          <thead>
            <tr>
              <th>姓名</th>
              <th>
                <select 
                  v-model="selectedDate" 
                  @change="onDateSelect"
                  class="date-filter-select"
                >
                  <option value="">全部日期</option>
                  <option v-for="date in dates" :key="date" :value="date">
                    {{ date }}
                  </option>
                </select>
              </th>
              <th>预约时间</th>
              <th>电话</th>
              <th>状态</th>
            </tr>
          </thead>
          <tbody>
            <!-- 显示已预约用户 -->
            <tr 
            v-for="res in filteredReservedList" 
            :key="res._id">
              <td>{{ res.name }}</td>
              <td>{{ res.date || '未设置日期' }}</td>
              <td>{{ res.order?.join(', ') || '未设置时间' }}</td>
              <td>{{ res.phone }}</td>
              <td>{{ getStatusText(res.status) }}</td>
            </tr>
            <!-- 显示已取消用户（如果启用） -->
            <tr v-if="showCancelled" v-for="res in filteredCancelledList" :key="'cancelled-' + res._id">
              <td>{{ res.name }}</td>
              <td>{{ res.date || '未设置日期' }}</td>
              <td>{{ res.order?.join(', ') || '未设置时间' }}</td>
              <td>{{ res.phone }}</td>
              <td>{{ getStatusText(res.status) }}</td>
            </tr>
          </tbody>
        </table>
        <div v-if="filteredReservedList.length === 0 && filteredCancelledList.length === 0" class="empty-tip">暂无预约用户</div>
        <div v-else-if="filteredReservedList.length === 0 && !showCancelled" class="empty-tip">暂无预约用户</div>
             </div>
     </div>
     
     <!-- 场馆管理弹窗 -->
     <div v-if="showVenueModal" class="modal-mask" @click="closeVenueModal">
       <div class="modal" @click.stop>
         <div class="modal-header">
           <h3>场馆管理 - {{ currentVenue?.name || '未命名场馆' }}</h3>
           <div class="header-actions">
             <button @click="openTimeslotModal" class="btn sm primary">预约时段管理</button>
             <button @click="closeVenueModal" class="close-btn">×</button>
           </div>
         </div>
         <div class="modal-body">
           <div class="venue-details">
             <div class="detail-item" v-for="(label, fieldKey) in venueDisplayFields" :key="fieldKey">
               <span class="detail-label">{{ label }}:</span>
               <input 
                 type="text" 
                 v-model="venueFormData[fieldKey]" 
                 class="detail-input"
                 :placeholder="label"
               />
             </div>
           </div>
         </div>
         <div class="modal-footer">
           <button @click="closeVenueModal" class="btn">关闭</button>
           <button @click="saveVenueData" class="btn primary">保存</button>
         </div>
       </div>
     </div>

     <!-- 预约时段管理弹窗 -->
     <div v-if="showTimeslotModal" class="modal-mask" @click="closeTimeslotModal">
       <div class="modal" @click.stop>
         <div class="modal-header">
           <h3>预约时段管理</h3>
           <div class="header-actions">
             <button @click="closeTimeslotModal" class="close-btn">×</button>
           </div>
         </div>
         <div class="modal-body">
           <!-- 预约时段管理表格 -->
           <div class="timeslot-table-container">
             <table class="timeslot-table">
               <thead>
                 <tr>
                   <th class="time-slot-header">时间段</th>
                   <th 
                     v-for="day in dayslist" 
                     :key="day" 
                     class="day-header"
                   >
                     {{ day }}
                   </th>
                 </tr>
               </thead>
               <tbody>
                 <tr v-for="(slot, rowIndex) in slotslist" :key="rowIndex">
                   <td class="time-slot-label">{{ slot }}</td>
                   <td 
                     v-for="(day, colIndex) in dayslist" 
                     :key="colIndex" 
                     class="timeslot-cell"
                   >
                     <button 
                       :class="['timeslot-btn', { unavailable: !(curtable[rowIndex] && curtable[rowIndex][colIndex] === 1) }]"
                       @click="toggleSlot($event, rowIndex, colIndex)"
                     >
                       {{ curtable[rowIndex] && curtable[rowIndex][colIndex] === 1 ? '√' : '×' }}
                     </button>
                   </td>
                 </tr>
               </tbody>
             </table>
           </div>
         </div>
         <div class="modal-footer">
           <button @click="closeTimeslotModal" class="btn">关闭</button>
           <button @click="saveConfig" class="btn primary">保存</button>
         </div>
       </div>
     </div>
   </div>
 </template>

<script setup lang="ts">
  import { ref, onMounted } from 'vue'
  import { getCollection, queryElements, updateElement } from '../services/database'
  import { saveAs } from 'file-saver'
  import * as XLSX from 'xlsx'

  // 场馆列表
  const venues = ref<any[]>([]);
  const currentVenue = ref<any>(null);
  const timeslots = ref<any[]>([]);

  // 预约列表
  const reslist = ref<any[]>([]);
  const reservedList = ref<any[]>([]);
  const cancelledList = ref<any[]>([]);
  const basedate = ref<string>('');
  const dates = ref<any[]>([]);

  // 功能变量
  const showReservation = ref(false);
  const showCancelled = ref(false);
  
  // 场馆管理弹窗
  const showVenueModal = ref(false);
  const venueFormData = ref<any>({});
  const venueDisplayFields = {
    'center_id': '中心ID',
    'name': '场馆名称',
    'address': '场馆地址',
    'all_time': '营业时间',
    'phone': '联系电话',
    'notes': '备注信息'
  };

  // 预约时段管理弹窗
  const showTimeslotModal = ref(false);
  const dayslist = ref<any[]>(['周日', '周一', '周二', '周三', '周四', '周五', '周六']);
  const slotslist = ref<any[]>([]);
  const curtable = ref<any[]>([]);
  const config_id = ref<string>('');

  // 日期筛选
  const selectedDate = ref<string>('');
  const filteredReservedList = ref<any[]>([]);
  const filteredCancelledList = ref<any[]>([]);

  // 异步渲染
  onMounted(async () => {
    await loadVenus();
    await loadTimeSlots();
    loadDates();
  })

  // 加载场馆
  async function loadVenus() {
    console.log("loading venues...");
    const res = await getCollection('venue');
    venues.value = res;
  }

  // 加载时间段
  async function loadTimeSlots() {
    const res = await getCollection('time_slot');
    timeslots.value = res;
    basedate.value = res.find((t: any) => t.id == 0).date;
  }

  // 初始化日期
  function loadDates() {
    let date = basedate.value;
    for (let i = 0; i < 7; ++i) {
      dates.value.push(date);
      date = nextdate(date);
     }
  }

  // 打开场馆详情
  async function openVenue(venue: any) {
    console.log("openVenue:", venue);
    currentVenue.value = venue;
    showReservation.value = true;
    await loadRes();
    decodeRes();
  }

  // 加载预约详情
  async function loadRes() {
    const res = await queryElements('venue_reservation',{ venue_id: currentVenue.value._id });
    reslist.value = res;
    console.log("预约详情:", reslist.value);
  }

  // 解码预约详情
  function decodeRes() {
    // 按status字段过滤并分类数据
    const reservedUsers: any[] = [];
    const cancelledUsers: any[] = [];
    
    reslist.value.forEach((res: any) => {
      const slots = res.time_reserved;
      const order = slots.map((slot: any) => {
        const slot_id = slot[0] + 1;
        const start_time = timeslots.value.find((t: any) => t.id === slot_id)?.start_time;
        const end_time = timeslots.value.find((t: any) => t.id === slot_id)?.end_time;
        const time_str = `${start_time} - ${end_time}`;
        return time_str;
      })
      res.order = order;
      res.date = slots.map((slot: any) => calcdate(basedate.value, slot[1]))[0];
      
      // 分类用户
      if (res.status === 'cancelled') {
        cancelledUsers.push(res);
      } else {
        // 默认为已预约状态
        reservedUsers.push(res);
      }
    })
    
    reservedList.value = reservedUsers;
    cancelledList.value = cancelledUsers;
    
    // 应用日期筛选
    applyDateFilter();
    
    console.log("解码后预约详情:", reslist.value);
    console.log("已预约用户:", reservedList.value);
    console.log("已取消用户:", cancelledList.value);
  }

  // 返回场馆列表
  function backToVenueList() {
    showReservation.value = false;
    currentVenue.value = null;
    reservedList.value = [];
    cancelledList.value = [];
    showCancelled.value = false;
  }

  // 获取状态字
  function getStatusText(status: string | undefined): string {
    if (!status) return '已确认';
    switch (status.toLowerCase()) {
      case 'cancelled':
        return '已取消';
      case 'reserved':
        return '已预约';
      default:
        return status;
    }
  }

  // 计算指定日期
  function calcdate(date: string, num: number) {
    for (let i = 0; i < num; i++) {
      date = nextdate(date);
    }
    return date;
  }

  // 计算下一个日期
  function nextdate(date: string) {
    const dateobj = date.split('-');
    var month = parseInt(dateobj[0]);
    var day = parseInt(dateobj[1]);
    const year = new Date().getFullYear();
    const is_run = ((year % 4 == 0 && year % 100 != 0) || year % 400 == 0);
    day++;
    if (day > 31) {
      day = 1;
      month++;
    }
    else if (day > 30 && month == 4 || month == 6 || month == 9 || month == 11) {
      day = 1;
      month++;
    }
    else if (day > 28 + (is_run ? 1 : 0) && month == 2) {
      day = 1;
      month++;
    }
    if (month > 12) {
      month = 1;
    }
    return `${month}-${day}`;
  }

  // 切换显示已取消用户
  function toggleCancelledUsers() {
    showCancelled.value = !showCancelled.value;
  }

  // 应用日期筛选
  function applyDateFilter() {
    if (!selectedDate.value) {
      // 如果没有选择日期，显示所有数据
      filteredReservedList.value = reservedList.value;
      filteredCancelledList.value = cancelledList.value;
    } else {
      // 如果选择了日期，只显示该日期的数据
      filteredReservedList.value = reservedList.value.filter(res => 
        res.date === selectedDate.value
      );
      filteredCancelledList.value = cancelledList.value.filter(res => 
        res.date === selectedDate.value
      );
    }
  }

  // 日期选择变化处理
  function onDateSelect(event: Event) {
    const target = event.target as HTMLSelectElement;
    selectedDate.value = target.value;
    applyDateFilter();
  }

  // 导出表格到Excel
  function exportToExcel() {
    // 准备表头
    const headers = ['姓名', '日期', '预约时间', '电话', '状态'];
    
    // 准备数据行
    const dataRows: any[][] = [];
    
    // 添加已预约用户数据
    filteredReservedList.value.forEach(res => {
      dataRows.push([
        res.name || '',
        res.date || '',
        res.order?.join(', ') || '',
        res.phone || '',
        getStatusText(res.status) || ''
      ]);
    });
    
    // 如果显示已取消用户，也添加他们的数据
    if (showCancelled.value) {
      filteredCancelledList.value.forEach(res => {
        dataRows.push([
          res.name || '',
          res.date || '',
          res.order?.join(', ') || '',
          res.phone || '',
          getStatusText(res.status) || ''
        ]);
      });
    }
    
    // 创建工作簿
    const wb = XLSX.utils.book_new();
    
    // 创建工作表数据（包含表头）
    const wsData = [headers, ...dataRows];
    
    // 创建工作表
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    
    // 设置列宽
    const colWidths = [
      { wch: 15 }, // 姓名
      { wch: 12 }, // 日期
      { wch: 25 }, // 预约时间
      { wch: 15 }, // 电话
      { wch: 10 }  // 状态
    ];
    ws['!cols'] = colWidths;
    
    // 将工作表添加到工作簿
    XLSX.utils.book_append_sheet(wb, ws, '预约表');
    
    // 生成Excel文件
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    
    // 创建Blob对象
    const blob = new Blob([excelBuffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    
    // 生成文件名
    const fileName = `${currentVenue.value?.name || '场馆'}_预约表_${new Date().toISOString().split('T')[0]}.xlsx`;
    
    // 使用file-saver保存文件
    saveAs(blob, fileName);
  }

  // 场馆管理弹窗控制
  function openVenueModal() {
    // 初始化表单数据
    venueFormData.value = { ...currentVenue.value };
    showVenueModal.value = true;
  }
  
  // 关闭场馆管理弹窗
  function closeVenueModal() {
    showVenueModal.value = false;
  }
  
  // 保存场馆数据
  async function saveVenueData() {
    // 更新currentVenue中的值
    Object.keys(venueDisplayFields).forEach(fieldKey => {
      if (venueFormData.value[fieldKey] !== undefined) {
        currentVenue.value[fieldKey] = venueFormData.value[fieldKey];
      }
    });
    console.log("currentVenue保存场馆数据:", currentVenue.value);
    try {
      await updateElement('venue', currentVenue.value._id, currentVenue.value);
      console.log("保存场馆数据成功");
      // 更新场馆列表中的对应项
      const venueIndex = venues.value.findIndex(v => v._id === currentVenue.value._id);
      if (venueIndex !== -1) {
        venues.value[venueIndex] = { ...currentVenue.value };
      }
    } catch (error) {
      console.error("保存场馆数据失败:", error);
    } finally {
      closeVenueModal();
    }
  }

  // 预约时段管理弹窗控制
  function openTimeslotModal() {
    showTimeslotModal.value = true;
    loadConfigTable();
  }
  function closeTimeslotModal() {
    showTimeslotModal.value = false;
  }

  // 加载未来时段表
  async function loadConfigTable() {
    // 获取当前场馆预约时段设置表
    const venue_id = currentVenue.value._id;
    const configres = await queryElements('venue_table_config', { venue_id: venue_id});
    curtable.value = configres[0].table_config;
    config_id.value = configres[0]._id;
    // 解析时段表
    const templist = timeslots.value.filter((t: any) => t.id > 0);
    templist.sort((a: any, b: any) => a.id - b.id);
    const dclist = templist.map((t: any) => {
      if (t.id > 0) 
        return `${t.start_time}-${t.end_time}`;
    })
    slotslist.value = dclist;
  }

  // 切换单元格选中状态
  function toggleSlot(event: MouseEvent, rowIndex: number, colIndex: number) {
    console.log("event:", event);
    // 确保curtable数组已初始化
    if (!curtable.value[rowIndex]) {
      curtable.value[rowIndex] = [];
    }
    
    // 如果当前值不存在，初始化为0
    if (curtable.value[rowIndex][colIndex] === undefined) {
      curtable.value[rowIndex][colIndex] = 0;
    }
    
    // if (curtable.value[rowIndex][colIndex] === 1){
    //   // 如果当前是1，切换为0
    //   curtable.value[rowIndex][colIndex] = 0;
    //   // 切换样式
    //   event.target && (event.target.style.border = "2px solid #DC3545");
    // }
    // else {
    //   // 否则切换为1
    //   curtable.value[rowIndex][colIndex] = 1;
    //   // 切换样式
    //   event.target && (event.target.style.border = "2px solid #28A745");
    // }
    // 直接切换curtable中的值（0/1）
    curtable.value[rowIndex][colIndex] = curtable.value[rowIndex][colIndex] === 1 ? 0 : 1;
  }

  // 保存配置
  async function saveConfig() {
    console.log("保存配置:", curtable.value);
    const venue_id = currentVenue.value._id;
    updateElement('venue_table_config', config_id.value, {
      table_config: curtable.value
    });
    closeTimeslotModal();
  }
</script>



