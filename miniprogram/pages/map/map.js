// 引入高德地图API
var gaode_key = require('../../components/config')
// 引入高德地图SDK
var amapFile = require('../../components/amap-wx.130')
// 获取app实例
const app = getApp();
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
// 固定服务站点数据
const serviceStations = [
  // 公共厕所
  { id: 1, name: "方泰新公厕", address: "花园浜路泰盛别墅", serviceTime: "5:00-21:00", longitude: 121.217424, latitude: 31.314409, type: "toilet", photoUrl: "/images/stations/toilet-1.jpg", serviceContent: "公共厕所" },
  { id: 2, name: "方泰菜场公厕", address: "方锦路44号花园新村东面", serviceTime: "5:00-20:00", longitude: 121.216674, latitude: 31.317756, type: "toilet", photoUrl: "/images/stations/toilet-2.jpg", serviceContent: "公共厕所" },
  { id: 3, name: "方中路1号公厕", address: "方中路101弄1号旁边", serviceTime: "5:00-20:00", longitude: 121.21552, latitude: 31.319254, type: "toilet", photoUrl: "/images/stations/toilet-3.jpg", serviceContent: "公共厕所" },
  { id: 4, name: "泰富路265号公厕", address: "泰富路265号成人学校旁边", serviceTime: "5:00-20:00", longitude: 121.218929, latitude: 31.319004, type: "toilet", photoUrl: "/images/stations/toilet-4.jpg", serviceContent: "公共厕所" },
  { id: 5, name: "泰富路222号公厕", address: "泰富路方宝佳苑", serviceTime: "5:00-20:00", longitude: 121.219847, latitude: 31.319059, type: "toilet", photoUrl: "/images/stations/toilet-5.jpg", serviceContent: "公共厕所" },
  { id: 6, name: "方中路84号公厕", address: "方中路77弄花中苑对面", serviceTime: "24小时", longitude: 121.216661, latitude: 31.3207, type: "toilet", photoUrl: "/images/stations/toilet-6.jpg", serviceContent: "公共厕所" },
  // 暖心服务站
  { id: 7, name: "方泰党群服务中心", address: "宝安公路4535号", serviceTime: "9:00-20:30", longitude: 121.217191, latitude: 31.315952, type: "warm", photoUrl: "/images/stations/warm-1.jpg", serviceContent: "免费饮水、休憩、应急物资、如厕" },
  { id: 8, name: "安亭·上海数字汽车园党群服务中心", address: "百安路528号", serviceTime: "9:00-20:30", longitude: 121.203435, latitude: 31.316464, type: "warm", photoUrl: "/images/stations/warm-2.jpg", serviceContent: "免费饮水、休憩、应急物资、如厕" },
  { id: 9, name: "星明村邻里中心", address: "星明村850号", serviceTime: "9:00-20:30", longitude: 121.249254, latitude: 31.306452, type: "warm", photoUrl: "/images/stations/warm-3.jpg", serviceContent: "免费饮水、休憩、应急物资、如厕" },
  { id: 10, name: "方泰社区居委会", address: "宝安公路4505号", serviceTime: "8:30-11:00, 13:00-17:00", longitude: 121.217576, latitude: 31.316919, type: "warm", photoUrl: "/images/stations/warm-4.jpg", serviceContent: "免费饮水、休憩、应急物资、如厕" },
  { id: 11, name: "泰顺社区居委会", address: "泰顺路451号", serviceTime: "8:30-11:00, 13:00-17:00", longitude: 121.21836, latitude: 31.317131, type: "warm", photoUrl: "/images/stations/warm-5.jpg", serviceContent: "免费饮水、休憩、应急物资、如厕" },
  { id: 12, name: "泰东社区居委会", address: "东环路207号", serviceTime: "8:30-11:00, 13:00-17:00", longitude: 121.22363, latitude: 31.321054, type: "warm", photoUrl: "/images/stations/warm-6.jpg", serviceContent: "免费饮水、休憩、应急物资、如厕" },
  { id: 13, name: "讴象社区居委会", address: "园区路301弄38号", serviceTime: "8:30-11:00, 13:00-17:00", longitude: 121.521867, latitude: 31.073101, type: "warm", photoUrl: "/images/stations/warm-7.jpg", serviceContent: "免费饮水、休憩、应急物资、如厕" },
  // 中石化"爱心驿站"
  { id: 14, name: "吉泰加油站", address: "宝安公路4205号", serviceTime: "24小时", longitude: 121.230464, latitude: 31.317401, type: "sinopec", photoUrl: "/images/stations/sinopec-1.jpg", serviceContent: "饮水、手机充电、简易维修工具、垃圾收集" },
  { id: 15, name: "嘉泰加油站", address: "嘉松北路4445号", serviceTime: "24小时", longitude: 121.220657, latitude: 31.315552, type: "sinopec", photoUrl: "/images/stations/sinopec-2.jpg", serviceContent: "饮水、手机充电、简易维修工具、垃圾收集" },
  { id: 16, name: "百安加油站", address: "宝安公路4928号", serviceTime: "24小时", longitude: 121.197702, latitude: 31.314387, type: "sinopec", photoUrl: "/images/stations/sinopec-3.jpg", serviceContent: "饮水、手机充电、简易维修工具、垃圾收集" },
  { id: 17, name: "安亭加油站（司机之家）", address: "曹安公路5387号", serviceTime: "24小时", longitude: 121.170798, latitude: 31.288444, type: "sinopec", photoUrl: "/images/stations/sinopec-4.jpg", serviceContent: "休息室（按摩椅）、饮水、热饭、洗澡、洗衣、充电、应急药品、血压测量、修车工具箱、图书角" },
  // 合作商户
  { id: 18, name: "老盛昌（宝安店）", address: "宝安公路4535号", serviceTime: "6:30-20:30", longitude: 121.217191, latitude: 31.315952, type: "partner", photoUrl: "/images/stations/partner-1.jpg", serviceContent: "骑手12元优惠套餐" },
  { id: 19, name: "上海鑫哈轴承机电有限公司", address: "安亭镇安亭路255弄", serviceTime: "8:00-17:00", longitude: 121.234896, latitude: 31.311677, type: "partner", photoUrl: "/images/stations/partner-2.jpg", serviceContent: "免费饮水、休憩、如厕" },
  { id: 20, name: "比星咖啡店", address: "百安路528号", serviceTime: "7:30-18:00", longitude: 121.203435, latitude: 31.31364, type: "partner", photoUrl: "/images/stations/partner-3.jpg", serviceContent: "（对骑士友好店）免费饮水、休憩、如厕" },
  { id: 21, name: "麦当劳", address: "百安路528号4幢", serviceTime: "7:00-23:00", longitude: 121.196185, latitude: 31.323633, type: "partner", photoUrl: "/images/stations/partner-4.jpg", serviceContent: "（对骑士友好店）免费饮水、休憩、如厕" },
  // 户外职工接力站
  { id: 22, name: "方泰文化分中心", address: "安亭镇嘉松北路4355号", serviceTime: "8:30-20:00", longitude: 121.21882, latitude: 31.318338, type: "relay", photoUrl: "/images/stations/relay-1.jpg", serviceContent: "饮水供给、避暑取暖、餐食加热、手机充电、应急药箱" },
  { id: 23, name: "方泰敬老院", address: "安亭镇方中路160号", serviceTime: "24小时", longitude: 121.212885, latitude: 31.318052, type: "relay", photoUrl: "/images/stations/relay-2.jpg", serviceContent: "饮水供给、避暑取暖、餐食加热、手机充电、应急药箱" },
  { id: 24, name: "数字汽车园邻里中心（比星咖啡店）", address: "百安路528号", serviceTime: "7:30-18:00", longitude: 121.203435, latitude: 31.31364, type: "relay", photoUrl: "/images/stations/relay-3.jpg", serviceContent: "饮水供给、避暑取暖、餐食加热、手机充电、应急药箱" },
  { id: 25, name: "百安加油站", address: "宝安公路4928号", serviceTime: "24小时", longitude: 121.197702, latitude: 31.314387, type: "relay", photoUrl: "/images/stations/relay-4.jpg", serviceContent: "饮水供给、避暑取暖、餐食加热、手机充电、应急药箱" },
  { id: 26, name: "安亭老街职工服务站", address: "安亭镇安亭街1788号", serviceTime: "周一至周五8:30-17:00", longitude: 121.158382, latitude: 31.290388, type: "relay", photoUrl: "/images/stations/relay-5.jpg", serviceContent: "饮水供给（茶饮及冷饮）、避暑取暖、餐食加热、手机充电、应急药箱" }
];
// 页面定义
Page({
  data: {
    currentType: "", // 初始无类型
    markers: [],
    latitude: '',   //当前位置纬度
    longitude: '',  //当前位置经度
    showTypeSelector: false, // 控制分类区域显示
    city: '',       //当前位置
    city_e: '',     //目的地
    latitude_e: '', //目的地纬度
    longitude_e: '',//目的地经度
    textData:{},    //地点描述信息
    gaode_type: 'car', //默认驾车导航，后续可改为步行或者公交
    polyline: [],
    includePoints: [],
    transits: [],   //公交车信息
    mapEndObj: {},  //目的地信息
    cost: '',     //打车费用
    distance: '', //导航总距离
    daohang: false, //是否开始导航
    mapState: true, //目的地搜索状态
    searchKeyword: '',      //搜索关键词
    showSuggestions: false, //是否显示搜索建议
    searchSuggestions: [],  //搜索建议列表
    searchTimer: null,      //搜索防抖定时器
  },
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
  },

  // 页面显示时
  onShow: function(){
    console.log('地图页面显示')
    this.clearInfo(); // 清空之前的信息显示
    this.clearInput(); // 清空输入框
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
  markertap: function(e) {
    var id = e.detail.markerId;
    console.log('标记点信息：', e.detail)
    console.log('标记点被点击，ID:', id);
    
    // 根据当前类型判断数据来源
    let markerData;
    if (this.data.currentType) {
      // 如果是服务站点标记，从serviceStations中查找
      const filtered = serviceStations.filter(station => station.type === this.data.currentType);
      markerData = filtered.find(station => station.id == id);
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
        }
      });
    }
    
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

  // 跳转到详细页面
  goToDetail: function() {
    // 只有服务站点才跳转到详细页面
    if (this.data.currentType && this.data.textData.name) {
      // 找到当前选中的服务站点数据
      const filtered = serviceStations.filter(station => station.type === this.data.currentType);
      const currentStation = filtered.find(station => 
        station.name === this.data.textData.name && 
        station.address === this.data.textData.desc
      );
      
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
  showServiceStations: function() {
    if (!this.data.currentType) {
      this.setData({ markers: [] });
      return;
    }
    const filtered = serviceStations.filter(station => station.type === this.data.currentType);
    const markers = filtered.map(station => {
      // 为合作商户选择个性化图标
      let iconPath = `/images/icons/${station.type}-station.png`;
      
      if (station.type === 'partner') {
        // 根据商户名称选择对应的图标
        if (station.name.includes('老盛昌')) {
          iconPath = '/images/icons/laoshengchang-station.png';
        } else if (station.name.includes('上海鑫哈轴承')) {
          iconPath = '/images/icons/xinha-bearing-station.png';
        } else if (station.name.includes('比星咖啡')) {
          iconPath = '/images/icons/bixing-coffee-station.png';
        } else if (station.name.includes('麦当劳')) {
          iconPath = '/images/icons/mcdonalds-station.png';
        }
      }
      
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
    this.setData({
      markers: markers
    });
  },
  onTypeSelect: function(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({ currentType: type });
    this.showServiceStations();
  },
})