// feedback.js
Page({
  data: {
    feedbackType: 'point', // 默认选择异常点位反馈
    selectedPoint: '',
    feedbackContent: ''
  },

  onLoad(options) {
    console.log('反馈中心页面加载')
  },

  onReady() {
    console.log('反馈中心页面初次渲染完成')
  },

  onShow() {
    console.log('反馈中心页面显示')
  },

  onHide() {
    console.log('反馈中心页面隐藏')
  },

  onUnload() {
    console.log('反馈中心页面卸载')
  },

  // 选择反馈类型
  selectType(e) {
    const type = e.currentTarget.dataset.type
    this.setData({
      feedbackType: type,
      selectedPoint: type === 'suggestion' ? '' : this.data.selectedPoint // 切换到建议时清除选择的点位
    })
  },

  // 选择点位
  selectPoint() {
    // 跳转到地点选择页面
    wx.navigateTo({
      url: '/pages/point-select/point-select'
    })
  },

  // 反馈内容输入
  onContentInput(e) {
    this.setData({
      feedbackContent: e.detail.value
    })
  },

  // 提交反馈
  submitFeedback() {
    const { feedbackType, selectedPoint, feedbackContent } = this.data

    // 验证必填字段
    if (!feedbackContent.trim()) {
      wx.showToast({
        title: '请填写反馈内容',
        icon: 'none'
      })
      return
    }

    if (feedbackType === 'point' && !selectedPoint) {
      wx.showToast({
        title: '请选择地点',
        icon: 'none'
      })
      return
    }

    // 构建反馈数据
    const feedbackData = {
      type: feedbackType,
      point: feedbackType === 'point' ? selectedPoint : '',
      content: feedbackContent.trim(),
      submitTime: new Date().toLocaleString()
    }

    console.log('反馈数据：', feedbackData)

    // 模拟提交
    wx.showLoading({
      title: '提交中...'
    })

    setTimeout(() => {
      wx.hideLoading()
      wx.showToast({
        title: '提交成功',
        icon: 'success',
        duration: 2000
      })

      // 清空表单
      this.setData({
        feedbackType: 'point',
        selectedPoint: '',
        feedbackContent: ''
      })

      // 延迟返回
      setTimeout(() => {
        wx.navigateBack()
      }, 2000)
    }, 1500)
  }
})
