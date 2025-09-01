// 引入高德地图API
var gaode_key = require('../../components/config')
// 引入高德地图SDK
var amapFile = require('../../components/amap-wx.130')
// 获取app实例
const app = getApp();
// 获取数据库服务类
const db = app.DBS; 
// 创建一个高德地图实例
var myAmap = new amapFile.AMapWX({
  key: gaode_key.Config.key
})
// 记录当前标记的点位数据
var markersData = []
// 测试用的地址
const test_word = "上海市嘉定区百安公路528号"
// 搜索建议的最大数量
const MAX_TIPS = 8;

// 页面定义
Page({
  data: {
    currentType: "",  //初始无类型
    markers: [],
    latitude: '',     //当前位置纬度
    longitude: '',    //当前位置经度
    showTypeSelector: false, // 控制筛选器显示
    city: '',         //当前位置
    city_e: '',       //目的地
    latitude_e: '',   //目的地纬度
    longitude_e: '',  //目的地经度
    textData:{},      //地点描述信息
    gaode_type: 'car',//默认驾车导航，后续可改为步行或者公交
    polyline: [],
    includePoints: [],
    transits: [],   //公交车信息
    mapEndObj: {},  //目的地信息
    cost: '',       //打车费用
    distance: '',   //导航总距离
    daohang: false, //是否开始导航
    mapState: true, //目的地搜索状态
    searchKeyword: '',      //搜索关键词
    showSuggestions: false, //是否显示搜索建议
    searchSuggestions: [],  //搜索建议列表
    searchTimer: null,      //搜索防抖定时器
    isFavorited: false,     //是否已收藏
    currentStationId: '',   //当前选中的站点ID
    userOpenid: '',         //用户openid
  },

  // 切换筛选器显示
  toggleTypeSelector: function() {
    this.setData({
      showTypeSelector: !this.data.showTypeSelector
    });
  },

  // 页面加载时获取当前位置
  onLoad: function(){
    this.getPoiData() //获取当前位置
  },

  // 页面初次渲染完成
  onReady: function(){
    console.log('地图页面初次渲染完成')
    wx.cloud.callFunction({
      name: "getContext",
      success: function(res){
        console.log("获取上下文成功:", res);
      },
      fail: function(res){
        console.log("获取上下文失败:", res);
      }
    });
  },

  // 页面显示时
  onShow: function(){
    console.log('地图页面显示')
    this.clearInput(); // 清空输入框
    this.setData({
      currentType: this.data.currentType || "toilet",    // 默认显示公共厕所
      showTypeSelector: false,  // 隐藏分类选择器
    })
    this.showServiceStations(); // 显示服务站点
    // this.getUserOpenid(); // 获取用户openid
    this.getOpenID(); // 获取用户openid
  },

  // 页面隐藏时
  onHide: function(){
    console.log('地图页面隐藏')
  },

  // 页面卸载时
  onUnload: function(){
    console.log('地图页面卸载')
  },

  // 搜索输入
  inputSearch: function(e) {
    const keyword = e.detail.value;
    this.setData({
      searchKeyword: keyword
    });
    
    // 防抖处理，避免频繁请求
    if (this.data.searchTimer) {
      clearTimeout(this.data.searchTimer);
    }
    
    if (keyword.trim()) {
      this.setData({
        searchTimer: setTimeout(() => {
          this.getSearchSuggestions(keyword);
        }, 500) // 500ms后执行搜索
      });
    } else {
      this.setData({
        showSuggestions: false,
        searchSuggestions: []
      });
    }
  },

  // 获取搜索建议
  getSearchSuggestions: function(keyword) {
    const that = this;

    // 使用高德地图的输入提示API
    myAmap.getInputtips({
      keywords: keyword,
      location: `${this.data.longitude},${this.data.latitude}`, // 当前位置
      city: this.data.city || '', // 当前城市
      success: function(data) {
        console.log('搜索建议结果:', data);
        if (data && data.tips) {
          that.setData({
            searchSuggestions: data.tips.slice(0, MAX_TIPS), // 最多显示8个建议
            showSuggestions: true
          });
        }
      },
      fail: function(error) {
        console.error('获取搜索建议失败:', error);
      }
    });
  },

  // 搜索框获得焦点
  onSearchFocus: function() {
    if (this.data.searchSuggestions.length > 0) {
      this.setData({
        showSuggestions: true
      });
    }
  },

  // 搜索框失去焦点（延迟隐藏，确保点击建议项有效）
  onSearchBlur: function() {
    setTimeout(() => {
      this.setData({
        showSuggestions: false
      });
    }, 200);
  },

  // 选择搜索建议
  selectSuggestion: function(e) {
    const suggestion = e.currentTarget.dataset.suggestion;
    console.log('选中的建议:', suggestion);
    this.clearInfo(); // 清空之前的信息显示
    // 根据选中的建议进行搜索
    if (suggestion.location.length > 0) {
      // 如果有具体坐标，直接定位
      const location = suggestion.location.split(',');
      this.searchByLocation(parseFloat(location[0]), parseFloat(location[1]), suggestion.name);
      // 显示选中的建议地点
      this.setData({
        latitude_e: parseFloat(location[1]),
        longitude_e: parseFloat(location[0]),
        searchKeyword: suggestion.name,
        showSuggestions: false,
        textData: {
          name: suggestion.name, 
          desc: suggestion.address || '详细地址信息'
        }
      });
    } else {
      // 否则显示建议的所有地点
      console.log("建议数据：", this.data.searchSuggestions);
      this.searchBySuggestion();
    }
    this.clearInput(); // 清空输入框
  },

  // 根据建议搜索
  searchBySuggestion: function() {
    markersData = this.data.searchSuggestions.slice(1, MAX_TIPS);
    var count = 0;
    markersData = markersData.map(item => ({
      ...item,
      id : count++,
      longitude: item.location.split(',')[0],
      latitude: item.location.split(',')[1],
    }))
    this.showMarker(markersData);
    this.clearInput(); // 清空输入框
  },

  // 根据坐标搜索
  searchByLocation: function(lng, lat, name) {
    const that = this;
    // 用坐标进行逆地理编码搜索
    myAmap.getRegeo({
      location: `${lng},${lat}`,
      success: function(data) {
        console.log('逆地理编码结果:', data);
        if (data && data[0]) {
          that.setData({
            latitude: data[0].latitude,
            longitude: data[0].longitude,
            city: data[0].name,
          });
          that.showMarker(data);
        }
      },
      fail: function(error) {
        console.error('逆地理编码失败:', error);
      }
    });
  },

  // 获取当前位置
  getPoiData: function(){
    var that = this;
    this.clearInfo(); // 清空之前的信息显示
    myAmap.getRegeo({
      success: function (data){
        console.log('搜索结果',data)
        
        that.setData({
          latitude: data[0].latitude,
          longitude: data[0].longitude,
          city: data[0].name,
        });
      },
      fail: function(info){
        console.error('获取位置失败：', info);
        wx.showModal({
          title: '提示',
          content: info.errMsg || '获取位置信息失败'
        })
      }
    })
  },

  // 显示标记点
  showMarker: function(data){
    // 设置标记图标路径
    var markerlist = data.map(marker => ({
      ...marker,
      iconPath: app.img.defaultIcon, // 使用全局默认图标
      width: 30,
      height: 30
  }))
  console.log('标记点数据:', markerlist);
  
    this.setData({
      markers: markerlist,
      latitude: markerlist[0].latitude,
      longitude: markerlist[0].longitude,
      city: markerlist[0].name,
  });
  },

  // 标记点击事件
  markertap: async function(e) {
    var id = e.detail.markerId;
    console.log('标记点信息：', e.detail)
    console.log('标记点被点击，ID:', id);
    console.log('当前类型:', this.data.currentType);
    
    // 根据当前类型判断数据来源
    let markerData;
    if (this.data.currentType) {
      // 如果是服务站点标记，从数据库中查询
      markerData = await db.findStationByID(this.data.currentType, id);
    } else {
      // 如果是搜索结果的标记，从markersData中查找
      markerData = markersData[id];
    }
    
    if (markerData) {
      this.setData({
        latitude_e: markerData.latitude,
        longitude_e: markerData.longitude,
        textData: {
          name: markerData.name,
          desc: markerData.address || '详细地址信息'
        },
        currentStationId: id
      });
      
      // 检查收藏状态
      this.checkFavoriteStatus();
    }
    console.log('选中的标记点信息:', markerData);
    console.log('选中的标记点数据:', this.data.textData);
    console.log("当前类型:", this.data.currentType);
    
    this.clearInput(); // 清空输入框
  },

  // 开始导航
  startNavigation: function() {
    var that = this;
    console.log('开始导航');
    wx.openLocation({
      latitude: parseFloat(that.data.latitude_e),
      longitude: parseFloat(that.data.longitude_e),
      name: that.data.textData.name || '目的地',
      address: that.data.textData.desc || '目的地地址',
      scale: 18,
      success: function(data){
        console.log("调用成功");
      },
      fail: function(info){
        console.error('导航失败：', info);
      },
      complete: function(){
        console.log('导航请求完成');
      }
    });
  },

  // 清空信息显示栏
  clearInfo: function() {
    this.setData({
      currentType: '',
      textData: {}
    });
  },

  // 清空输入框
  clearInput: function() {
    this.setData({
      searchKeyword: '',
      showSuggestions: false,
      searchSuggestions: []
    });
  },

  // 跳转到详细页面 异步
  goToDetail: async function() {
    // 只有服务站点才跳转到详细页面
    if (this.data.currentType && this.data.textData.name) {
      // 找到当前选中的服务站点数据
      // 使用await来等待数据库查询结果
      const currentStation = await db.findStationByName (
        this.data.currentType, 
        this.data.textData.name
      );

      console.log('当前选中的服务站点:', currentStation);
      if (currentStation) {
        // 将数据编码后传递给详细页面
        const stationData = encodeURIComponent(JSON.stringify(currentStation));
        wx.navigateTo({
          url: `/pages/station-detail/station-detail?stationData=${stationData}`,
          success: function(res) {
            console.log('跳转到详细页面成功');
          },
          fail: function(err) {
            console.error('跳转失败:', err);
          }
        });
      }
    }
  },

  // 显示服务站点
  showServiceStations: async function() {
    if (!this.data.currentType) {
      this.setData({ markers: [] });
      return;
    }
    const filtered = await db.findServStations(this.data.currentType);
    console.log('过滤后的服务站点数据:', filtered);
    const markers = filtered.map(station => {
      // 为合作商户选择个性化图标
      let iconPath = station.iconUrl || `/images/icons/${station.type}-station.png`;
      
      return {
        id: station.id,
        latitude: station.latitude,
        longitude: station.longitude,
        title: station.name,
        iconPath: iconPath,
        width: 32,
        height: 32
      };
    });
    console.log('服务站点标记数据:', markers);
    this.setData({
      markers: markers
    });
  },

  // 点击分类选择
  onTypeSelect: function(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({ currentType: type });
    this.showServiceStations();
  },

  // 跳转到安新联系页面

  // 获取用户openid
  getOpenID: function() {
    const that = this;
    wx.cloud.callFunction({
      name: 'getContext',
      success: function(res){
        console.log("获取用户OPENID成功:", res);
        that.setData({
          userOpenid: res.result.OPENID
        })
      },
      fail: function(err){
        console.log("获取用户OPENID失败:", err);
      }
    })
      
  },
  // getUserOpenid: function() {
  //   try {
  //     // 方法1：从userInfo获取
  //     const userInfo = wx.getStorageSync('userInfo');
  //     if (userInfo && userInfo.openid) {
  //       this.setData({
  //         userOpenid: userInfo.openid
  //       });
  //       return;
  //     }
      
  //     // 方法2：从其他存储位置获取
  //     const openId = wx.getStorageSync('openId') || wx.getStorageSync('openid');
  //     if (openId) {
  //       this.setData({
  //         userOpenid: openId
  //       });
  //       return;
  //     }
      
  //     // 方法3：通过云函数获取
  //     wx.cloud.callFunction({
  //       name: 'quickstartFunctions',
  //       data: {
  //         type: 'getOpenId'
  //       }
  //     }).then(res => {
  //       const newOpenId = res.result.openid;
        
  //       // 保存到本地存储
  //       wx.setStorageSync('openId', newOpenId);
        
  //       // 更新用户信息
  //       const currentUserInfo = wx.getStorageSync('userInfo') || {};
  //       currentUserInfo.openid = newOpenId;
  //       wx.setStorageSync('userInfo', currentUserInfo);
        
  //       this.setData({
  //         userOpenid: newOpenId
  //       });
  //     }).catch(err => {
  //       console.error('地图页面云函数获取OpenID失败:', err);
  //     });
      
  //   } catch (error) {
  //     console.error('获取用户openid失败：', error);
  //   }
  // },

  // 切换收藏状态
  toggleFavorite: async function() {
    if (!this.data.userOpenid) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      return;
    }

    if (!this.data.currentStationId) {
      wx.showToast({
        title: '请先选择一个站点',
        icon: 'none'
      });
      return;
    }

    try {
      if (this.data.isFavorited) {
        // 取消收藏
        await this.removeFavorite();
      } else {
        // 添加收藏
        await this.addFavorite();
      }
    } catch (error) {
      console.error('收藏操作失败：', error);
      wx.showToast({
        title: '操作失败',
        icon: 'none'
      });
    }
  },

  // 添加收藏
  addFavorite: async function() {
    const that = this;
    const stationData = await db.findStationByID(this.data.currentType, this.data.currentStationId);
    
    if (!stationData) {
      wx.showToast({
        title: '站点信息不存在',
        icon: 'none'
      });
      return;
    }

    // 只传递必要的引用信息
    const favoriteData = {
      station_id: stationData.id,
      station_type: this.data.currentType
    };

    await db.addFavorite(favoriteData);
    
    this.setData({
      isFavorited: true
    });

    wx.showToast({
      title: '收藏成功',
      icon: 'success'
    });
  },

  // 取消收藏
  removeFavorite: async function() {
    const favoriteRecord = await db.checkFavorite(this.data.currentStationId, this.data.userOpenid);
    
    if (!favoriteRecord) {
      wx.showToast({
        title: '收藏记录不存在',
        icon: 'none'
      });
      return;
    }

    await db.removeFavorite(favoriteRecord._id);
    
    this.setData({
      isFavorited: false
    });

    wx.showToast({
      title: '取消收藏成功',
      icon: 'success'
    });
  },

  // 检查收藏状态
  checkFavoriteStatus: async function() {
    if (!this.data.userOpenid || !this.data.currentStationId) {
      return;
    }

    try {
      const favoriteRecord = await db.checkFavorite(this.data.currentStationId, this.data.userOpenid);
      this.setData({
        isFavorited: !!favoriteRecord
      });
    } catch (error) {
      console.error('检查收藏状态失败：', error);
    }
  }
})