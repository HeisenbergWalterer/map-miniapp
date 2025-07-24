// point-select.ts
interface Point {
  id: string;
  name: string;
  category: string;
  categoryName: string;
}

Page({
  data: {
    searchKeyword: '',
    selectedCategory: 'all',
    points: [] as Point[],
    filteredPoints: [] as Point[]
  },

  onLoad() {
    this.initPoints();
  },

  // 初始化地点数据
  initPoints() {
    const points: Point[] = [
      // 公共厕所
      { id: 'restroom_1', name: '公共厕所 - 1号点', category: 'restroom', categoryName: '公共厕所' },
      { id: 'restroom_2', name: '公共厕所 - 2号点', category: 'restroom', categoryName: '公共厕所' },
      { id: 'restroom_3', name: '公共厕所 - 3号点', category: 'restroom', categoryName: '公共厕所' },
      { id: 'restroom_4', name: '公共厕所 - 4号点', category: 'restroom', categoryName: '公共厕所' },
      
      // 暖心服务站
      { id: 'service_1', name: '暖心服务站 - 1号点', category: 'service', categoryName: '暖心服务站' },
      { id: 'service_2', name: '暖心服务站 - 2号点', category: 'service', categoryName: '暖心服务站' },
      { id: 'service_3', name: '暖心服务站 - 3号点', category: 'service', categoryName: '暖心服务站' },
      { id: 'service_4', name: '暖心服务站 - 4号点', category: 'service', categoryName: '暖心服务站' },
      
      // 司机休息室
      { id: 'lounge_1', name: '司机休息室 - 1号点', category: 'lounge', categoryName: '司机休息室' },
      { id: 'lounge_2', name: '司机休息室 - 2号点', category: 'lounge', categoryName: '司机休息室' },
      { id: 'lounge_3', name: '司机休息室 - 3号点', category: 'lounge', categoryName: '司机休息室' },
      { id: 'lounge_4', name: '司机休息室 - 4号点', category: 'lounge', categoryName: '司机休息室' },
      
      // 合作商户
      { id: 'merchant_1', name: '合作商户 - 1号点', category: 'merchant', categoryName: '合作商户' },
      { id: 'merchant_2', name: '合作商户 - 2号点', category: 'merchant', categoryName: '合作商户' },
      { id: 'merchant_3', name: '合作商户 - 3号点', category: 'merchant', categoryName: '合作商户' },
      { id: 'merchant_4', name: '合作商户 - 4号点', category: 'merchant', categoryName: '合作商户' }
    ];

    this.setData({
      points: points,
      filteredPoints: points
    });
  },

  // 搜索输入
  onSearchInput(e: any) {
    const keyword = e.detail.value;
    this.setData({
      searchKeyword: keyword
    });
    this.filterPoints();
  },

  // 选择分类
  selectCategory(e: any) {
    const category = e.currentTarget.dataset.category;
    this.setData({
      selectedCategory: category
    });
    this.filterPoints();
  },

  // 过滤地点
  filterPoints() {
    const { points, searchKeyword, selectedCategory } = this.data;
    let filtered = points;

    // 按分类筛选
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(point => point.category === selectedCategory);
    }

    // 按关键词搜索
    if (searchKeyword.trim()) {
      filtered = filtered.filter(point => 
        point.name.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        point.categoryName.includes(searchKeyword)
      );
    }

    this.setData({
      filteredPoints: filtered
    });
  },

  // 选择地点
  selectPoint(e: any) {
    const pointName = e.currentTarget.dataset.point;
    
    // 保存选中的地点到本地存储
    wx.setStorageSync('selectedPoint', pointName);
    
    wx.showToast({
      title: '已选择地点',
      icon: 'success',
      success: () => {
        setTimeout(() => {
          wx.navigateBack();
        }, 1000);
      }
    });
  }
}) 