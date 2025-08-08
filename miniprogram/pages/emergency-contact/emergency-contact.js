// emergency-contact.js
const app = getApp();
const db = app.DBS;

Page({
  data: {
    emergencyContacts: [],
    loading: true
  },

  onLoad: function(options) {
    console.log('紧急联系页面加载');
    this.loadEmergencyContacts();
  },

  onShow: function() {
    console.log('紧急联系页面显示');
  },

  // 加载紧急联系数据
  loadEmergencyContacts: async function() {
    try {
      const contacts = await db.findServStations('emergency');
      this.setData({
        emergencyContacts: contacts || [],
        loading: false
      });
    } catch (error) {
      console.error('加载紧急联系数据失败:', error);
      this.setData({
        loading: false
      });
      wx.showToast({
        title: '加载数据失败',
        icon: 'none'
      });
    }
  },

  // 拨打电话
  callPhone: function(e) {
    const phone = e.currentTarget.dataset.phone;
    const name = e.currentTarget.dataset.name;
    
    if (phone) {
      wx.showModal({
        title: '确认拨打电话',
        content: `是否拨打${name}的电话：${phone}？`,
        success: function(res) {
          if (res.confirm) {
            wx.makePhoneCall({
              phoneNumber: phone,
              success: function() {
                console.log('拨打电话成功');
              },
              fail: function(err) {
                console.error('拨打电话失败:', err);
                wx.showToast({
                  title: '拨打电话失败',
                  icon: 'none'
                });
              }
            });
          }
        }
      });
    } else {
      wx.showToast({
        title: '暂无联系电话',
        icon: 'none'
      });
    }
  },


});
