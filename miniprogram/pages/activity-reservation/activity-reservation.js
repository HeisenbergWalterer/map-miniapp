// pages/activity-reservation/activity-reservation.js
// 活动预约主入口：顶部切换“场馆/活动”，底部导航“活动/订单（记录）”
// - 活动：展示可报名活动列表，整卡进入详情页
// - 订单：展示当前用户报名记录，整卡进入详情（可取消）
const app = getApp();
const db = app.DBS; // 获取数据库服务类
const time = app.time; // 获取时间信息

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
    // 日期和时间
    base_date: '',    // 基准日期
    base_day: '',     // 基准星期
    curdate: '',      // 当前日期
    curday: '',       // 当前星期
    timeslots: [],    // 时间段
    next7dates: [],   // 基准7天日期
  },

  onLoad: async function() {
    console.log('活动预约页面加载');
    await this.setslots();    // 设置基准日期和时间
  },

  onShow: function() {
    console.log('活动预约页面显示');
    this.loadDataFromDB();
    if (this.data.activeTab2 === 'records') {
      this.loadAllMyRecords();
    }
  },
  
  // 从数据库加载数据
  loadDataFromDB: async function() {
    const tag = this.data.activeTab;
    const data = await db.getCollection(tag);
    this.setData({ [tag]: data });
  },

  // ----------------------已修改--------------------------

  // 设置日期和时间
  setslots: async function() {
    const slots = await db.getCollection('time_slot');
    // 按照 id 排序时间段信息
    slots.sort((a, b) => a.id - b.id);
    // 格式化时间段数组
    const formatslot = slots.filter(slot => slot.id && slot.id > 0).map(period => (
      `${period.start_time}-${period.end_time}`));
    
    const base_date = slots[0].date;
    const [ cy, cm, cd ] = base_date.split('-');
    console.log("解析后的基准日期", cy, cm, cd)
    const next7dates = this.getnext7dates(cy, cm, cd);
    console.log("解析后的7天日期", next7dates)
    // 设置基准时间和时间段数组
    this.setData({
      timeslots: formatslot,
      next7dates: next7dates
    });
  },

  // 加载场馆预约记录
  loadVenueRes: async function (openid) {
    const that = this;
    console.log("loadVenueRes_用户信息：", openid);
    const res = await db.queryElement('venue_reservation', {_openid: openid});
    console.log("loadVenueRes_场馆预约记录：", res);

    const reslist = res.data.map(record => {
      // 解包需要处理的字段
      const { venue_id, status, time_reserved } = record;

      // 解析status字段
      const status_text = (status === 'reserved' ? '已预约' : '已取消');

      // 解析place字段
      const place = that.data.venue.find(item => item._id === venue_id).address;
      const name = that.data.venue.find(item => item._id === venue_id).name;

      // 解析time字段
      const time = time_reserved.map(item =>{
        const [ slotnum, datenum ] = item;
        // slot解析
        const slot = that.data.timeslots[slotnum];
        // date解析
        const date = that.data.next7dates[datenum];        

        return `${date} ${slot}`;
      });
      return {
        ...record,
        time: time,
        place: place,
        status_text: status_text,
        venue_name: name
      }
    })
    console.log("解析后的预约列表reslist：", reslist);
    return reslist;


  },

  // 计算一周日期
  getnext7dates : function(cy, cm, cd) {
    let next7days = [];
    let dm;
    let y=cy;
    let m=cm;
    let d=cd;
    switch(m) {
      case 1:
      case 3:
      case 5:
      case 7:
      case 8:
      case 10:
      case 12:
        dm = 31;
        break;
      case 4:
      case 6:
      case 9:
      case 11:
        dm = 30;
        break;
      case 2:
        dm = ((ty % 4 == 0 && ty % 100 != 0 || ty % 400 == 0) ? 29 : 28);
        break;
      default:
        break;
    }
    for(let i = 0; i < 7; i++) {
      if(d > dm) {
        d -= dm;
        m++;
      }
      if(m > 12) {
        m = 1;
        y = ty + 1;
      }
      next7days.push(`${m}/${d}`);
      d++;
    }
    return next7days;
  },

  // -----------------------------------------------------
  // -----------------------------------------------------
  // -----------------------------------------------------

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
      const userInfo = await wx.getStorageSync('userInfo');
      // 兼容不同的openId字段名
      const openid = userInfo._openid;

      console.log('记录页面获取用户信息 - openid:', openid);
      console.log('记录页面获取用户信息 - userInfo:', userInfo);
      
      if (!openid) {
        wx.showToast({ title: '请先登录', icon: 'none' });
        this.setData({ myRecords: [], myVenueRecords: [], filteredRecords: [] });
        return;
      }

      await this.loadVenueRes(openid);

      // 并发获取活动报名记录和场馆预约记录
      const [activityRecords, venueReservations] = await Promise.all([
        this.loadActivityRecords(openid),
        this.loadVenueRes(openid)
      ]);

      console.log("场馆预约记录内容格式：", venueReservations)

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


