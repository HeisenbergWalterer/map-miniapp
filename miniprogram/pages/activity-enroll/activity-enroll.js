// pages/activity-enroll/activity-enroll.js
const app = getApp();
const db = app.DBS; // 获取数据库服务类

Page({
  data: {
    activity: null,
    selectedDate: '',
    selectedTimeSlot: '',
    userInfo: null,
    isLoggedIn: false,
    submitting: false // 防止重复提交
  },

  onLoad(options) {
    if (options && options.data) {
      try {
        const activity = JSON.parse(decodeURIComponent(options.data));
        this.setData({
          activity,
          selectedDate: (activity.dates && activity.dates[0]) || '',
          selectedTimeSlot: (activity.timeSlots && activity.timeSlots[0]) || ''
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

  // 报名功能 - 重写为真正的数据库操作
  reserve: async function() {
    const { activity, selectedDate, selectedTimeSlot, userInfo, isLoggedIn, submitting } = this.data;
    
    // 防止重复提交
    if (submitting) {
      return;
    }
    
    // 检查活动数据
    if (!activity) {
      wx.showToast({ title: '活动信息错误', icon: 'none' });
      return;
    }

    // 检查用户登录状态
    if (!isLoggedIn || !userInfo) {
      wx.showModal({
        title: '提示',
        content: '请先登录后再报名活动',
        confirmText: '去登录',
        success: (res) => {
          if (res.confirm) {
            wx.switchTab({
              url: '/pages/profile/profile'
            });
          }
        }
      });
      return;
    }

    // 验证选择的日期和时间段
    const finalDate = (activity.dates && activity.dates.length === 1) ? activity.dates[0] : selectedDate;
    if (activity.dates && activity.dates.length && !finalDate) {
      wx.showToast({ title: '请选择日期', icon: 'none' });
      return;
    }

    const needSlot = activity.timeSlots && activity.timeSlots.length > 0;
    const finalSlot = (activity.timeSlots && activity.timeSlots.length === 1) ? activity.timeSlots[0] : selectedTimeSlot;
    if (needSlot && !finalSlot) {
      wx.showToast({ title: '请选择时间段', icon: 'none' });
      return;
    }

    // 检查余位
    if (activity.remainingSlots <= 0) {
      wx.showToast({ title: '活动名额已满', icon: 'none' });
      return;
    }

    this.setData({ submitting: true });

    try {
      // 获取用户openid（实际项目中需要从登录接口获取）
      const userId = userInfo.openId || `user_${Date.now()}`; // 临时方案

      // 检查用户是否已经报名过这个活动
      const existingRegistration = await db.checkUserRegistration(activity.id, userId);
      
      if (existingRegistration && existingRegistration.length > 0) {
        // 检查是否报名了同样的时间段
        const sameTimeSlot = existingRegistration.find(reg => 
          reg.selectedDate === finalDate && reg.selectedTimeSlot === finalSlot
        );
        
        if (sameTimeSlot) {
          wx.showModal({
            title: '重复报名',
            content: `您已经报名了${finalDate} ${finalSlot}的活动`,
            showCancel: false
          });
          this.setData({ submitting: false });
          return;
        }
      }

      // 构建报名数据
      const registrationData = {
        activityId: activity.id,
        activityTitle: activity.title,
        userId: userId,
        userInfo: {
          nickName: userInfo.nickName || '',
          avatarUrl: userInfo.avatarUrl || '',
          phoneNumber: userInfo.phoneNumber || ''
        },
        selectedDate: finalDate,
        selectedTimeSlot: finalSlot,
      };

      console.log('提交报名数据:', registrationData);

      // 提交报名记录到数据库
      const registrationResult = await db.submitRegistration(registrationData);
      
      console.log('报名提交结果:', registrationResult);

      // 更新活动余位（减1）
      const newRemainingSlots = Math.max(0, activity.remainingSlots - 1);
      await db.updateActivitySlots(activity.id, newRemainingSlots);

      // 更新本地活动数据
      this.setData({
        'activity.remainingSlots': newRemainingSlots,
        'activity.slots': `余位 ${newRemainingSlots}`,
        submitting: false
      });

      // 显示成功提示
      const tip = `${finalDate ? ' ' + finalDate : ''}${finalSlot ? ' ' + finalSlot : ''}`;
      
      wx.showModal({
        title: '报名成功',
        content: `您已成功报名：${activity.title}${tip}`,
        showCancel: false,
        confirmText: '确定',
        success: () => {
          // 返回上一页并刷新数据
          wx.navigateBack({
            success: () => {
              // 通知上一页刷新数据
              const pages = getCurrentPages();
              if (pages.length > 1) {
                const prevPage = pages[pages.length - 2];
                if (prevPage.loadActivitiesFromDB) {
                  prevPage.loadActivitiesFromDB();
                }
              }
            }
          });
        }
      });

    } catch (error) {
      console.error('报名失败:', error);
      
      this.setData({ submitting: false });
      
      wx.showModal({
        title: '报名失败',
        content: error.message || '网络错误，请稍后重试',
        showCancel: false
      });
    }
  },

  // 跳转到登录页面
  goToLogin() {
    wx.switchTab({
      url: '/pages/profile/profile'
    });
  }
});
