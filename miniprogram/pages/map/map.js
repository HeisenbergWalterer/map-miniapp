// 获取app实例
const app = getApp();

// 引入高德地图API
var gaode_key = require('../../components/config')
// 引入高德地图SDK
var amapFile = require('../../components/amap-wx.130')
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

Page({
  data: {
    markers: [],
    latitude: '',
    longitude: '',
    city: '',
    city_e: '', //目的地
    latitude_e: '', //目的地x
    longitude_e: '',//目的地y
    textData:{}, //地点描述信息
    gaode_type: 'car', //默认驾车导航，后续可改为步行或者公交
    polyline: [],
    includePoints: [],
    transits: [], //公交车信息
    mapEndObj: {}, //目的地信息
    cost: '', //打车费用
    distance: '', //导航总距离
    daohang: false, //是否开始导航
    mapState: true, //目的地搜索状态
    searchKeyword: '', //搜索关键词
    showSuggestions: false, //是否显示搜索建议
    searchSuggestions: [], //搜索建议列表
    searchTimer: null, //搜索防抖定时器
  },

  onLoad: function(){
    this.getPoiData() //获取当前位置
  },

  onReady: function(){
    console.log('地图页面初次渲染完成')
  },

  onShow: function(){
    console.log('地图页面显示')
  },

  onHide: function(){
    console.log('地图页面隐藏')
  },

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
        searchKeyword: suggestion.name,
        showSuggestions: false,
        textData: {
          name: suggestion.name, 
          desc: suggestion.address || '详细地址信息'
        }
      });
    } else {
      // 否则显示建议的所有地点
      const that = this;
      console.log("建议数据：", this.data.searchSuggestions);
      markersData = this.data.searchSuggestions.slice(1, MAX_TIPS);
      var count = 0;
      markersData = markersData.map(item => ({
        ...item,
        id : count++,
        longitude: item.location.split(',')[0],
        latitude: item.location.split(',')[1],
      }))
      this.showMarker(markersData);
    }
  },

  // 根据坐标搜索
  searchByLocation: function(lng, lat, name) {
    const that = this;
    
    const myAmapFun = new amapFile.AMapWX({
      key: gaode_key.Config.key
    });
    // 用坐标进行逆地理编码搜索
    myAmapFun.getRegeo({
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
  markertap: function(e) {
    var id = e.detail.markerId;
    console.log('标记点信息：', e.detail)
    console.log('标记点被点击，ID:', id);
    this.showMarker([markersData[id]]);
    this.setData({
      textData: {
        name: markersData[id].name,
        desc: markersData[id].address || '详细地址信息'
      }
    })
  },

  // 清空信息显示栏
  clearInfo: function() {
    this.setData({
      textData: {}
    });
  },
})