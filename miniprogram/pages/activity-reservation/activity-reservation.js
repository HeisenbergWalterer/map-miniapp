// pages/activity-reservation/activity-reservation.js
// 活动预约主入口：顶部切换“场馆/活动”，底部导航“活动/订单（记录）”
// - 活动：展示可报名活动列表，整卡进入详情页
// - 订单：展示当前用户报名记录，整卡进入详情（可取消）
const app = getApp();
const db = app.DBS; // 获取数据库服务类

Page({
  data: {
    activeTab: 'venue', // 顶部：场馆/活动
    activeTab2: 'list', // 底部：活动/记录
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
    if (this.data.activeTab2 === 'records') {
      this.loadMyRecords();
    }
  },
  
  // 从数据库加载数据
  loadDataFromDB: async function() {
    const tag = this.data.activeTab;
    const data = await db.getCollection(tag);
    this.setData({ [tag]: data });
  },

  // 底部切换 活动/记录
  switchTab2: async function(e) {
    const { tag } = e.currentTarget.dataset;
    this.setData({ activeTab2: tag });
    if (tag === 'records') {
      await this.loadMyRecords();
    }
  },

  // 加载我的活动报名记录：查询报名，再批量拉取活动详情进行拼接
  loadMyRecords: async function() {
    try {
      const userInfo = wx.getStorageSync('userInfo') || {};
      const openid = userInfo.openid;
      if (!openid) {
        wx.showToast({ title: '请先登录', icon: 'none' });
        this.setData({ myRecords: [] });
        return;
      }
      const list = await db.getMyActivityRegistrations(openid);
      const ids = (list || []).map(r => r.activity_id).filter(Boolean);
      const acts = await db.getActivitiesByIds(ids);
      // 建立映射 _id -> 活动信息
      const map = {};
      acts.forEach(a => { map[a._id] = a; });
      // 合并显示字段
      const merged = (list || []).map(r => ({
        ...r,
        _activity: map[r.activity_id] || null
      }));
      this.setData({ myRecords: merged });
    } catch (e) {
      console.error('加载我的报名记录失败:', e);
      this.setData({ myRecords: [] });
    }
  },

  // 查看报名记录详情
  openRecordDetail: function(e) {
    const item = e.currentTarget.dataset.item;
    if (!item) return;
    const act = item._activity;
    if (!act) {
      wx.showToast({ title: '未找到活动信息', icon: 'none' });
      return;
    }
    const encoded = encodeURIComponent(JSON.stringify({ ...act, _registrationId: item._id }));
    wx.navigateTo({ url: `../activity-detail/activity-detail?data=${encoded}` });
  },

  // 取消报名（记录列表内）
  cancelRecord: async function(e) {
    const { id, activityId } = e.currentTarget.dataset; // id 为报名记录 _id，activityId 为活动 _id
    const that = this;
    wx.showModal({
      title: '取消报名',
      content: '确定取消该报名吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await db.cancelActivityRegistration(id, activityId);
            wx.showToast({ title: '已取消', icon: 'success' });
            that.loadMyRecords();
          } catch (err) {
            console.error('取消报名失败:', err);
            wx.showToast({ title: '取消失败', icon: 'none' });
          }
        }
      }
    });
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
    const { id, _id } = e.currentTarget.dataset;
    const list = this.data.activeTab === 'venue' ? this.data.venues : this.data.activity;
    const item = (_id && list.find(a => a._id === _id)) || list.find(a => String(a.id) === String(id));
    wx.showToast({
      title: item ? `已预约：${item.title}` : '预约成功',
      icon: 'success'
    });
  },

  // 查看活动详情
  goDetail(e) {
    const { _id, id } = e.currentTarget.dataset;
    const item = (_id && this.data.activity.find(a => a._id === _id)) || this.data.activity.find(a => String(a.id) === String(id));
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
    wx.navigateTo({ url: `../activity-enroll/activity-enroll?data=${encoded}` });
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
    this.loadDataFromDB().then(() => { wx.stopPullDownRefresh(); });
  }
});


