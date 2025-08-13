// pages/activity-reservation/activity-reservation.js
const app = getApp();
const db = app.DBS; // 获取数据库服务类

Page({
  data: {
    activeTab: 'venue', // 默认显示场馆预约
    // 场馆预约：仅乒乓球
    venue: [],
    activity: [],
    venues: [
      {
        id: 101,
        title: '欢乐乒乓（场地）',
        time: '可约时段：9:00-10:00、10:00-11:00、13:00-14:00、14:00-15:00、15:00-16:00、16:00-17:00、17:00-18:00、18:00-19:30',
        place: '方泰邻里中心二楼"泰行啦"体育室',
        slots: '余位 20',
        contact: '021-59962836',
        // 可选：若有图片则在详情页顶部展示；无该字段则不展示
        photoUrl: `${app.img.cloud}/images/stations/pingpong.jpg`
      }
    ],
  },

  onLoad: function() {
    console.log('活动预约页面加载');
  },

  onShow: function() {
    console.log('活动预约页面显示');
    this.loadDataFromDB();
  },
  // 从数据库加载数据
  loadDataFromDB: async function() {
    const tag = this.data.activeTab;
    const data = await db.getCollection(tag);
    this.setData({ [tag]: data });
  },

  // 顶部切换
  switchTab:async function(e) {
    const { tag } = e.currentTarget.dataset;
    this.setData({ activeTab: tag });
    if (this.data[tag].length == 0) {
      await this.loadDataFromDB();
    }
  },

  // 统一预约处理（后续可改为云函数）
  reserve(e) {
    const { id } = e.currentTarget.dataset;
    const list = this.data.activeTab === 'venue' ? this.data.venues : this.data.activity;
    const item = list.find(a => a.id === id);
    wx.showToast({
      title: item ? `已预约：${item.title}` : '预约成功',
      icon: 'success'
    });
  },

  // 查看活动详情
  goDetail(e) {
    const { id } = e.currentTarget.dataset;
    const item = this.data.activity.find(a => a.id === id);
    if (!item) return;
    
    // 检查余位
    if (item.remainingSlots <= 0) {
      wx.showToast({
        title: '活动名额已满',
        icon: 'none'
      });
      return;
    }
    
    const encoded = encodeURIComponent(JSON.stringify(item));
    wx.navigateTo({
      url: `../activity-enroll/activity-enroll?data=${encoded}`
    });
  },

  // 查看场馆详情
  goVenueDetail(e) {
    const { id } = e.currentTarget.dataset;
    const item = this.data.venues.find(a => a.id === id);
    if (!item) return;
    const encoded = encodeURIComponent(JSON.stringify(item));
    wx.navigateTo({
      url: `../venue-reserve/venue-reserve?data=${encoded}`
    });
  },

  // 刷新活动数据
  onPullDownRefresh: function() {
    console.log('下拉刷新');
    this.loadActivitiesFromDB().then(() => {
      wx.stopPullDownRefresh();
    });
  }
});


