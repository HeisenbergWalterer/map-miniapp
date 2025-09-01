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
    recordFilter: 'all', // 记录筛选：all全部/activity活动/venue场馆
    // 场馆预约和活动数据
    venue: [],
    activity: [],
    myRecords: [], // 活动报名记录
    myVenueRecords: [], // 场馆预约记录
    filteredRecords: [], // 筛选后的记录
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
      await this.loadAllMyRecords();
    }
  },

  // 记录筛选切换
  switchRecordFilter: function(e) {
    const { filter } = e.currentTarget.dataset;
    this.setData({ recordFilter: filter });
    this.filterRecords();
  },

  // 筛选记录
  filterRecords: function() {
    const { recordFilter, myRecords, myVenueRecords } = this.data;
    let filteredRecords = [];
    
    switch (recordFilter) {
      case 'activity':
        filteredRecords = myRecords.map(record => ({ ...record, type: 'activity' }));
        break;
      case 'venue':
        filteredRecords = myVenueRecords.map(record => ({ ...record, type: 'venue' }));
        break;
      case 'all':
      default:
        filteredRecords = [
          ...myRecords.map(record => ({ ...record, type: 'activity' })),
          ...myVenueRecords.map(record => ({ ...record, type: 'venue' }))
        ];
        // 按创建时间排序
        filteredRecords.sort((a, b) => {
          const timeA = a._createTime || a.createdAt || 0;
          const timeB = b._createTime || b.createdAt || 0;
          return new Date(timeB) - new Date(timeA);
        });
        break;
    }
    
    this.setData({ filteredRecords });
  },

  // 加载所有记录（活动+场馆）
  loadAllMyRecords: async function() {
    try {
      const userInfo = wx.getStorageSync('userInfo') || {};
      // 兼容不同的openId字段名
      const openid = wx.getStorageSync('openId') || wx.getStorageSync('openid') || userInfo.openid || userInfo.openId || userInfo._openid;
      
      console.log('记录页面获取用户信息 - openid:', openid);
      console.log('记录页面获取用户信息 - userInfo:', userInfo);
      
      if (!openid) {
        wx.showToast({ title: '请先登录', icon: 'none' });
        this.setData({ myRecords: [], myVenueRecords: [], filteredRecords: [] });
        return;
      }

      // 并发获取活动报名记录和场馆预约记录
      const [activityRecords, venueReservations] = await Promise.all([
        this.loadActivityRecords(openid),
        this.loadVenueRecords(openid)
      ]);

      this.setData({ 
        myRecords: activityRecords,
        myVenueRecords: venueReservations 
      });
      
      this.filterRecords();
    } catch (e) {
      console.error('加载记录失败:', e);
      this.setData({ myRecords: [], myVenueRecords: [], filteredRecords: [] });
    }
  },

  // 加载活动报名记录
  loadActivityRecords: async function(openid) {
    try {
      const list = await db.getMyActivityRegistrations(openid);
      const ids = (list || []).map(r => r.activity_id).filter(Boolean);
      const acts = await db.getActivitiesByIds(ids);
      // 建立映射 _id -> 活动信息
      const map = {};
      acts.forEach(a => { map[a._id] = a; });
      // 合并显示字段
      return (list || []).map(r => ({
        ...r,
        _activity: map[r.activity_id] || null
      }));
    } catch (e) {
      console.error('加载活动报名记录失败:', e);
      return [];
    }
  },

  // 加载场馆预约记录
  loadVenueRecords: async function(openid) {
    try {
      const list = await db.getMyVenueReservations(openid);
      const venueIds = (list || []).map(r => r.venue_id).filter(Boolean);
      const venues = await db.getVenuesByIds(venueIds);
      const timeSlots = await db.getTimeSlots();
      
      // 建立映射 _id -> 场馆信息
      const venueMap = {};
      venues.forEach(v => { venueMap[v._id] = v; });
      
      // 建立时间段映射 index -> 时间段
      const timeSlotMap = {};
      timeSlots.forEach((slot, index) => {
        timeSlotMap[index] = `${slot.start_time}-${slot.end_time}`;
      });
      
      // 合并显示字段并格式化预约时间
      return (list || []).map(r => {
        const venue = venueMap[r.venue_id];
        let formattedTimeSlots = '';
        if (r.time_reserved && Array.isArray(r.time_reserved)) {
          const timeStrings = r.time_reserved.map(([slotIndex, dateIndex]) => {
            const timeSlot = timeSlotMap[slotIndex] || `时段${slotIndex}`;
            // 计算具体日期（假设dateIndex是从预约时间开始的天数偏移）
            const baseDate = r._createTime ? new Date(r._createTime) : new Date();
            const targetDate = new Date(baseDate.getTime() + dateIndex * 24 * 60 * 60 * 1000);
            const dateStr = `${targetDate.getMonth() + 1}/${targetDate.getDate()}`;
            return `${dateStr} ${timeSlot}`;
          });
          formattedTimeSlots = timeStrings.join(', ');
        }
        
        return {
          ...r,
          _venue: venue,
          _formattedTime: formattedTimeSlots || '时间待确认'
        };
      });
    } catch (e) {
      console.error('加载场馆预约记录失败:', e);
      return [];
    }
  },

  // 兼容旧的方法名（避免其他地方调用出错）
  loadMyRecords: async function() {
    await this.loadAllMyRecords();
  },

  // 查看记录详情（根据类型跳转）
  openRecordDetail: function(e) {
    const item = e.currentTarget.dataset.item;
    if (!item) return;
    
    if (item.type === 'activity') {
      // 活动报名记录
      const act = item._activity;
      if (!act) {
        wx.showToast({ title: '未找到活动信息', icon: 'none' });
        return;
      }
      const encoded = encodeURIComponent(JSON.stringify({ ...act, _registrationId: item._id }));
      wx.navigateTo({ url: `../activity-detail/activity-detail?data=${encoded}` });
    } else if (item.type === 'venue') {
      // 场馆预约记录，可以跳转到场馆详情或显示预约详情
      wx.showModal({
        title: '预约详情',
        content: `场馆：${item._venue ? item._venue.name : '未知场馆'}\n时间：${item._formattedTime}\n状态：${item.status === 'reserved' ? '已预约' : '已取消'}`,
        showCancel: true,
        cancelText: '返回',
        confirmText: item.status === 'reserved' ? '取消预约' : '确定',
        success: (res) => {
          if (res.confirm && item.status === 'reserved') {
            this.cancelVenueRecord(item._id);
          }
        }
      });
    }
  },

  // 取消活动报名（记录列表内）
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
            that.loadAllMyRecords();
          } catch (err) {
            console.error('取消报名失败:', err);
            wx.showToast({ title: '取消失败', icon: 'none' });
          }
        }
      }
    });
  },

  // 取消场馆预约
  cancelVenueRecord: async function(reservationId) {
    const that = this;
    try {
      await db.cancelVenueReservation(reservationId);
      wx.showToast({ title: '预约已取消', icon: 'success' });
      that.loadAllMyRecords();
    } catch (err) {
      console.error('取消场馆预约失败:', err);
      wx.showToast({ title: '取消失败', icon: 'none' });
    }
  },

  // 顶部切换
  switchTab:async function(e) {
    const { tag } = e.currentTarget.dataset;
    this.setData({ activeTab: tag });
    if (this.data[tag].length == 0) {
      await this.loadDataFromDB();
    }
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
    const { id, _id } = e.currentTarget.dataset;
    console.log('查看场馆详情:', e.currentTarget.dataset);
    const item =  { _id: _id };   //只传入venue的唯一id
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


