// contact.js
const app = getApp();
const db = app.DBS;

Page({
  data: {
    serviceCenters: [], // 居委会和服务中心列表
    emergencyContacts: [], // 紧急联系列表
    loading: true
  },

  onLoad: function(options) {
    console.log('安新联系页面加载');
    this.loadServiceCenters();
    this.loadEmergencyContacts();
  },

  onShow: function() {
    console.log('安新联系页面显示');
  },

  // 加载居委会和服务中心数据
  loadServiceCenters: async function() {
    try {
      const centers = await db.findServStations('contact');
      console.log('加载的服务中心数据:', centers);
      this.setData({
        serviceCenters: centers || []
      });
    } catch (error) {
      console.error('加载服务中心数据失败:', error);
      wx.showToast({
        title: '加载数据失败',
        icon: 'none'
      });
    }
  },

  // 加载紧急联系数据
  loadEmergencyContacts: async function() {
    try {
      const contacts = await db.findServStations('emergency');
      console.log('加载的紧急联系数据:', contacts);
      this.setData({
        emergencyContacts: contacts || [],
        loading: false
      });
    } catch (error) {
      console.error('加载紧急联系数据失败:', error);
      this.setData({
        loading: false
      });
    }
  },

  // 点击服务中心卡片
  onServiceCenterTap: function(e) {
    const center = e.currentTarget.dataset.center;
    if (center) {
      const centerData = encodeURIComponent(JSON.stringify(center));
      wx.navigateTo({
        url: `/pages/contact-detail/contact-detail?centerData=${centerData}`,
        success: function(res) {
          console.log('跳转到服务中心详情页面成功');
        },
        fail: function(err) {
          console.error('跳转失败:', err);
        }
      });
    }
  },

  // 点击紧急联系卡片
  onEmergencyContactTap: function() {
    wx.navigateTo({
      url: '/pages/emergency-contact/emergency-contact',
      success: function(res) {
        console.log('跳转到紧急联系页面成功');
      },
      fail: function(err) {
        console.error('跳转失败:', err);
      }
    });
  },


});
