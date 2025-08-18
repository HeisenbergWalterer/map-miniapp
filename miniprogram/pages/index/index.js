// index.js
const app = getApp();

Page({
  data: {
    userInfo: {},
    serviceDays: 1,
    isLoggedIn: false, // 登录状态
    welcomeMessage: '请登录以使用完整功能', // 欢迎信息
    noticeText: '【活动预告】微光驿站便民服务活动即将开始，敬请期待！',
    noticeDate: '07-23',
    titlesrc: 'cloud://cloud1-3gbydxui8864f9aa.636c-cloud1-3gbydxui8864f9aa-1369623166/images/title-new.png',
    appCloudImg: 'cloud://cloud1-3gbydxui8864f9aa.636c-cloud1-3gbydxui8864f9aa-1369623166', // 云存储路径
  },

  onLoad() {
    // 设置导航栏样式 - 优化胶囊按钮显示效果
    wx.setNavigationBarColor({
      frontColor: '#ffffff',
      backgroundColor: '#3B82F6', // 更新为蓝色主题
      animation: {
        duration: 300, // 增加过渡动画
        timingFunc: 'easeOut'
      }
    });
    
    // 获取用户信息（异步）
    this.getUserInfo();
  },

  onShow() {
    // 每次显示页面时重新获取用户信息，以防用户在其他页面登录
    console.log('首页onShow - 重新获取用户信息');
    this.getUserInfo();
  },

  // 处理登录点击
  handleLogin() {
    wx.navigateTo({
      url: '/pages/profile/profile' // 跳转到个人中心进行登录
    });
  },

  // 获取用户信息
  async getUserInfo() {
    try {
      // 检查本地存储的用户信息
      const localUserInfo = wx.getStorageSync('userInfo') || {};
      // 兼容不同的openId字段名
      const openId = wx.getStorageSync('openId') || wx.getStorageSync('openid') || localUserInfo.openid || localUserInfo.openId;
      
      console.log('首页获取用户信息 - openId:', openId);
      console.log('首页获取用户信息 - localUserInfo:', localUserInfo);
      
      if (!openId) {
        // 用户未登录
        console.log('用户未登录，显示登录提示');
        this.setData({
          isLoggedIn: false,
          welcomeMessage: '请登录以使用完整功能',
          userInfo: {},
          serviceDays: 0
        });
        return;
      }

      // 如果有本地用户信息，先使用本地信息快速显示
      if (localUserInfo.nickName || localUserInfo.name) {
        console.log('使用本地用户信息');
        this.setData({
          isLoggedIn: true,
          userInfo: localUserInfo
        });
        
        // 使用本地信息计算服务天数
        this.calculateAccurateServiceDays(localUserInfo.createdAt);
        this.generateWelcomeMessage(localUserInfo);
      }

      // 然后尝试从数据库获取最新信息
      const db = wx.cloud.database();
      const userResult = await db.collection('users').where({
        _openid: openId  // 注意：数据库中字段名是 _openid
      }).get();

      console.log('数据库查询结果:', userResult);

      if (userResult.data.length > 0) {
        const userData = userResult.data[0];
        console.log('从数据库获取到用户信息:', userData);
        
        this.setData({
          isLoggedIn: true,
          userInfo: userData
        });
        
        // 计算准确的服务天数
        this.calculateAccurateServiceDays(userData.createdAt);
        
        // 生成欢迎信息
        this.generateWelcomeMessage(userData);
        
        // 更新本地存储，统一使用openId字段名
        const updatedUserInfo = { ...userData, openId: openId };
        wx.setStorageSync('userInfo', updatedUserInfo);
        wx.setStorageSync('openId', openId);
      } else if (!localUserInfo.nickName && !localUserInfo.name) {
        // 数据库中没有用户记录且本地也没有有效信息
        console.log('数据库和本地都没有用户信息');
        this.setData({
          isLoggedIn: false,
          welcomeMessage: '请登录以使用完整功能',
          userInfo: {},
          serviceDays: 0
        });
      }
    } catch (error) {
      console.error('获取用户信息失败:', error);
      
      // 如果网络错误，尝试使用本地缓存的信息
      const localUserInfo = wx.getStorageSync('userInfo') || {};
      const openId = wx.getStorageSync('openId') || wx.getStorageSync('openid') || localUserInfo.openid || localUserInfo.openId;
      
      if (openId && (localUserInfo.nickName || localUserInfo.name)) {
        console.log('网络错误，使用本地缓存信息');
        this.setData({
          isLoggedIn: true,
          userInfo: localUserInfo
        });
        this.calculateAccurateServiceDays(localUserInfo.createdAt);
        this.generateWelcomeMessage(localUserInfo);
      } else {
        this.setData({
          isLoggedIn: false,
          welcomeMessage: '请登录以使用完整功能',
          userInfo: {},
          serviceDays: 0
        });
      }
    }
  },

  // 计算准确的服务天数
  calculateAccurateServiceDays(createdAt) {
    console.log('计算服务天数 - createdAt:', createdAt);
    
    if (!createdAt) {
      console.log('没有创建时间，使用默认1天');
      this.setData({ serviceDays: 1 });
      return;
    }

    const today = new Date();
    let userCreatedDate;
    
    // 处理不同的日期格式
    if (createdAt && createdAt.$date) {
      // 数据库导出格式：{"$date":"2025-08-13T14:25:08.929Z"}
      userCreatedDate = new Date(createdAt.$date);
    } else if (typeof createdAt === 'string') {
      // ISO字符串格式
      userCreatedDate = new Date(createdAt);
    } else {
      // 直接是Date对象
      userCreatedDate = new Date(createdAt);
    }
    
    console.log('解析后的创建日期:', userCreatedDate);
    console.log('今天日期:', today);
    
    const diffTime = Math.abs(today - userCreatedDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    
    console.log('计算得出服务天数:', diffDays);
    
    this.setData({
      serviceDays: diffDays > 0 ? diffDays : 1
    });
  },

  // 生成欢迎信息
  generateWelcomeMessage(userData) {
    const nickname = userData.nickName || userData.name || '用户';
    const serviceDays = this.data.serviceDays;
    
    console.log('生成欢迎信息 - nickname:', nickname);
    console.log('生成欢迎信息 - serviceDays:', serviceDays);
    console.log('生成欢迎信息 - userData:', userData);
    
    this.setData({
      welcomeMessage: `欢迎回来${nickname}，这是微光驿站为您服务的第${serviceDays}天`
    });
    
    // 强制触发页面更新
    console.log('当前页面数据状态:', {
      isLoggedIn: this.data.isLoggedIn,
      userInfo: this.data.userInfo,
      serviceDays: this.data.serviceDays
    });
  },

  // 计算服务天数（保留原方法作为备用）
  calculateServiceDays() {
    const today = new Date();
    const startDate = new Date('2025-01-01'); // 服务开始日期
    const diffTime = Math.abs(today - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    this.setData({
      serviceDays: diffDays
    });
  },

  // 跳转到暖心地图页面（分包）
  goToMap() {
    wx.navigateTo({
      url: '/pages/map/map'
    });
  },

  // 跳转到安新联系页面
  goToContact() {
    wx.navigateTo({
      url: '/pages/contact/contact',
      success: function(res) {
        console.log('跳转到安新联系页面成功');
      },
      fail: function(err) {
        console.error('跳转失败:', err);
      }
    });
  },

  // 跳转到活动预约页面（分包）
  goToActivityReservation() {
    wx.navigateTo({
      url: '/pages/activity-reservation/activity-reservation'
    });
  }
});