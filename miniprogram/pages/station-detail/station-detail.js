// station-detail.js
Page({
  data: {
    stationInfo: {},
    showDetail: false
  },

  onLoad: function(options) {
    console.log('接收到的参数:', options);
    
    // 从页面参数中获取站点信息
    if (options.stationData) {
      const stationData = JSON.parse(decodeURIComponent(options.stationData));
      
      // 添加类型名称
      stationData.typeName = this.getTypeName(stationData.type);
      
      this.setData({
        stationInfo: stationData,
        showDetail: true
      });
    }
  },

  // 获取类型名称
  getTypeName: function(type) {
    const typeMap = {
      'toilet': '公共厕所',
      'warm': '暖心服务站',
      'sinopec': '爱心驿站',
      'partner': '合作商户',
      'relay': '接力站'
    };
    return typeMap[type] || '未知类型';
  },

  // 导航到该站点
  navigateToStation: function() {
    const stationInfo = this.data.stationInfo;
    if (stationInfo.latitude && stationInfo.longitude) {
      wx.openLocation({
        latitude: parseFloat(stationInfo.latitude),
        longitude: parseFloat(stationInfo.longitude),
        name: stationInfo.name || '目的地',
        address: stationInfo.address || '目的地地址',
        scale: 18,
        success: function(data){
          console.log("导航调用成功");
        },
        fail: function(info){
          console.error('导航失败：', info);
        }
      });
    }
  },

  // 返回地图页面
  goBack: function() {
    wx.navigateBack({
      delta: 1
    });
  }
}); 