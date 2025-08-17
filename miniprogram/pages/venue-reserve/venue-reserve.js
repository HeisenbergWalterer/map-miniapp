const app = getApp();
const db = app.DBS;
const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

Page({
  data: {
    venue: '欢乐乒乓',      //场馆名称
    venue_id: '',          //场馆id
    center_id: '',         //中心id
    venueInfo: null,       //完整场馆信息
    today: '',      //今天星期几
    curdate: '',    //今天日期
    optdate: 0,     //选中日期索引
    optslots: [],   //选择时段索引  [(slot_index, date_index).....]
    next7days: [],  //一周星期
    next7dates: [], //一周日期
    booktable: [],  //场馆预约表    0/1 表示是否被预约
    selfbook: [],   //用户预约表
    time_slot: [],  //时间段       从数据库读取预设的时间段
    is_opt: [],     //选择列表     加深显示用户已选择的时间段
    slot_count: 10, //时间段数量   default=10
    opt_count: 0,   //用户选择时段数量

    isLoggedIn: false,
    submitting: false
  },

  onLoad: function(options) {
    // 处理页面参数
    if (options.data) {
      try {
        const venueData = JSON.parse(decodeURIComponent(options.data));
        console.log('接收到的场馆数据:', venueData);
        this.setData({
          venue: venueData.name || '欢乐乒乓',
          venue_id: venueData._id,
          center_id: venueData.center_id,
          venueInfo: {
            name: venueData.name,
            address: venueData.address,
            phone: venueData.phone,
            notes: venueData.notes
          },
          booktable: venueData.booktable
        });
      } catch (e) {
        console.error('解析场馆数据失败:', e);
        this.getVenueData(); // 降级到原有方法
      }
    } else {
      this.getVenueData(); // 没有参数时使用原有方法
    }
    
    this.getslots();
    this.setcurrentdate();
    this.setoptlist();
    this.checkLoginStatus();
  },

  // 检查登录状态
  checkLoginStatus() {
    // 这里应该检查实际的登录状态
    // 暂时模拟为已登录
    const userInfo = wx.getStorageSync('userInfo');
    console.log("userInfo", userInfo);
    if (userInfo.nickName) {
      this.setData({
        isLoggedIn: true
      });
    } else {
      this.setData({
        isLoggedIn: false
      });
    }
  },
  
  // 立即预约
  reserve: async function() {
    if (!this.data.isLoggedIn) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      return;
    }


    this.setData({
      submitting: true
    });
    // 提交前再次同步
    this.getVenueData();
    // 同步后立即检查
    const booktable = this.data.booktable;
    const total = this.data.opt_count;
    const optslots = this.data.optslots;
    const venue_id = this.data.venue_id;
    const userInfo = wx.getStorageSync('userInfo');

    let newbooktable = booktable;
    for(let i = 0; i < total; i++) {
      const [slot_index, date_index] = optslots[i];
      if(booktable[slot_index][date_index] == 0) {
        wx.showToast({
          title: '场地已被预约',
          icon: 'none'
        });

        return;
      }
    console.log("userInfo", userInfo);
    
    const { selectedTimeSlotsMap } = this.data;
    const optdate = this.data.optdate;
    const time_slot = this.data.time_slot;

    // 1、改venue的booktable
    
      newbooktable[slot_index][date_index] = 0;
    }
    console.log("newbooktable", newbooktable);
    db.updateElementByID('venue', venue_id, {booktable: newbooktable});

    // 2、add venue_reservation
    const reg_data = {
      name: userInfo.nickName,
      phone: userInfo.phoneNumber,
      party_size: 1,
      center_id: this.data.center_id,
      venue_id: this.data.venue_id,
      time_reserved: this.data.optslots,
      status: 'reserved'
    }
    console.log("reg info", reg_data);
    db.addElement('venue_reservation', reg_data);
    
    this.setData({
      submitting: false
    });

    wx.showToast({
      title: '预约成功',
      icon: 'success'
    });
    setTimeout(() => {
      wx.navigateBack();
    }, 1000);
  },

  // 去登录
  goToLogin: function() {
    console.log("go to login");
    wx.switchTab({
      url: '/pages/profile/profile'
    });
  },

  // ------------------------------已修改--------------------------------
  // 选择日期
  selectDate(e) {
    const index = e.currentTarget.dataset.index;
    this.setData({ optdate: index });
    this.setoptlist();
  },

  // 选择时段
  selectslot: function(e) {
    const index = e.currentTarget.dataset.index;
    const slot = this.data.time_slot[index];
    const optdate = this.data.optdate;
    console.log("选择时段：", slot);
    const diff = this.getIndexInArray(this.data.optslots, [index, optdate]);
    let optslots = this.data.optslots;
    let is_opt = this.data.is_opt;
    if (diff > -1) {
      optslots.splice(diff, 1);
      is_opt[index] = 0;
    } else {
      optslots.push([index, optdate]);
      is_opt[index] = 1;
    }
    this.setData({
      optslots: optslots,
      is_opt: is_opt,
      opt_count: optslots.length
    });
    console.log("is_opt", this.data.is_opt[index] == 1);
    console.log("is_opt", this.data.is_opt);
    console.log("当前选择时段", index, "   当前选择日期：", optdate);
    console.log("当前存在时段：", this.data.optslots);
  },

  // 获取时间段数组
  getslots: async function() {
    const slots = await db.getCollection('time_slot');
    const formatslot = slots.map(period => (
      `${period.start_time}-${period.end_time}`));
    const slot_count = formatslot.length;
    this.setData({ 
      time_slot: formatslot,
      slot_count: slot_count
    });
  },

  // 设置当前日期
  setcurrentdate: async function() {
    const date = new Date();
    const ty = date.getFullYear();
    const tm = date.getMonth() + 1;
    const td = date.getDate();
    const day = date.getDay();
    // 获取今天日期
    const curdate = `${tm}/${td}`;
    const today = days[day];
    // 获取一周日期
    const next7days = this.getnext7days(day);
    const next7dates = this.getnext7dates(ty, tm, td);
    console.log("当前星期", next7days);
    console.log("当前周", next7dates);
    console.log("当前日期", curdate);
    this.setData({ 
      today: today,
      curdate: curdate,
      next7days: next7days,
      next7dates: next7dates });

  }, 

  // 计算一周星期
  getnext7days : function(td) {
    let next7days = [];
    let d= td;
    for(let i = 0; i < 7; i++) {
      next7days.push(days[d]);
      d++;
      if(d > 6) {
        d = 0;
      }
    }
    return next7days;
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
      next7days.push(`${m}-${d}`);
      d++;
    }
    return next7days;
  },

  // 查找二维数组子元素
  getIndexInArray: function(arr, item) {
    let index = arr.findIndex(subArr => subArr[0] == item[0] && subArr[1] == item[1]);
    return index;
  },

  // 设置选择列表
  setoptlist: function() {
    const is_opt = new Array(this.data.slot_count).fill(0);
    this.setData({
      is_opt: is_opt,
      optslots: [],
      opt_count: 0
    })
  },

  // 获取场馆信息
  getVenueData: async function() {
    const venue = await db.getElementByName('venue', '欢乐乒乓');
    console.log("场馆信息：", venue);
    const venueData = venue.data[0];
    this.setData({ 
      venue_id: venueData._id,
      center_id: venueData.center_id,
      booktable: venueData.booktable,
      venueInfo: {
        name: venueData.name,
        address: venueData.address,
        phone: venueData.phone,
        notes: venueData.notes
      }
    });
    console.log("预约表：", this.data.booktable);
    console.log("场馆详细信息：", this.data.venueInfo);
  },

});
