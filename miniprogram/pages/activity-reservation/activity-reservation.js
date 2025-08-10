// pages/activity-reservation/activity-reservation.js
const app = getApp();
const db = app.DBS; // 获取数据库服务类

Page({
  data: {
    activeTab: 'venue', // 默认显示场馆预约
    // 场馆预约：仅乒乓球
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

    // 活动报名：
    activities: [
      {
        id: 2,
        title: '棋弈擂台赛（象棋、五子棋）',
        time: '2025-08-04 至 2025-08-10（周一至周日）',
        place: '二楼"泰妙啦" 棋弈空间',
        slots: '余位 30',
        remainingSlots: 30,
        totalSlots: 30,
        dates: ['2025-08-04','2025-08-05','2025-08-06','2025-08-07','2025-08-08','2025-08-09','2025-08-10'],
        timeSlots: ['09:00-11:00','13:00-16:00','17:00-19:30']
      },
      {
        id: 3,
        title: '夏日"音"姿——八音琴DIY',
        time: '2025-08-05（周二）',
        place: '二楼春舍图书室（社群报名）',
        slots: '余位 20',
        remainingSlots: 20,
        totalSlots: 20,
        dates: ['2025-08-05'],
        timeSlots: ['09:00-10:00']
      },
      {
        id: 4,
        title: '邻里读书会',
        time: '2025-08-06（周三）',
        place: '二楼“泰邻啦”课堂（社群报名）',
        slots: '余位 20',
        remainingSlots: 20,
        totalSlots: 20,
        dates: ['2025-08-06'],
        timeSlots: ['09:00-11:00']
      },
      {
        id: 5,
        title: '国学新悟读书会',
        time: '2025-08-06（周三）',
        place: '二楼“泰邻啦”课堂（社群报名）',
        slots: '余位 20',
        remainingSlots: 20,
        totalSlots: 20,
        dates: ['2025-08-06'],
        timeSlots: ['13:00-16:30']
      },
      {
        id: 6,
        title: '英语口语课堂（A班）',
        time: '2025-08-06（周三）',
        place: '二楼“泰邻啦”课堂（社群报名，费用自理）',
        slots: '余位 20',
        remainingSlots: 20,
        totalSlots: 20,
        dates: ['2025-08-06'],
        timeSlots: ['17:40-18:40']
      },
      {
        id: 7,
        title: '英语口语课堂（B班）',
        time: '2025-08-06（周三）',
        place: '二楼“泰邻啦”课堂（社群报名，费用自理）',
        slots: '余位 20',
        remainingSlots: 20,
        totalSlots: 20,
        dates: ['2025-08-06'],
        timeSlots: ['18:50-19:50']
      },
       {
        id: 8,
        title: '传统艾草薄荷膏制作',
        time: '2025-08-07（周四）',
        place: '二楼春舍图书室（社群报名）',
        slots: '余位 20',
        remainingSlots: 20,
        totalSlots: 20,
        dates: ['2025-08-07'],
        timeSlots: ['13:30-14:30']
      },
      {
        id: 9,
        title: '“泰邻啦”夏日舒展时光——垫上瑜伽',
        time: '2025-08-07（周四）',
        place: '二楼“泰邻啦”课堂',
        slots: '余位 20',
        remainingSlots: 20,
        totalSlots: 20,
        dates: ['2025-08-07'],
        timeSlots: ['18:30-19:30']
      },
      {
        id: 10,
        title: '特色电影观赏：《星愿》',
        time: '2025-08-08（周五）',
        place: '二楼“泰好啦”电影厅',
        slots: '余位 20',
        remainingSlots: 20,
        totalSlots: 20,
        dates: ['2025-08-08'],
        timeSlots: ['13:30-15:30']
      },
      {
        id: 11,
        title: '少儿搏击',
        time: '2025-08-09（周六）',
        place: '二楼“泰邻啦”课堂（社群报名，可免费体验）',
        slots: '余位 20',
        remainingSlots: 20,
        totalSlots: 20,
        dates: ['2025-08-09'],
        timeSlots: ['14:30-16:30']
      },
      {
        id: 12,
        title: '中国象棋&国际象棋',
        time: '2025-08-10（周日）',
        place: '二楼“泰邻啦”课堂（社群报名，可免费体验）',
        slots: '余位 20',
        remainingSlots: 20,
        totalSlots: 20,
        dates: ['2025-08-10'],
        timeSlots: ['09:00-10:30']
      },
      {
        id: 13,
        title: '创意美术（提高课）',
        time: '2025-08-10（周日）',
        place: '二楼春舍图书室（社群报名，可免费体验）',
        slots: '余位 20',
        remainingSlots: 20,
        totalSlots: 20,
        dates: ['2025-08-10'],
        timeSlots: ['09:00-10:30']
      },
      {
        id: 14,
        title: '软笔，硬笔书法课堂',
        time: '2025-08-10（周日）',
        place: '二楼“泰邻啦”课堂（社群报名，可免费体验）',
        slots: '余位 20',
        remainingSlots: 20,
        totalSlots: 20,
        dates: ['2025-08-10'],
        timeSlots: ['10:40-12:10']
      },
      {
        id: 15,
        title: '创意美术（基础课）',
        time: '2025-08-10（周日）',
        place: '二楼春舍图书室（社群报名，可免费体验）',
        slots: '余位 20',
        remainingSlots: 20,
        totalSlots: 20,
        dates: ['2025-08-10'],
        timeSlots: ['10:40-12:10']
      },
      {
        id: 16,
        title: '创意美术',
        time: '2025-08-10（周日）',
        place: '二楼春舍图书室（社群报名，可免费体验）',
        slots: '余位 20',
        remainingSlots: 20,
        totalSlots: 20,
        dates: ['2025-08-10'],
        timeSlots: ['13:30-15:00']
      },
    ],
    loadingVenues: false,
    loadingActivities: false
  },

  onLoad: function() {
    console.log('活动预约页面加载');
    // 页面加载时获取活动数据
    this.loadActivitiesFromDB();
  },

  onShow: function() {
    console.log('活动预约页面显示');
    // 每次显示时刷新活动数据（更新余位）
    if (this.data.activeTab === 'activity') {
      this.loadActivitiesFromDB();
    }
  },

  // 从数据库加载活动数据
  loadActivitiesFromDB: async function() {
    this.setData({ loadingActivities: true });
    
    try {
      // 首先尝试从数据库获取活动数据
      const dbActivities = await db.getActivities();
      
      if (dbActivities && dbActivities.length > 0) {
        // 为每个活动获取报名人数并计算余位
        const activitiesWithSlots = await Promise.all(
          dbActivities.map(async (activity) => {
            try {
              const registrationCount = await db.getActivityRegistrationCount(activity.id);
              const remainingSlots = (activity.totalSlots || activity.remainingSlots || 0) - registrationCount;
              
              return {
                ...activity,
                slots: `余位 ${Math.max(0, remainingSlots)}`,
                remainingSlots: Math.max(0, remainingSlots),
                registrationCount: registrationCount
              };
            } catch (error) {
              console.error(`获取活动${activity.id}报名人数失败:`, error);
              // 如果获取失败，使用原始数据
              return {
                ...activity,
                slots: activity.slots || '余位 0',
                remainingSlots: activity.remainingSlots || 0,
                registrationCount: 0
              };
            }
          })
        );

        this.setData({
          activities: activitiesWithSlots,
          loadingActivities: false
        });
        
        console.log('从数据库加载活动数据成功:', activitiesWithSlots);
      } else {
        console.log('数据库中没有活动数据，使用本地备用数据');
        // 如果数据库中没有数据，使用本地备用数据
        this.setData({ loadingActivities: false });
      }
    } catch (error) {
      console.error('从数据库加载活动数据失败:', error);
      console.log('使用本地备用数据');
      // 如果数据库连接失败，使用本地备用数据
      this.setData({ loadingActivities: false });
    }
  },

  // 顶部切换
  switchTab(e) {
    const { tab } = e.currentTarget.dataset;
    this.setData({ activeTab: tab });
    
    // 切换到活动报名时，刷新数据
    if (tab === 'activity') {
      this.loadActivitiesFromDB();
    }
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
  },

  // 刷新活动数据
  onPullDownRefresh: function() {
    console.log('下拉刷新');
    this.loadActivitiesFromDB().then(() => {
      wx.stopPullDownRefresh();
    });
  }
});


