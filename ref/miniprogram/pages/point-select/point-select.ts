// point-select.ts
Page({
  data: {
    selectedCategory: '', // 选中的种类
    searchKeyword: '', // 搜索关键词
    allPoints: [] as any[], // 所有点位数据
    filteredPoints: [] as any[] // 过滤后的点位数据
  },

  onLoad(options: any) {
    console.log('点位选择页面加载')
    this.initPointData()
  },

  onReady() {
    console.log('点位选择页面初次渲染完成')
  },

  onShow() {
    console.log('点位选择页面显示')
  },

  onHide() {
    console.log('点位选择页面隐藏')
  },

  onUnload() {
    console.log('点位选择页面卸载')
  },

  // 初始化点位数据
  initPointData() {
    const categories = ['公共卫生间', '暖心服务站', '司机休息室', '合作商户']
    const allPoints: any[] = []

    categories.forEach(category => {
      for (let i = 1; i <= 4; i++) {
        allPoints.push({
          id: `${category}_${i}`,
          name: `${category}${i}号`,
          category: category
        })
      }
    })

    this.setData({
      allPoints: allPoints,
      filteredPoints: allPoints
    })
  },

  // 选择种类
  selectCategory(e: any) {
    const category = e.currentTarget.dataset.category
    const selectedCategory = this.data.selectedCategory === category ? '' : category

    this.setData({
      selectedCategory: selectedCategory
    })

    this.filterPoints()
  },

  // 搜索输入
  onSearchInput(e: any) {
    this.setData({
      searchKeyword: e.detail.value
    })
    this.filterPoints()
  },

  // 过滤点位
  filterPoints() {
    const { allPoints, selectedCategory, searchKeyword } = this.data
    let filtered = allPoints

    // 按种类过滤
    if (selectedCategory) {
      filtered = filtered.filter((point: any) => point.category === selectedCategory)
    }

    // 按搜索关键词过滤
    if (searchKeyword.trim()) {
      const keyword = searchKeyword.trim().toLowerCase()
      filtered = filtered.filter((point: any) => 
        point.name.toLowerCase().includes(keyword) || 
        point.category.toLowerCase().includes(keyword)
      )
    }

    this.setData({
      filteredPoints: filtered
    })
  },

  // 选择点位
  selectPoint(e: any) {
    const point = e.currentTarget.dataset.point
    
    // 获取上一页的页面实例
    const pages = getCurrentPages()
    const prevPage = pages[pages.length - 2]
    
    if (prevPage) {
      // 将选中的点位传递给上一页
      prevPage.setData({
        selectedPoint: point.name
      })
    }

    wx.showToast({
      title: `已选择 ${point.name}`,
      icon: 'success',
      duration: 1500
    })

    // 延迟返回，让用户看到选择反馈
    setTimeout(() => {
      wx.navigateBack()
    }, 1500)
  }
}) 