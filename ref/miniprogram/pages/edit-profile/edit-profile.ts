// edit-profile.ts
Page({
  data: {
    userInfo: {
      avatarUrl: '',
      nickName: '',
      gender: '',
      phoneNumber: '',
      description: ''
    },
    showNicknameModal: false,
    showGenderModal: false,
    showDescModal: false,
    tempNickname: '',
    tempGender: '',
    tempDescription: '',
    hasChanges: false
  },

  onLoad(options: any) {
    console.log('编辑个人资料页面加载')
    this.loadUserInfo()
  },

  onReady() {
    console.log('编辑个人资料页面初次渲染完成')
  },

  onShow() {
    console.log('编辑个人资料页面显示')
  },

  onHide() {
    console.log('编辑个人资料页面隐藏')
  },

  onUnload() {
    console.log('编辑个人资料页面卸载')
  },

  // 加载用户信息
  loadUserInfo() {
    try {
      const userInfo = wx.getStorageSync('userInfo')
      if (userInfo) {
        this.setData({
          userInfo: {
            avatarUrl: userInfo.avatarUrl || '',
            nickName: userInfo.nickName || '',
            gender: userInfo.gender || '',
            phoneNumber: userInfo.phoneNumber || '',
            description: userInfo.description || ''
          }
        })
      }
    } catch (error) {
      console.error('加载用户信息失败：', error)
    }
  },

  // 选择头像
  onChooseAvatar(e: any) {
    const { avatarUrl } = e.detail
    this.setData({
      'userInfo.avatarUrl': avatarUrl,
      hasChanges: true
    })
  },

  // 编辑昵称
  editNickname() {
    this.setData({
      showNicknameModal: true,
      tempNickname: this.data.userInfo.nickName
    })
  },

  // 昵称输入
  onNicknameInput(e: any) {
    this.setData({
      tempNickname: e.detail.value
    })
  },

  // 确认昵称
  confirmNickname() {
    const { tempNickname } = this.data
    if (!tempNickname || !tempNickname.trim()) {
      wx.showToast({
        title: '请输入昵称',
        icon: 'none'
      })
      return
    }

    this.setData({
      'userInfo.nickName': tempNickname.trim(),
      showNicknameModal: false,
      hasChanges: true
    })
  },

  // 编辑性别
  editGender() {
    this.setData({
      showGenderModal: true,
      tempGender: this.data.userInfo.gender
    })
  },

  // 选择性别
  selectGender(e: any) {
    const gender = e.currentTarget.dataset.gender
    this.setData({
      tempGender: gender
    })
  },

  // 确认性别
  confirmGender() {
    this.setData({
      'userInfo.gender': this.data.tempGender,
      showGenderModal: false,
      hasChanges: true
    })
  },

  // 编辑手机号
  editPhone() {
    wx.showModal({
      title: '绑定手机号',
      content: '需要重新授权获取手机号',
      success: (res) => {
        if (res.confirm) {
          // 这里可以调用手机号授权
          wx.showToast({
            title: '功能开发中...',
            icon: 'none'
          })
        }
      }
    })
  },

  // 编辑个人简介
  editDescription() {
    this.setData({
      showDescModal: true,
      tempDescription: this.data.userInfo.description
    })
  },

  // 个人简介输入
  onDescInput(e: any) {
    this.setData({
      tempDescription: e.detail.value
    })
  },

  // 确认个人简介
  confirmDescription() {
    this.setData({
      'userInfo.description': this.data.tempDescription,
      showDescModal: false,
      hasChanges: true
    })
  },

  // 隐藏弹窗
  hideModal() {
    this.setData({
      showNicknameModal: false,
      showGenderModal: false,
      showDescModal: false
    })
  },

  // 阻止事件冒泡
  stopPropagation() {
    // 防止点击模态框内容时关闭弹窗
  },

  // 保存资料
  saveProfile() {
    const { userInfo, hasChanges } = this.data
    
    // 验证必填字段
    if (!userInfo.nickName) {
      wx.showToast({
        title: '请输入昵称',
        icon: 'none'
      })
      return
    }

    if (!userInfo.gender) {
      wx.showToast({
        title: '请选择性别',
        icon: 'none'
      })
      return
    }

    if (!userInfo.phoneNumber) {
      wx.showToast({
        title: '请绑定手机号',
        icon: 'none'
      })
      return
    }
    
    if (!hasChanges) {
      wx.showToast({
        title: '没有修改内容',
        icon: 'none'
      })
      return
    }

    try {
      // 保存到本地存储
      wx.setStorageSync('userInfo', userInfo)
      
      wx.showToast({
        title: '保存成功',
        icon: 'success',
        duration: 1500
      })

      this.setData({
        hasChanges: false
      })

      // 延迟返回上一页，让用户看到成功提示
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
      
    } catch (error) {
      console.error('保存用户信息失败：', error)
      wx.showToast({
        title: '保存失败',
        icon: 'none'
      })
    }
  }
}) 