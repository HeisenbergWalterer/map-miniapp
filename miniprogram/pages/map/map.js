var gaode_key = require('../../components/config')
var amapFile = require('../../components/amap-wx.130')
var markersData = []
const test_word = "上海市嘉定区百安公路528号"

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
    
    const myAmapFun = new amapFile.AMapWX({
      key: gaode_key.Config.key
    });

    // 使用高德地图的输入提示API
    myAmapFun.getInputtips({
      keywords: keyword,
      location: `${this.data.longitude},${this.data.latitude}`, // 当前位置
      city: this.data.city || '', // 当前城市
      success: function(data) {
        console.log('搜索建议结果:', data);
        if (data && data.tips) {
          that.setData({
            searchSuggestions: data.tips.slice(0, 8), // 最多显示8个建议
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
    
    this.setData({
      searchKeyword: suggestion.name,
      showSuggestions: false
    });

    // 根据选中的建议进行搜索
    if (suggestion.location) {
      // 如果有具体坐标，直接定位
      const location = suggestion.location.split(',');
      this.searchByLocation(parseFloat(location[0]), parseFloat(location[1]), suggestion.name);
    } else {
      // 否则按关键词搜索
      this.getPoiData(suggestion.name);
    }
  },

  // 根据坐标搜索
  searchByLocation: function(lng, lat, name) {
    const that = this;
    
    const myAmapFun = new amapFile.AMapWX({
      key: gaode_key.Config.key
    });

    myAmapFun.getPoiAround({
      location: `${lng},${lat}`,
      success: function(data) {
        console.log('定位搜索结果:', data);
        if (data && data.markers) {
          markersData = data.markers;
          that.setData({
            markers: markersData,
            latitude: lat,
            longitude: lng,
            city: name,
          });
          that.showMarkerInfo(markersData, 0);
        }
      },
      fail: function(error) {
        console.error('定位搜索失败:', error);
        // 如果定位搜索失败，回退到关键词搜索
        that.getPoiData(name);
      }
    });
  },

  // 搜索附近
  searchNearby: function() {
    if (this.data.searchKeyword.trim()) {
      this.setData({
        showSuggestions: false
      });
      this.getPoiData(this.data.searchKeyword);
    }
  },

  getPoiData: function(keywords){
    var that = this;
    let params = {
      success: function (data){
        console.log('搜索结果',data)
        markersData = data.markers; //标记的点位
        
        that.setData({
          markers: markersData,
          latitude: markersData[0].latitude,
          longitude: markersData[0].longitude,
          city: markersData[0].name,
        });
        that.showMarkerInfo(markersData, 0);
      },
      fail: function(info){
        console.error('获取位置失败：', info);
        wx.showModal({
          title: '提示',
          content: info.errMsg || '获取位置信息失败'
        })
      }
    };

    if(keywords){ //搜索目标附近点位
      params.querykeywords = keywords;
    }

    var myAmapFun = new amapFile.AMapWX({
      key: gaode_key.Config.key
    });
    // myAmapFun.getPoiAround(params)
    myAmapFun.getRegeo({
      success: function (data){
        console.log('搜索结果',data)
        
        that.setData({
          latitude: data[0].latitude,
          longitude: data[0].longitude,
          city: data[0].name,
        });
        // that.showMarkerInfo(markersData, 0);
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

  // 显示标记信息
  showMarkerInfo: function(markersData, index) {
    var that = this;
    if (markersData && markersData[index]) {
      that.setData({
        textData: {
          name: markersData[index].name || '位置点',
          desc: markersData[index].desc || markersData[index].address || '详细地址信息'
        }
      });
    }
  },

  // 标记点击事件
  markertap: function(e) {
    var id = e.detail.markerId;
    this.showMarkerInfo(markersData, id);
  }
})