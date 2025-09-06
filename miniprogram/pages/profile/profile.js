// profile.js
const app = getApp();

Page({
  data: {
    isLoggedIn: false,
    userInfo: {
      openid: '',
      avatarUrl: '',
      nickName: '',
      phoneNumber: ''
    },
    appCloudImg: app.img.cloud
  },

  onLoad(options) {
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
    // 若已登录，尝试刷新云端资料到本地
    if (this.data.isLoggedIn) {
      this.refreshUserFromDB()
    }
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
            openid: '',
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

  // 一键登录入口（必须在用户点击手势中立刻调用 getUserProfile，否则会被限制）
  login() {
    console.log('[登录] 开始一键登录流程（仅获取 OPENID）')
    // 不请求头像昵称授权，仅以 OPENID 建立/读取账户
    this._continueLogin(null)
  },

  // 授权完成后继续：获取 OPENID + 写库 + 更新本地
  async _continueLogin(profile) {
    wx.showLoading({ title: '登录中...', mask: true })
    try {
      // 获取 openid
      const ctxRes = await wx.cloud.callFunction({ name: 'getContext' })
      const { OPENID } = (ctxRes && ctxRes.result) || {}
      console.log('[登录] getContext 结果：', ctxRes)
      if (!OPENID) throw new Error('未获取到 OPENID')
      console.log('[登录] 当前用户 OPENID：', OPENID)

      const avatarUrl = profile && profile.avatarUrl ? profile.avatarUrl : ''
      const nickName = profile && profile.nickName ? profile.nickName : ''

      // 写入/更新 users
      const db = app.DBS ? app.DBS.getDB() : wx.cloud.database()
      const now = new Date()
      const baseData = { avatarUrl, nickName, updatedAt: now }

      // 以 _openid 作为唯一标识查询
      const existRes = await db.collection('users').where({ _openid: OPENID }).get()
      console.log('[登录] 用户查询结果 count=', existRes.data.length)
      let mergedForLocal = { avatarUrl, nickName }
      if (existRes.data.length === 0) {
        // 新用户：使用默认昵称与头像
        const createData = {
          nickName: '微信用户',
          avatarUrl: '/images/default-avatar.png',
          createdAt: now,
          updatedAt: now
        }
        const addRes = await db.collection('users').add({ data: createData })
        console.log('[登录] 新增用户成功：', addRes)
        mergedForLocal = { avatarUrl: createData.avatarUrl, nickName: createData.nickName }
      } else {
        const docId = existRes.data[0]._id
        // 合并非空头像/昵称，避免覆盖已有有效数据
        const current = existRes.data[0]
        const updatePayload = {}
        if (avatarUrl) updatePayload.avatarUrl = avatarUrl
        if (nickName) updatePayload.nickName = nickName
        updatePayload.updatedAt = now

        const updateRes = await db.collection('users').doc(docId).update({ data: updatePayload })
        console.log('[登录] 更新用户成功：', updateRes)
        mergedForLocal = {
          avatarUrl: updatePayload.avatarUrl || current.avatarUrl || '',
          nickName: updatePayload.nickName || current.nickName || '',
          gender: current.gender || '',
          description: current.description || '',
          phoneNumber: current.phoneNumber || '',
          age: current.age || ''
        }
      }

      // 本地缓存
      const localUser = { openid: OPENID, ...mergedForLocal }
      wx.setStorageSync('isLoggedIn', true)
      wx.setStorageSync('userInfo', localUser)
      this.setData({ isLoggedIn: true, userInfo: localUser })

      wx.showToast({ title: '登录成功', icon: 'success' })
    } catch (error) {
      console.error('[登录] 流程失败：', error)
      wx.showToast({ title: '登录失败', icon: 'none' })
    } finally {
      wx.hideLoading()
    }
  },

  // 可选：已登录时刷新云端资料（避免本地信息过期）
  async refreshUserFromDB() {
    try {
      const local = wx.getStorageSync('userInfo') || {}
      // 兼容不同的openId字段名
      const openid = wx.getStorageSync('openId') || wx.getStorageSync('openid') || local.openid || local.openId || local._openid;
      
      if (!openid) return
      const db = app.DBS ? app.DBS.getDB() : wx.cloud.database()
      const res = await db.collection('users').where({ _openid: openid }).get()
      if (res.data && res.data.length > 0) {
        const doc = res.data[0]
        const merged = { ...local, ...doc, openid }
        wx.setStorageSync('userInfo', merged)
        this.setData({ userInfo: merged, isLoggedIn: true })
      }
    } catch (e) {
      console.warn('[资料] 刷新用户资料失败：', e)
    }
  },

  // 退出登录
  logout(e) {
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
                openid: '',
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
      // 未登录时执行一键登录
      this.login()
      return
    }
    
    // 提示该功能暂不支持
    wx.showToast({
      title: '该部分暂不支持',
      icon: 'none',
      duration: 2000
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
    
    // 跳转到我的收藏页面
    wx.navigateTo({
      url: '/pages/favorite/favorite'
    })
  }
})
