var gaode_key = require ('../../components/config')
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
  },
  onload:function(){
    this.getPoiData() //获取当前位置
  },
  getPoiData: function(keywords){
    var that = this;
    let params ={
    success: function (data){
      console.log('当前位置',data)
      markersData = data.markers; //标记的点位
      console.log('搜索当前位置，清除目的地信息')
      that.serData({
        markers: markersData,
        latitude:markersData[0].latitude,
        longitude:markersData[0].longitude,
        city: markersData[0].name,
      });
      that.showMarkerInfo(markersData,0);
    },
    fail: function(info){
      wx.showModal({
        title:info.errMsg
      })
    }
  }
    if(keyboards){ //待完成搜索目标附近点位
      Params.querykeyword = keyboards;
    }
    var myAmapFun = new amapFile.AMapWX({
      key: gaode_key.Config.key
    });
    myAmapFun.getPoiAround(params)
  }
 
})