// 获取app实例
const app = getApp();
// 获取数据库服务类
const db = app.DBS;

Page({
  data: {
    selectedCategory: '', // 选中的种类
    allPoints: [], // 所有点位数据
    filteredPoints: [], // 过滤后的点位数据
    loading: true, // 加载状态
    categories: [
      { key: '', name: '全部' },
      { key: 'toilet', name: '公共卫生间' },
      { key: 'warm', name: '暖心服务站' },
      { key: 'sinopec', name: '爱心驿站' },
      { key: 'partner', name: '合作商户' },
      { key: 'relay', name: '接力站' }
    ]
  },

  onLoad(options) {
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
  async initPointData() {
    try {
      this.setData({ loading: true })
      
      // 从云数据库获取所有类型的点位数据
      const allPoints = []
      
      // 获取公共卫生间数据
      try {
        const toiletData = await db.findServStations('toilet')
        if (toiletData) {
          toiletData.forEach(point => {
            allPoints.push({
              id: point._id,
              name: point.name,
              category: 'toilet',
              categoryName: '公共卫生间',
              address: point.address,
              serviceTime: point.serviceTime,
              serviceContent: point.serviceContent
            })
          })
        }
      } catch (error) {
        console.error('获取公共卫生间数据失败:', error)
      }

      // 获取暖心服务站数据
      try {
        const warmData = await db.findServStations('warm')
        if (warmData) {
          warmData.forEach(point => {
            allPoints.push({
              id: point._id,
              name: point.name,
              category: 'warm',
              categoryName: '暖心服务站',
              address: point.address,
              serviceTime: point.serviceTime,
              serviceContent: point.serviceContent
            })
          })
        }
      } catch (error) {
        console.error('获取暖心服务站数据失败:', error)
      }

      // 获取爱心驿站数据
      try {
        const sinopecData = await db.findServStations('sinopec')
        if (sinopecData) {
          sinopecData.forEach(point => {
            allPoints.push({
              id: point._id,
              name: point.name,
              category: 'sinopec',
              categoryName: '爱心驿站',
              address: point.address,
              serviceTime: point.serviceTime,
              serviceContent: point.serviceContent
            })
          })
        }
      } catch (error) {
        console.error('获取爱心驿站数据失败:', error)
      }

      // 获取合作商户数据
      try {
        const partnerData = await db.findServStations('partner')
        if (partnerData) {
          partnerData.forEach(point => {
            allPoints.push({
              id: point._id,
              name: point.name,
              category: 'partner',
              categoryName: '合作商户',
              address: point.address,
              serviceTime: point.serviceTime,
              serviceContent: point.serviceContent
            })
          })
        }
      } catch (error) {
        console.error('获取合作商户数据失败:', error)
      }

      // 获取接力站数据
      try {
        const relayData = await db.findServStations('relay')
        if (relayData) {
          relayData.forEach(point => {
            allPoints.push({
              id: point._id,
              name: point.name,
              category: 'relay',
              categoryName: '接力站',
              address: point.address,
              serviceTime: point.serviceTime,
              serviceContent: point.serviceContent
            })
          })
        }
      } catch (error) {
        console.error('获取接力站数据失败:', error)
      }

      console.log('获取到的所有点位数据:', allPoints)

      this.setData({
        allPoints: allPoints,
        filteredPoints: allPoints,
        loading: false
      })
    } catch (error) {
      console.error('初始化点位数据失败:', error)
      this.setData({ loading: false })
      
      // 如果获取失败，显示错误提示
      wx.showToast({
        title: '获取点位数据失败',
        icon: 'none',
        duration: 2000
      })
    }
  },

  // 选择种类
  selectCategory(e) {
    const category = e.currentTarget.dataset.category
    const selectedCategory = this.data.selectedCategory === category ? '' : category

    this.setData({
      selectedCategory: selectedCategory
    })

    this.filterPoints()
  },

  // 过滤点位
  filterPoints() {
    const { allPoints, selectedCategory } = this.data
    let filtered = allPoints

    // 按种类过滤
    if (selectedCategory) {
      filtered = filtered.filter((point) => point.category === selectedCategory)
    }

    this.setData({
      filteredPoints: filtered
    })
  },

  // 选择点位
  selectPoint(e) {
    const point = e.currentTarget.dataset.point
    
    // 构建完整的地点信息对象
    const selectedPointData = {
      id: point.id,                    // 地点在对应集合中的_id
      name: point.name,                // 地点名称
      category: point.category,        // 地点类型（toilet/sinopec/warm/partner/relay）
      categoryName: point.categoryName,// 地点类型显示名称
      address: point.address,          // 地址
      serviceTime: point.serviceTime,  // 服务时间
      serviceContent: point.serviceContent // 服务内容
    }
    
    // 获取上一页的页面实例
    const pages = getCurrentPages()
    const prevPage = pages[pages.length - 2]
    
    if (prevPage) {
      // 将完整的地点信息传递给上一页
      prevPage.setData({
        selectedPoint: selectedPointData
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
