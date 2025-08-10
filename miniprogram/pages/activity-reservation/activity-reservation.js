// pages/activity-reservation/activity-reservation.js
const app = getApp();

Page({
  data: {
    activeTab: 'venue', // 默认显示场馆预约
    // 场馆预约：仅乒乓球
    venues: [
      {
        id: 101,
        title: '欢乐乒乓（场地）',
        time: '可约时段：9:00-10:00、10:00-11:00、13:00-14:00、14:00-15:00、15:00-16:00、16:00-17:00、17:00-18:00、18:00-19:30',
        place: '方泰邻里中心二楼“泰行啦”体育室',
        slots: '余位 20',
        contact: '021-59962836',
        // 可选：若有图片则在详情页顶部展示；无该字段则不展示
        photoUrl: `${app.img.cloud}/images/stations/pingpong.jpg`
      }
    ],
    // 活动报名：示例
    activities: [
      {
        id: 2,
        title: '棋弈擂台赛（象棋、五子棋）',
        time: '2025-08-04 至 2025-08-10（周一至周日）',
        place: '二楼“泰妙啦” 棋弈空间',
        slots: '余位 30',
        dates: ['2025-08-04','2025-08-05','2025-08-06','2025-08-07','2025-08-08','2025-08-09','2025-08-10'],
        timeSlots: ['09:00-11:00','13:00-16:00','17:00-19:30']
      },
      {
        id: 3,
        title: '夏日“音”姿——八音琴DIY',
        time: '2025-08-05（周二）',
        place: '二楼春舍图书室（社群报名）',
        slots: '余位 20',
        dates: ['2025-08-05'],
        timeSlots: ['09:00-10:00']
      }
    ],
    loadingVenues: false,
    loadingActivities: false
  },

  // 顶部切换
  switchTab(e) {
    const { tab } = e.currentTarget.dataset;
    this.setData({ activeTab: tab });
  },

  // 统一预约处理（后续可改为云函数）
  reserve(e) {
    const { id } = e.currentTarget.dataset;
    const list = this.data.activeTab === 'venue' ? this.data.venues : this.data.activities;
    const item = list.find(a => a.id === id);
    wx.showToast({
      title: item ? `已预约：${item.title}` : '预约成功',
      icon: 'success'
    });
  },

  // 查看活动详情
  goDetail(e) {
    const { id } = e.currentTarget.dataset;
    const item = this.data.activities.find(a => a.id === id);
    if (!item) return;
    const encoded = encodeURIComponent(JSON.stringify(item));
    wx.navigateTo({
      url: `../activity-detail/activity-detail?data=${encoded}`
    });
  },

  // 查看场馆详情
  goVenueDetail(e) {
    const { id } = e.currentTarget.dataset;
    const item = this.data.venues.find(a => a.id === id);
    if (!item) return;
    const encoded = encodeURIComponent(JSON.stringify(item));
    wx.navigateTo({
      url: `../venue-detail/venue-detail?data=${encoded}`
    });
  }
});


