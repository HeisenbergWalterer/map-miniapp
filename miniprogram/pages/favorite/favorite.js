// favorite.js
const app = getApp();
const db = app.DBS;

Page({
  data: {
    // 收藏数据
    favorites: [],
    // 原始收藏数据（未筛选）
    allFavorites: [],
    // 当前选中的分类
    selectedCategory: 'all',
    // 是否显示空状态
    showEmpty: true,
    // 是否正在加载
    loading: false,
    // 用户openid
    userOpenid: ''
  },

  onLoad(options) {
    console.log('收藏页面加载')
    this.initPage()
    this.getUserOpenid()
  },

  onReady() {
    console.log('收藏页面初次渲染完成')
  },

  onShow() {
    console.log('收藏页面显示')
    // 每次显示页面时重新加载数据
    this.loadFavorites()
  },

  onHide() {
    console.log('收藏页面隐藏')
  },

  onUnload() {
    console.log('收藏页面卸载')
  },

  // 初始化页面
  initPage() {
    // 设置导航栏样式
    wx.setNavigationBarColor({
      frontColor: '#ffffff',
      backgroundColor: '#FF6B35',
      animation: {
        duration: 300,
        timingFunc: 'easeOut'
      }
    })
  },

  // 获取用户openid
  getUserOpenid() {
    try {
      // 方法1：从userInfo获取
      const userInfo = wx.getStorageSync('userInfo');
      if (userInfo && userInfo.openid) {
        this.setData({
          userOpenid: userInfo.openid
        });
        return;
      }
      
      // 方法2：从其他存储位置获取
      const openId = wx.getStorageSync('openId') || wx.getStorageSync('openid');
      if (openId) {
        this.setData({
          userOpenid: openId
        });
        return;
      }
      
      // 方法3：通过云函数获取
      wx.cloud.callFunction({
        name: 'quickstartFunctions',
        data: {
          type: 'getOpenId'
        }
      }).then(res => {
        const newOpenId = res.result.openid;
        
        // 保存到本地存储
        wx.setStorageSync('openId', newOpenId);
        
        // 更新用户信息
        const currentUserInfo = wx.getStorageSync('userInfo') || {};
        currentUserInfo.openid = newOpenId;
        wx.setStorageSync('userInfo', currentUserInfo);
        
        this.setData({
          userOpenid: newOpenId
        });
      }).catch(err => {
        console.error('云函数获取OpenID失败:', err);
      });
      
    } catch (error) {
      console.error('获取用户openid失败：', error);
    }
  },

  // 加载收藏数据
  async loadFavorites() {
    if (!this.data.userOpenid) {
      this.setData({
        showEmpty: true,
        favorites: []
      });
      return;
    }

    this.setData({ loading: true });

    try {
      // 首先获取基本的收藏记录
      const basicFavorites = await db.getUserFavorites(this.data.userOpenid);
      
      if (!basicFavorites || basicFavorites.length === 0) {
        this.setData({
          favorites: [],
          showEmpty: true,
          loading: false
        });
        return;
      }

      // 使用新方法获取包含完整站点信息的收藏数据
      const favorites = await db.getUserFavoritesWithDetails(this.data.userOpenid);
      
      this.setData({
        allFavorites: favorites || [], // 保存原始数据
        favorites: favorites || [],    // 显示数据
        showEmpty: (favorites || []).length === 0,
        loading: false
      });
    } catch (error) {
      console.error('加载收藏数据失败:', error);
      this.setData({
        favorites: [],
        showEmpty: true,
        loading: false
      });
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
    }
  },

  // 选择分类
  selectCategory(e) {
    const category = e.currentTarget.dataset.category
    this.setData({
      selectedCategory: category
    })
    
    // 根据分类筛选收藏内容
    this.filterFavorites(category)
  },

  // 筛选收藏内容
  filterFavorites(category) {
    if (category === 'all') {
      // 显示所有收藏数据
      this.setData({
        favorites: this.data.allFavorites,
        showEmpty: this.data.allFavorites.length === 0
      });
    } else {
      // 根据类型筛选，从原始数据中筛选
      const filtered = this.data.allFavorites.filter(item => item.station_type === category);
      this.setData({
        favorites: filtered,
        showEmpty: filtered.length === 0
      });
    }
  },

  // 跳转到地图页面
  goToMap() {
    wx.navigateTo({
      url: '../map/map'
    })
  },

  // 取消收藏
  async removeFavorite(e) {
    const itemId = e.currentTarget.dataset.id
    
    wx.showModal({
      title: '确认取消收藏',
      content: '确定要取消收藏这个项目吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await db.removeFavorite(itemId);
            wx.showToast({
              title: '取消收藏成功',
              icon: 'success'
            });
            // 重新加载数据
            this.loadFavorites();
          } catch (error) {
            console.error('取消收藏失败:', error);
            wx.showToast({
              title: '操作失败',
              icon: 'none'
            });
          }
        }
      }
    })
  },

  // 查看收藏详情
  viewFavoriteDetail(e) {
    const item = e.currentTarget.dataset.item
    
    // 构造站点数据
    const stationData = {
      id: item.station_id,
      type: item.station_type,
      name: item.station_name,
      address: item.station_address,
      latitude: item.station_latitude,
      longitude: item.station_longitude,
      photoUrl: item.station_photoUrl,
      serviceTime: item.station_serviceTime,
      serviceContent: item.station_serviceContent
    };
    
    // 将数据编码后传递给详细页面
    const encodedData = encodeURIComponent(JSON.stringify(stationData));
    wx.navigateTo({
      url: `/pages/station-detail/station-detail?stationData=${encodedData}`,
      success: function(res) {
        console.log('跳转到详细页面成功');
      },
      fail: function(err) {
        console.error('跳转失败:', err);
      }
    });
  },

  // 导航到收藏的地点
  navigateToFavorite(e) {
    const item = e.currentTarget.dataset.item;
    
    wx.openLocation({
      latitude: parseFloat(item.station_latitude),
      longitude: parseFloat(item.station_longitude),
      name: item.station_name || '目的地',
      address: item.station_address || '目的地地址',
      scale: 18,
      success: function(data){
        console.log("导航调用成功");
      },
      fail: function(info){
        console.error('导航失败：', info);
      }
    });
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

  // 返回按钮处理
  goBack: function() {
    wx.navigateBack({
      delta: 1
    });
  }

}) 