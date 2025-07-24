// profile.ts

Page({
  data: {
    isLoggedIn: false,
    showModal: false,
    userInfo: {
      avatarUrl: '',
      nickName: '',
      phoneNumber: ''
    },
    tempUserInfo: {
      avatarUrl: '',
      nickName: '',
      phoneNumber: ''
    }
  },

  onLoad(options: any) {
    console.log('个人中心页面加载')
    this.checkLoginStatus()
  },

  onReady() {
    console.log('个人中心页面初次渲染完成')
  },

  onShow() {
    console.log('个人中心页面显示')
    // 每次显示页面时重新检查登录状态
    this.checkLoginStatus()
  },

  onHide() {
    console.log('个人中心页面隐藏')
  },

  onUnload() {
    console.log('个人中心页面卸载')
  },

  // 检查登录状态
  checkLoginStatus() {
    try {
      const userInfo = wx.getStorageSync('userInfo')
      const isLoggedIn = wx.getStorageSync('isLoggedIn')
      
      if (isLoggedIn && userInfo) {
        this.setData({
          isLoggedIn: true,
          userInfo: userInfo
        })
      } else {
        this.setData({
          isLoggedIn: false,
          userInfo: {
            avatarUrl: '',
            nickName: '',
            phoneNumber: ''
          }
        })
      }
    } catch (error) {
      console.error('检查登录状态失败：', error)
    }
  },

     // 显示登录弹窗
   showLoginModal() {
     this.setData({
       showModal: true,
       tempUserInfo: {
         avatarUrl: '/images/default-avatar.png',
         nickName: '',
         phoneNumber: ''
       }
     })
   },

  // 隐藏登录弹窗
  hideLoginModal() {
    this.setData({
      showModal: false
    })
  },

  // 阻止事件冒泡
  stopPropagation() {
    // 防止点击模态框内容时关闭弹窗
  },

  // 选择头像
  onChooseAvatar(e: any) {
    const { avatarUrl } = e.detail
    this.setData({
      'tempUserInfo.avatarUrl': avatarUrl
    })
  },

  // 昵称输入
  onNicknameChange(e: any) {
    const { value } = e.detail
    this.setData({
      'tempUserInfo.nickName': value
    })
  },

  // 获取手机号
  onGetPhoneNumber(e: any) {
    console.log('获取手机号结果：', e.detail)
    
    if (e.detail.errMsg === 'getPhoneNumber:ok') {
      // 这里需要将 encryptedData 和 iv 发送到后端解密获取手机号
      // 目前先模拟显示
      wx.showToast({
        title: '手机号获取成功',
        icon: 'success'
      })
      
      // 模拟手机号（实际开发中需要后端解密）
      const phoneNumber = '138****8888'
      this.setData({
        'tempUserInfo.phoneNumber': phoneNumber
      })
    } else {
      wx.showToast({
        title: '手机号获取失败',
        icon: 'none'
      })
    }
  },

  // 确认登录
  confirmLogin() {
    const { tempUserInfo } = this.data
    
    if (!tempUserInfo.nickName) {
      wx.showToast({
        title: '请输入昵称',
        icon: 'none'
      })
      return
    }

    // 执行微信登录
    wx.login({
      success: (res) => {
        if (res.code) {
          console.log('登录成功，code：', res.code)
          
          // 保存用户信息到本地存储
          try {
            wx.setStorageSync('isLoggedIn', true)
            wx.setStorageSync('userInfo', tempUserInfo)
            
            this.setData({
              isLoggedIn: true,
              userInfo: tempUserInfo,
              showModal: false
            })
            
            wx.showToast({
              title: '登录成功',
              icon: 'success'
            })
          } catch (error) {
            console.error('保存用户信息失败：', error)
            wx.showToast({
              title: '登录失败，请重试',
              icon: 'none'
            })
          }
        } else {
          console.error('登录失败：', res.errMsg)
          wx.showToast({
            title: '登录失败，请重试',
            icon: 'none'
          })
        }
      },
      fail: (err) => {
        console.error('微信登录失败：', err)
        wx.showToast({
          title: '登录失败，请重试',
          icon: 'none'
        })
      }
    })
  },

  // 退出登录
  logout(e: any) {
    // 阻止事件冒泡，避免触发整个用户信息区域的点击事件
    if (e && e.stopPropagation) {
      e.stopPropagation()
    }
    
    wx.showModal({
      title: '确认退出',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          try {
            wx.removeStorageSync('isLoggedIn')
            wx.removeStorageSync('userInfo')
            
            this.setData({
              isLoggedIn: false,
              userInfo: {
                avatarUrl: '',
                nickName: '',
                phoneNumber: ''
              }
            })
            
            wx.showToast({
              title: '已退出登录',
              icon: 'success'
            })
          } catch (error) {
            console.error('退出登录失败：', error)
          }
        }
      }
    })
  },

  // 编辑个人资料
  editProfile() {
    if (!this.data.isLoggedIn) {
      // 未登录时显示登录弹窗
      this.showLoginModal()
      return
    }
    
    // 跳转到个人资料编辑页面
    wx.navigateTo({
      url: '/pages/edit-profile/edit-profile'
    })
  },

  // 跳转到反馈中心
  goToFeedback() {
    if (!this.data.isLoggedIn) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      })
      return
    }
    
    // 跳转到反馈中心页面
    wx.navigateTo({
      url: '/pages/feedback/feedback'
    })
  },

  // 跳转到我的收藏
  goToFavorite() {
    if (!this.data.isLoggedIn) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      })
      return
    }
    
    wx.showToast({
      title: '我的收藏功能开发中...',
      icon: 'none',
      duration: 2000
    })
    // TODO: 跳转到我的收藏页面
    // wx.navigateTo({
    //   url: '/pages/favorite/favorite'
    // })
  }
}) 