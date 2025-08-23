// feedback.js
Page({
  data: {
    feedbackType: 'point', // 默认选择异常点位反馈
    selectedPoint: '',
    feedbackContent: '',
    isSubmitting: false,    // 防止重复提交
    images: [],            // 图片数组
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

  // 选择图片
  chooseImage() {
    const that = this
    const maxImages = 3
    const currentCount = this.data.images.length

    if (currentCount >= maxImages) {
      wx.showToast({
        title: `最多只能上传${maxImages}张图片`,
        icon: 'none'
      })
      return
    }

    wx.chooseMedia({
      count: maxImages - currentCount,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      camera: 'back',
      success(res) {
        console.log('选择图片成功:', res)
        
        // 显示加载提示
        wx.showLoading({
          title: '上传中...'
        })

        // 上传图片到云存储
        that.uploadImages(res.tempFiles)
      },
      fail(error) {
        console.error('选择图片失败:', error)
        wx.showToast({
          title: '选择图片失败',
          icon: 'none'
        })
      }
    })
  },

  // 上传图片到云存储
  async uploadImages(tempFiles) {
    try {
      const uploadPromises = tempFiles.map((file, index) => {
        const cloudPath = `feedback/${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}.${file.tempFilePath.split('.').pop()}`
        
        return wx.cloud.uploadFile({
          cloudPath: cloudPath,
          filePath: file.tempFilePath
        })
      })

      const uploadResults = await Promise.all(uploadPromises)
      const imageUrls = uploadResults.map(result => result.fileID)

      this.setData({
        images: [...this.data.images, ...imageUrls]
      })

      wx.hideLoading()
      wx.showToast({
        title: '图片上传成功',
        icon: 'success'
      })

    } catch (error) {
      console.error('图片上传失败:', error)
      wx.hideLoading()
      wx.showToast({
        title: '图片上传失败',
        icon: 'none'
      })
    }
  },

  // 删除图片
  deleteImage(e) {
    const index = e.currentTarget.dataset.index
    const images = this.data.images
    
    // 从云存储删除图片
    const fileID = images[index]
    wx.cloud.deleteFile({
      fileList: [fileID],
      success: res => {
        console.log('删除云存储图片成功:', res)
      },
      fail: error => {
        console.error('删除云存储图片失败:', error)
      }
    })

    // 从界面删除
    images.splice(index, 1)
    this.setData({
      images: images
    })
  },

  // 预览图片
  previewImage(e) {
    const current = e.currentTarget.dataset.src
    wx.previewImage({
      current: current,
      urls: this.data.images
    })
  },

  // 提交反馈
  async submitFeedback() {
    if (this.data.isSubmitting) {
      return // 防止重复提交
    }

    const { feedbackType, selectedPoint, feedbackContent, images, contact } = this.data

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
      images: images,
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
    // 删除已上传的图片
    if (this.data.images.length > 0) {
      wx.cloud.deleteFile({
        fileList: this.data.images
      })
    }

    this.setData({
      feedbackType: 'point',
      selectedPoint: '',
      feedbackContent: '',
      images: [],
      contact: '',
      isSubmitting: false
    })
  },

  // 页面卸载时清理未提交的图片
  onUnload() {
    if (this.data.images.length > 0 && !this.data.isSubmitted) {
      wx.cloud.deleteFile({
        fileList: this.data.images
      })
    }
  }
})
