Page({
  data: {
    feedbackType: 'point', // 默认选择异常点位反馈
    selectedPoint: null,   // 存储完整的地点信息对象
    feedbackContent: '',
    isSubmitting: false,   // 防止重复提交
    userInfo: {            // 用户信息（后台使用）
      nickName: '',
      phoneNumber: ''
    }
  },

  onLoad(options) {
    console.log('反馈中心页面加载')
    this.getUserInfo()
  },

  onReady() {
    console.log('反馈中心页面初次渲染完成')
  },

  onShow() {
    console.log('反馈中心页面显示')
    // 重新获取用户信息，确保信息是最新的
    this.getUserInfo()
  },

  onHide() {
    console.log('反馈中心页面隐藏')
  },

  onUnload() {
    console.log('反馈中心页面卸载')
  },

  // 获取用户信息（后台用于提交反馈）
  async getUserInfo() {
    try {
      // 检查本地存储的用户信息
      const localUserInfo = wx.getStorageSync('userInfo') || {}
      // 兼容不同的openId字段名
      const openid = wx.getStorageSync('openId') || wx.getStorageSync('openid') || localUserInfo.openid || localUserInfo.openId || localUserInfo._openid
      
      console.log('反馈页面获取用户信息 - openid:', openid)
      
      if (!openid) {
        // 用户未登录
        wx.showModal({
          title: '需要登录',
          content: '请先登录后再使用反馈功能',
          showCancel: false,
          confirmText: '去登录',
          success: () => {
            wx.switchTab({
              url: '/pages/profile/profile'
            })
          }
        })
        return
      }

      // 从数据库获取最新用户信息
      const db = wx.cloud.database()
      const userResult = await db.collection('users').where({
        _openid: openid
      }).get()

      console.log('用户信息查询结果:', userResult)

      if (userResult.data.length > 0) {
        const userDoc = userResult.data[0]
        this.setData({
          userInfo: {
            nickName: userDoc.nickName || '微信用户',
            phoneNumber: userDoc.phoneNumber || ''
          }
        })
      } else {
        // 用户数据不存在
        this.setData({
          userInfo: {
            nickName: '微信用户',
            phoneNumber: ''
          }
        })
      }
    } catch (error) {
      console.error('获取用户信息失败:', error)
      wx.showToast({
        title: '获取用户信息失败',
        icon: 'none'
      })
    }
  },



  // 选择反馈类型
  selectType(e) {
    const type = e.currentTarget.dataset.type
    this.setData({
      feedbackType: type,
      selectedPoint: type === 'suggestion' ? null : this.data.selectedPoint // 切换到建议时清除选择的点位
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
  async submitFeedback() {
    if (this.data.isSubmitting) {
      return // 防止重复提交
    }

    const { feedbackType, selectedPoint, feedbackContent } = this.data

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

    // 设置提交状态，显示加载提示
    this.setData({
      isSubmitting: true
    })

          wx.showLoading({
        title: '提交中...'
      })

      try {

      // 构建提交数据 - 用户信息由云函数从users集合获取
      const submitData = {
        type: feedbackType,
        selectedPoint: feedbackType === 'point' ? selectedPoint : null,
        content: feedbackContent.trim()
      }

      console.log('准备提交反馈数据:', submitData)

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
        const errorMessage = error.message || '提交失败，请重试'
        
        wx.showToast({
          title: errorMessage,
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
      selectedPoint: null,
      feedbackContent: '',
      isSubmitting: false
      // 保留userInfo，不重置用户信息
    })
  },
  
  // 页面卸载时的清理已在resetForm中处理
  onUnload() {
    console.log('反馈中心页面卸载')
  },


})
