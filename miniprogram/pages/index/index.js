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
    announcements: [], // 公告数据数组
  },

  async onLoad() {
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
    await this.getUserInfo();
    
    // 获取公告数据
    await this.getAnnouncements();

  },

  onShow() {
    // 每次显示页面时重新获取用户信息，以防用户在其他页面登录
    console.log('首页onShow - 重新获取用户信息');
    this.getUserInfo();
    
    // 重新获取公告数据
    this.getAnnouncements();
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
  },

  // 跳转到暖新公告页面
  goToAnnouncements() {
    wx.navigateTo({
      url: '/pages/announcements/announcements',
      success: function(res) {
        console.log('跳转到暖新公告页面成功');
      },
      fail: function(err) {
        console.error('跳转失败:', err);
      }
    });
  },

  // 打开文本公告详情
  openTextAnnouncement(notice) {
    wx.navigateTo({
      url: `/pages/announcement-detail/announcement-detail?id=${notice._id}&title=${encodeURIComponent(notice.title)}&content=${encodeURIComponent(this.processContent(notice.content))}&type=${notice.type}`,
      success: function(res) {
        console.log('跳转到公告详情页面成功');
      },
      fail: function(err) {
        console.error('跳转失败:', err);
      }
    });
  },

  // 处理内容中的转义字符
  processContent(content) {
    if (!content) return '';
    
    // 处理常见的转义字符
    return content
      .replace(/\\n/g, '\n')        // 将 \\n 转换为 \n
      .replace(/\\t/g, '\t')        // 将 \\t 转换为 \t
      .replace(/\\r/g, '\r')        // 将 \\r 转换为 \r
      .replace(/\\\\/g, '\\');      // 将 \\ 转换为 \
  },

  // 获取公告数据
  async getAnnouncements() {
    try {
      // 使用云函数获取公告数据
      const result = await wx.cloud.callFunction({
        name: 'getAnnouncements',
        data: {
          status: 'active',
          limit: 10
        }
      });
      
      if (result.result.success) {
        console.log('获取公告数据成功:', result.result.data);
        
        // 格式化日期显示
        const formattedAnnouncements = result.result.data.map(item => ({
          ...item,
          created_at: this.formatDate(item.created_at)
        }));
        
        this.setData({
          announcements: formattedAnnouncements
        });
      } else {
        console.error('云函数返回错误:', result.result.error);
        this.setDefaultAnnouncements();
      }
    } catch (error) {
      console.error('获取公告数据失败:', error);
      this.setDefaultAnnouncements();
    }
  },

  // 设置默认公告数据
  setDefaultAnnouncements() {
    this.setData({
      announcements: [{
        _id: 'default_001',
        title: '微光驿站便民服务活动预告',
        type: 'article',
        created_at: '刚刚',
        view_count: 0
      }]
    });
  },

  // 格式化日期显示
  formatDate(dateString) {
    if (!dateString) return '刚刚';
    
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now - date);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) {
        return '今天';
      } else if (diffDays === 1) {
        return '昨天';
      } else if (diffDays < 7) {
        return `${diffDays}天前`;
      } else {
        // 超过7天显示具体日期
        const month = date.getMonth() + 1;
        const day = date.getDate();
        return `${month}-${day}`;
      }
    } catch (error) {
      console.error('日期格式化失败:', error);
      return '刚刚';
    }
  },

  // 处理公告点击事件
  onNoticeTap(e) {
    const notice = e.currentTarget.dataset.notice;
    console.log('点击公告:', notice);
    
    // 根据类型进行不同处理
    if (notice.type === 'article') {
      if (!notice.link) {
        wx.showToast({
          title: '公告链接无效',
          icon: 'error',
          duration: 2000
        });
        return;
      }
      this.openArticle(notice.link);
    } else if (notice.type === 'text') {
      this.openTextAnnouncement(notice);
    } else {
      wx.showToast({
        title: '未知的公告类型',
        icon: 'error',
        duration: 2000
      });
    }
  },

  // 打开公众号文章
  openArticle(link) {
    try {
      // 使用微信官方的API打开公众号文章
      wx.openOfficialAccountArticle({
        url: link,
        success: (res) => {
          console.log('打开公众号文章成功:', res);
        },
        fail: (err) => {
          console.error('打开公众号文章失败:', err);
          // 如果打开失败，尝试复制链接到剪贴板
          this.copyLinkToClipboard(link);
        }
      });
    } catch (error) {
      console.error('打开公众号文章出错:', error);
      // 出错时复制链接到剪贴板
      this.copyLinkToClipboard(link);
    }
  },



  // 复制链接到剪贴板
  copyLinkToClipboard(link) {
    wx.setClipboardData({
      data: link,
      success: () => {
        wx.showModal({
          title: '链接已复制',
          content: '由于无法直接打开链接，已将链接复制到剪贴板。请手动打开浏览器访问。',
          showCancel: false,
          confirmText: '知道了'
        });
      },
      fail: () => {
        wx.showToast({
          title: '复制链接失败',
          icon: 'error',
          duration: 2000
        });
      }
    });
  }
});