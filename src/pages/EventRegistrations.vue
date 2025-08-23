<template>
  <div class="page-wrapper">
    <h2>活动报名管理页面</h2>
    <div class="card-list" v-show="!showUserList">
      <div v-if="activities.length === 0" class="empty-tip">暂无活动</div>
      <div v-else>
        <div 
        v-for="activity in activities" 
        :key="activity._id" 
        class="activity-card"
        @click="openActivity(activity)">
          <div class="card-header">
            <h3 class="card-title">{{ activity.title || '未命名活动' }}</h3>
            <span class="card-date">{{ activity.dates || '未设置时间' }}</span>
          </div>
          <div class="card-meta">
            <span class="card-location">{{ activity.place || '未设置地点' }}</span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 用户报名列表表格 -->
    <div class="user-list-container" v-show="showUserList">
      <div class="table-header">
        <button @click="backToActivityList" class="back-btn">返回活动列表</button>
        <h3>{{ currentActivity?.title || '活动' }} - 报名用户列表</h3>
        <button @click="openActivityModal" class="activity-manage-btn">活动管理</button>
        <button @click="toggleCancelledUsers" class="toggle-cancelled-btn">
          {{ showCancelled ? '隐藏已取消用户' : '显示已取消用户' }}
        </button>
      </div>
      <table class="user-table">
        <thead>
          <tr>
            <th>昵称</th>
            <th>电话</th>
            <th>报名时间</th>
            <th>状态</th>
          </tr>
        </thead>
        <tbody>
          <!-- 显示已报名用户 -->
          <tr v-for="user in ptsList" :key="user._id">
            <td>{{ user.name || '未填写' }}</td>
            <td>{{ user.phone || '未填写' }}</td>
            <td>{{ user.createdAt || '未知' }}</td>
            <td>{{ user.status === 'registered' ? '已报名' : '已报名' }}</td>
          </tr>
          <!-- 显示已取消用户（如果启用） -->
          <tr v-if="showCancelled" v-for="user in cancelledList" :key="'cancelled-' + user._id">
            <td>{{ user.name || '未填写' }}</td>
            <td>{{ user.phone || '未填写' }}</td>
            <td>{{ user.createdAt || '未知' }}</td>
            <td>{{ user.status === 'cancelled' ? '已取消' : '已取消' }}</td>
          </tr>
        </tbody>
      </table>
      <div v-if="ptsList.length === 0 && cancelledList.length === 0" class="empty-tip">暂无报名用户</div>
      <div v-else-if="ptsList.length === 0 && !showCancelled" class="empty-tip">暂无报名用户</div>
    </div>
    
    <!-- 活动管理弹窗 -->
    <div v-if="showActivityModal" class="modal-mask" @click="closeActivityModal">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>活动管理 - {{ currentActivity?.title || '未命名活动' }}</h3>
          <button @click="closeActivityModal" class="close-btn">×</button>
        </div>
        <div class="modal-body">
          <div class="activity-details">
            <div class="detail-item" v-for="(label, fieldKey) in activityDisplayFields" :key="fieldKey">
              <span class="detail-label">{{ label }}:</span>
              <input 
                type="text" 
                v-model="activityFormData[fieldKey]" 
                class="detail-input"
                :placeholder="label"
              />
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="closeActivityModal" class="btn">关闭</button>
          <button @click="saveActivityData" class="btn primary">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
    /***** 导入模块 *****/
    import { getCollection, queryElements, updateElement } from '../services/database';
    import { ref, onMounted } from 'vue';

    /***** 活动列表 *****/
    const activities = ref<any[]>([]);
    const currentActivity = ref<any>(null);
    const total = ref(0);
    
    /***** 用户列表 *****/
    const ptsList = ref<{name: string, phone: string, createdAt: string, status: string, _id?: string}[]>([]);
    const pts_total = ref(0);
    const cancelledList = ref<{name: string, phone: string, createdAt: string, status: string, _id?: string}[]>([]);
    
    /***** 用户列表显示 *****/
    const showUserList = ref(false);
    const showCancelled = ref(false);
    
    /***** 活动管理弹窗 *****/
    const showActivityModal = ref(false);
    const activityFormData = ref<any>({});
    const activityDisplayFields = {
        'center_id': '中心ID',
        'dates': '活动日期',
        'deadline': '报名截止时间',
        'notes': '备注信息',
        'place': '活动地点',
        'status': '活动状态',
        'title': '活动标题',
        'totalSlots': '总名额'
    };

    /***** 异步渲染 *****/
    onMounted(async () => {
        loadActivities();
    });

    /***** 加载活动列表 *****/
    async function loadActivities() {
      const activityObj = await getCollection('activity');
      activities.value = activityObj;
      total.value = activityObj.length;
      console.log("in function 活动列表:", activities.value[0]);
      console.log("in function 活动数量:", total.value);
    }

    /***** 加载活动报名数据 *****/
    async function loadParticipants(activity: any) {
      var _id = activity._id;
      const where = { activity_id: _id};
      const participants = await queryElements('activity_registration', where);
      console.log("openActivity participants:", participants);
      console.log("number of participants:", participants.length);
      
      // 按status字段过滤并分类数据
      const registeredUsers: any[] = [];
      const cancelledUsers: any[] = [];
      
      participants.forEach((participant: any) => {
        const userData = {
          name: participant.name || '',
          phone: participant.phone || '',
          createdAt: participant.createdAt || '',
          status: participant.status || 'registered',
          _id: participant._id
        };
        
        if (participant.status === 'cancelled') {
          cancelledUsers.push(userData);
        } else {
          // 默认为registered状态
          registeredUsers.push(userData);
        }
      });
      
      ptsList.value = registeredUsers;
      cancelledList.value = cancelledUsers;
    }

    /***** 打开活动详情 *****/
    async function openActivity(activity: any) {
        currentActivity.value = activity;
        showUserList.value = true;
        await loadParticipants(activity);
    }
    
    /***** 切换显示已取消用户 *****/
    function toggleCancelledUsers() {
        showCancelled.value = !showCancelled.value;
    }
    
    /***** 活动管理弹窗控制 *****/
    function openActivityModal() {
        // 初始化表单数据
        activityFormData.value = { ...currentActivity.value };
        showActivityModal.value = true;
    }
    
    function closeActivityModal() {
        showActivityModal.value = false;
    }
    
    async function saveActivityData() {
        // 更新currentActivity中的值
        Object.keys(activityDisplayFields).forEach(fieldKey => {
            if (activityFormData.value[fieldKey] !== undefined) {
                currentActivity.value[fieldKey] = activityFormData.value[fieldKey];
            }
        });
        console.log("currentActivity保存活动数据:", currentActivity.value);
        try {
          await updateElement('activity', currentActivity.value._id, currentActivity.value);
          console.log("保存活动数据成功");
        } catch (error) {
          console.error("保存活动数据失败:", error);
        } finally {
          closeActivityModal();
        }
    }
    
    /***** 返回活动列表 *****/
    function backToActivityList() {
        showUserList.value = false;
        currentActivity.value = null;
        ptsList.value = [];
        cancelledList.value = [];
        showCancelled.value = false;
    }


</script>



