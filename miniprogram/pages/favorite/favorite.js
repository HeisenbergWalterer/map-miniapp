// favorite.js
Page({
  data: {
    // 收藏数据（暂时为空）
    favorites: [],
    // 当前选中的分类
    selectedCategory: 'all',
    // 是否显示空状态
    showEmpty: true
  },

  onLoad(options) {
    console.log('收藏页面加载')
    this.initPage()
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

  // 加载收藏数据
  loadFavorites() {
    // 暂时显示空状态，因为还没有后端数据
    this.setData({
      showEmpty: true,
      favorites: []
    })
  },

  // 选择分类
  selectCategory(e) {
    const category = e.currentTarget.dataset.category
    this.setData({
      selectedCategory: category
    })
    
    // 根据分类筛选收藏内容（暂时为空）
    this.filterFavorites(category)
  },

  // 筛选收藏内容
  filterFavorites(category) {
    // 暂时为空，等待后端数据
    console.log('筛选分类：', category)
  },

  // 跳转到地图页面
  goToMap() {
    wx.navigateTo({
      url: '/pages/map/map'
    })
  },

  // 取消收藏
  removeFavorite(e) {
    const itemId = e.currentTarget.dataset.id
    
    wx.showModal({
      title: '确认取消收藏',
      content: '确定要取消收藏这个项目吗？',
      success: (res) => {
        if (res.confirm) {
          // 暂时显示提示，等待后端实现
          wx.showToast({
            title: '取消收藏成功',
            icon: 'success'
          })
        }
      }
    })
  },

  // 查看收藏详情
  viewFavoriteDetail(e) {
    const item = e.currentTarget.dataset.item
    
    // 暂时显示提示，等待后端实现
    wx.showToast({
      title: '详情功能开发中',
      icon: 'none'
    })
  }
}) 