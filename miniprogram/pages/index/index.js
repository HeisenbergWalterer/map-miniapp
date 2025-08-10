// index.js
const app = getApp();

Page({
  data: {
    userInfo: {},
    serviceDays: 1,
    noticeText: '【活动预告】微光驿站便民服务活动即将开始，敬请期待！',
    noticeDate: '07-23',
    titlesrc: `${app.img.cloud}/images/title.jpg`,
  },

  onLoad() {
    // 设置导航栏样式 - 优化胶囊按钮显示效果
    wx.setNavigationBarColor({
      frontColor: '#ffffff',
      backgroundColor: '#FF8E66', // 使用中间渐变色，让胶囊按钮更融合
      animation: {
        duration: 300, // 增加过渡动画
        timingFunc: 'easeOut'
      }
    });
    
    // 获取用户信息
    this.getUserInfo();
    // 计算服务天数
    this.calculateServiceDays();
  },

  // 获取用户信息
  getUserInfo() {
    const userInfo = wx.getStorageSync('userInfo') || {};
    this.setData({
      userInfo: userInfo
    });
  },

  // 计算服务天数
  calculateServiceDays() {
    const today = new Date();
    const startDate = new Date('2025-01-01'); // 服务开始日期
    const diffTime = Math.abs(today - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    this.setData({
      serviceDays: diffDays
    });
  },

  // 跳转到暖心地图页面（分包）
  goToMap() {
    wx.navigateTo({
      url: '/pages/map/map'
    });
  },

  // 跳转到安新联系页面
  goToContact() {
    wx.navigateTo({
      url: '/pages/contact/contact',
      success: function(res) {
        console.log('跳转到安新联系页面成功');
      },
      fail: function(err) {
        console.error('跳转失败:', err);
      }
    });
  },

  // 跳转到活动预约页面（分包）
  goToActivityReservation() {
    wx.navigateTo({
      url: '/pages/activity-reservation/activity-reservation'
    });
  }
});