// contact-detail.js
Page({
  data: {
    centerInfo: {},
    showDetail: false
  },

  onLoad: function(options) {
    console.log('服务中心详情页面加载');
    
    // 从页面参数中获取服务中心信息
    if (options.centerData) {
      const centerData = JSON.parse(decodeURIComponent(options.centerData));
      console.log('解析后的服务中心数据:', centerData);
      
      this.setData({
        centerInfo: centerData,
        showDetail: true
      });
    } else {
      console.error('未接收到centerData参数');
    }
  },

  // 导航到该服务中心
  navigateToCenter: function() {
    const centerInfo = this.data.centerInfo;
    console.log('导航函数被调用，服务中心信息:', centerInfo);
    
    if (centerInfo.latitude && centerInfo.longitude) {
      const lat = parseFloat(centerInfo.latitude);
      const lng = parseFloat(centerInfo.longitude);
      
      if (isNaN(lat) || isNaN(lng)) {
        console.error('坐标解析失败');
        wx.showToast({
          title: '坐标数据格式错误',
          icon: 'none'
        });
        return;
      }
      
      console.log('开始导航到:', centerInfo.name, '坐标:', lat, lng);
      wx.openLocation({
        latitude: lat,
        longitude: lng,
        name: centerInfo.name || '目的地',
        address: centerInfo.address || '目的地地址',
        scale: 18,
        success: function(data){
          console.log("导航调用成功");
        },
        fail: function(info){
          console.error('导航失败：', info);
          wx.showToast({
            title: '导航失败',
            icon: 'none'
          });
        }
      });
    } else {
      console.error('缺少经纬度信息:', centerInfo);
      wx.showToast({
        title: '暂无位置信息',
        icon: 'none'
      });
    }
  },

  // 拨打电话
  callPhone: function() {
    const centerInfo = this.data.centerInfo;
    if (centerInfo.phone) {
      wx.makePhoneCall({
        phoneNumber: centerInfo.phone,
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
    } else {
      wx.showToast({
        title: '暂无联系电话',
        icon: 'none'
      });
    }
  },

  // 预览照片
  previewPhoto: function() {
    const centerInfo = this.data.centerInfo;
    if (centerInfo.photoUrl) {
      wx.previewImage({
        urls: [centerInfo.photoUrl],
        current: centerInfo.photoUrl,
        success: function() {
          console.log('预览照片成功');
        },
        fail: function(err) {
          console.error('预览照片失败:', err);
        }
      });
    }
  },

  // 返回上一页
  goBack: function() {
    wx.navigateBack({
      delta: 1
    });
  }
});
