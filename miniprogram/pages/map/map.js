var gaode_key = require('../../components/config')
var amapFile = require('../../components/amap-wx.130');
var markersData = []

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
    this.setData({
      searchKeyword: e.detail.value
    });
  },

  // 搜索附近
  searchNearby: function() {
    if (this.data.searchKeyword) {
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
    }

    if(keywords){ //搜索目标附近点位
      params.querykeywords = keywords;
    }

    var myAmapFun = new amapFile.AMapWX({
      key: gaode_key.Config.key
    });
    myAmapFun.getPoiAround(params)
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