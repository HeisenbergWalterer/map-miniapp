// feedback.js
Page({
  data: {
    feedbackType: 'point', // 默认选择异常点位反馈
    selectedPoint: '',
    feedbackContent: '',
    isSubmitting: false,    // 防止重复提交
    contact: ''            // 联系方式
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

  // 联系方式输入
  onContactInput(e) {
    this.setData({
      contact: e.detail.value
    })
  },



  // 提交反馈
  async submitFeedback() {
    if (this.data.isSubmitting) {
      return // 防止重复提交
    }

    const { feedbackType, selectedPoint, feedbackContent, contact } = this.data

    // 前端验证
    if (!feedbackContent.trim()) {
      wx.showToast({
        title: '请填写反馈内容',
        icon: 'none'
      })
      return
    }

    if (feedbackContent.trim().length > 500) {
      wx.showToast({
        title: '反馈内容不能超过500字',
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

    // 构建提交数据
    const submitData = {
      type: feedbackType,
      selectedPoint: feedbackType === 'point' ? selectedPoint : null,
      content: feedbackContent.trim(),
      contact: contact.trim(),
      clientTime: new Date().toISOString()
    }

    console.log('准备提交反馈数据:', submitData)

    // 设置提交状态
    this.setData({
      isSubmitting: true
    })

    wx.showLoading({
      title: '提交中...'
    })

    try {
      // 调用云函数提交反馈
      const result = await wx.cloud.callFunction({
        name: 'submitFeedback',
        data: submitData
      })

      console.log('云函数返回结果:', result)

      wx.hideLoading()

      if (result.result && result.result.success) {
        wx.showToast({
          title: result.result.data.message || '提交成功',
          icon: 'success',
          duration: 2000
        })

        // 清空表单
        this.resetForm()

        // 延迟返回
        setTimeout(() => {
          wx.navigateBack()
        }, 2000)

      } else {
        // 处理业务错误
        const error = result.result || {}
        wx.showToast({
          title: error.message || '提交失败，请重试',
          icon: 'none',
          duration: 3000
        })
      }

    } catch (error) {
      console.error('提交反馈失败:', error)
      wx.hideLoading()
      
      wx.showToast({
        title: '网络错误，请检查网络连接',
        icon: 'none',
        duration: 3000
      })
    } finally {
      // 重置提交状态
      this.setData({
        isSubmitting: false
      })
    }
  },

  // 重置表单
  resetForm() {
    this.setData({
      feedbackType: 'point',
      selectedPoint: '',
      feedbackContent: '',
      contact: '',
      isSubmitting: false
    })
  },
  
  // 页面卸载时的清理已在resetForm中处理
  onUnload() {
    console.log('反馈中心页面卸载')
  }
})
