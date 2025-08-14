// pages/activity-detail/activity-detail.js
// 活动详情与报名/取消逻辑：
// - 报名入口：从列表进入，显示“立即报名”按钮
// - 记录入口：从“记录”进入会携带 _registrationId，显示“取消预约”按钮
const app = getApp();
const db = app.DBS; // 获取数据库服务类

Page({
  data: {
    activity: null,
    selectedDate: '',
    selectedTimeSlot: '',
    datesList: [],
    hasMultipleDates: false,
    hasSingleDate: false,
    displayDate: '',
    userInfo: null,
    isLoggedIn: false,
    submitting: false // 防止重复提交
  },

  onLoad(options) {
    if (options && options.data) {
      try {
        const activity = JSON.parse(decodeURIComponent(options.data));
        // 若从“记录”进入，可能会携带 _registrationId，用于详情页提供取消功能
        if (activity._registrationId) {
          this.setData({ registrationId: activity._registrationId });
          delete activity._registrationId;
        }
        // 兼容 dates 为字符串/数组，归一为列表
        let datesList = [];
        if (Array.isArray(activity.dates)) {
          datesList = activity.dates;
        } else if (typeof activity.dates === 'string' && activity.dates) {
          datesList = [activity.dates];
        }
        const initialDate = datesList[0] || '';
        this.setData({
          activity,
          selectedDate: initialDate,
          selectedTimeSlot: (activity.timeSlots && activity.timeSlots[0]) || '',
          datesList: datesList,
          hasMultipleDates: datesList.length > 1,
          hasSingleDate: datesList.length === 1,
          displayDate: initialDate
        });
        console.log('活动详情页面加载:', activity);
      } catch (e) {
        console.error('解析活动数据失败', e);
      }
    }
    
    // 检查用户登录状态
    this.checkUserLoginStatus();
  },

  onShow() {
    // 每次显示时检查登录状态
    this.checkUserLoginStatus();
  },

  // 检查用户登录状态
  checkUserLoginStatus() {
    try {
      const userInfo = wx.getStorageSync('userInfo');
      const isLoggedIn = wx.getStorageSync('isLoggedIn');
      
      this.setData({
        userInfo: userInfo || null,
        isLoggedIn: !!isLoggedIn
      });
      
      console.log('用户登录状态:', isLoggedIn, userInfo);
    } catch (error) {
      console.error('检查登录状态失败:', error);
    }
  },

  selectDate(e) {
    const { date } = e.currentTarget.dataset;
    this.setData({ selectedDate: date });
  },

  selectTimeSlot(e) {
    const { slot } = e.currentTarget.dataset;
    this.setData({ selectedTimeSlot: slot });
  },

  // 报名功能：读取 users 昵称与手机号，缺手机号要求完善；查重→落库→扣减余位
  reserve: async function() {
    const { activity, selectedDate, selectedTimeSlot, userInfo, isLoggedIn, submitting } = this.data;
    
    if (submitting) return;
    if (!activity) {
      wx.showToast({ title: '活动信息错误', icon: 'none' });
      return;
    }
    if (!isLoggedIn || !userInfo) {
      wx.showModal({
        title: '提示',
        content: '请先登录后再报名活动',
        confirmText: '去登录',
        success: (res) => { if (res.confirm) wx.switchTab({ url: '/pages/profile/profile' }); }
      });
      return;
    }

    // 计算最终日期/时段（兼容字符串 dates）
    // 不需要选择日期，直接展示
    let finalDate = '';
    if (Array.isArray(activity.dates)) finalDate = activity.dates[0] || '';
    else if (typeof activity.dates === 'string') finalDate = activity.dates;
    const needSlot = activity.timeSlots && activity.timeSlots.length > 0;
    const finalSlot = (activity.timeSlots && activity.timeSlots.length === 1) ? activity.timeSlots[0] : (selectedTimeSlot || '');
    if (needSlot && !finalSlot) {
      wx.showToast({ title: '请选择时间段', icon: 'none' });
      return;
    }
    if (activity.remainingSlots <= 0) {
      wx.showToast({ title: '活动名额已满', icon: 'none' });
      return;
    }

    this.setData({ submitting: true });
    try {
      const openid = userInfo.openid;
      if (!openid) throw new Error('未获取到用户标识');

      // 从 users 表读取最新昵称与手机
      const dbc = app.DBS ? app.DBS.getDB() : wx.cloud.database();
      const userRes = await dbc.collection('users').where({ _openid: openid }).get();
      const userDoc = (userRes.data && userRes.data[0]) || {};
      const name = userDoc.nickName || userInfo.nickName || '微信用户';
      const phone = userDoc.phoneNumber || '';

      if (!phone) {
        this.setData({ submitting: false });
        wx.showModal({
          title: '完善手机号',
          content: '请先在个人资料中补充手机号后再尝试预约',
          confirmText: '去完善',
          success: (res) => { if (res.confirm) wx.navigateTo({ url: '/pages/edit-profile/edit-profile' }); }
        });
        return;
      }

      // 重复报名校验（按 activity._id 优先，其次 id）
      const actIdForReg = activity._id || activity.id;
      const existing = await db.checkActivityRegistration(actIdForReg, openid);
      if (existing && existing.length > 0) {
        this.setData({ submitting: false });
        wx.showModal({ title: '重复报名', content: '您已报名该活动', showCancel: false });
        return;
      }

      // 写入报名记录
      await db.submitActivityRegistration({
        activity_id: actIdForReg,
        center_id: activity.center_id || activity.centerId || '',
        name,
        phone,
        party_size: 1,
        status: 'registered'
      });

      // 减余位
      const newRemaining = Math.max(0, (activity.remainingSlots || 0) - 1);
      await db.updateActivitySlots(activity._id || activity.id, newRemaining);
      this.setData({ 'activity.remainingSlots': newRemaining, submitting: false });

      wx.showModal({
        title: '报名成功',
        content: `您已成功报名：${activity.title}`,
        showCancel: false,
        confirmText: '确定',
        success: () => {
          wx.navigateBack({
            success: () => {
              const pages = getCurrentPages();
              if (pages.length > 1) {
                const prevPage = pages[pages.length - 2];
                if (prevPage.loadDataFromDB) prevPage.loadDataFromDB();
                if (prevPage.loadActivitiesFromDB) prevPage.loadActivitiesFromDB();
              }
            }
          });
        }
      });
    } catch (error) {
      console.error('报名失败:', error);
      this.setData({ submitting: false });
      wx.showModal({ title: '报名失败', content: error.message || '网络错误，请稍后重试', showCancel: false });
    }
  },

  // 跳转到登录页面
  goToLogin() {
    wx.switchTab({
      url: '/pages/profile/profile'
    });
  }
  ,

  // 从详情页取消预约（仅当从记录进入时展示）
  cancelFromDetail: function() {
    const regId = this.data.registrationId;
    const activityId = (this.data.activity && (this.data.activity._id || this.data.activity.id));
    if (!regId || !activityId) return;
    const that = this;
    wx.showModal({
      title: '取消预约',
      content: '确定取消该预约吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await app.DBS.cancelActivityRegistration(regId, activityId);
            wx.showToast({ title: '已取消', icon: 'success' });
            setTimeout(() => { wx.navigateBack(); }, 500);
          } catch (e) {
            wx.showToast({ title: '取消失败', icon: 'none' });
          }
        }
      }
    });
  }
});


