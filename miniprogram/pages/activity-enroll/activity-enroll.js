// pages/activity-enroll/activity-enroll.js
// 活动报名详情（入口 A）：展示活动信息并触发报名流程
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
        // 兼容 dates 为字符串/数组
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
        console.log('活动报名页面加载:', activity);
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

  // 报名功能：校验登录与手机号→查重→落库→扣减余位
  reserve: async function() {
    const { activity, selectedDate, selectedTimeSlot, userInfo, isLoggedIn, submitting } = this.data;
    if (submitting) return;
    if (!activity) { wx.showToast({ title: '活动信息错误', icon: 'none' }); return; }
    if (!isLoggedIn || !userInfo) {
      wx.showModal({
        title: '提示', content: '请先登录后再报名活动', confirmText: '去登录',
        success: (res) => { if (res.confirm) wx.switchTab({ url: '/pages/profile/profile' }); }
      });
      return;
    }

    // 兼容字符串/数组的日期字段
    // 不需要选择日期，直接使用首个/字符串
    let finalDate = '';
    if (Array.isArray(activity.dates)) finalDate = activity.dates[0] || '';
    else if (typeof activity.dates === 'string') finalDate = activity.dates;
    const needSlot = activity.timeSlots && activity.timeSlots.length > 0;
    const finalSlot = (activity.timeSlots && activity.timeSlots.length === 1) ? activity.timeSlots[0] : (selectedTimeSlot || '');
    if (needSlot && !finalSlot) { wx.showToast({ title: '请选择时间段', icon: 'none' }); return; }
    if ((activity.remainingSlots || 0) <= 0) { wx.showToast({ title: '活动名额已满', icon: 'none' }); return; }

    this.setData({ submitting: true });
    try {
      // 兼容不同的openId字段名
      const openid = wx.getStorageSync('openId') || wx.getStorageSync('openid') || userInfo.openid || userInfo.openId || userInfo._openid;
      
      console.log('活动报名页获取用户信息 - openid:', openid);
      
      if (!openid) throw new Error('未获取到用户标识');

      // 从 users 读取昵称（手机号不再验证，使用空值）
      const dbc = app.DBS ? app.DBS.getDB() : wx.cloud.database();
      const userRes = await dbc.collection('users').where({ _openid: openid }).get();
      const userDoc = (userRes.data && userRes.data[0]) || {};
      const name = userDoc.nickName || userInfo.nickName || '微信用户';
      const phone = ''; // 不再验证手机号，直接使用空值

      // 重复报名校验
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

      // 扣减余位
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
});
