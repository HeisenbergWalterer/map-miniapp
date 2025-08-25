const app = getApp();

Page({
  data: {
    userInfo: {
      avatarUrl: '',
      nickName: '',
      gender: '',
      age: '',
      phoneNumber: '',
      description: ''
    },
    showNicknameModal: false,
    showGenderModal: false,
    showAgeModal: false,
    showDescModal: false,
    tempNickname: '',
    tempGender: '',
    tempAge: '',
    tempDescription: '',
    hasChanges: false,
    phoneError: '' // 手机号错误提示
  },

  onLoad(options) {
    console.log('编辑个人资料页面加载')
    this.loadUserInfo()
  },

  onReady() {
    console.log('编辑个人资料页面初次渲染完成')
  },

  onShow() {
    console.log('编辑个人资料页面显示')
    // 每次进入都以云端为准刷新显示
    this.refreshFromDB()
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
            age: userInfo.age || '',
            phoneNumber: userInfo.phoneNumber || '',
            description: userInfo.description || ''
          }
        })
      }
    } catch (error) {
      console.error('加载用户信息失败：', error)
    }
  },

  // 编辑年龄
  editAge() {
    this.setData({
      showAgeModal: true,
      tempAge: this.data.userInfo.age ? String(this.data.userInfo.age) : ''
    })
  },

  // 年龄输入
  onAgeInput(e) {
    this.setData({
      tempAge: e.detail.value
    })
  },

  // 确认年龄
  confirmAge() {
    const ageNum = Number(this.data.tempAge)
    if (!this.data.tempAge || isNaN(ageNum) || ageNum <= 0 || ageNum > 120) {
      wx.showToast({ title: '请输入有效年龄', icon: 'none' })
      return
    }
    this.setData({
      'userInfo.age': ageNum,
      showAgeModal: false,
      hasChanges: true
    })
  },

  // 选择头像
  onChooseAvatar(e) {
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
  onNicknameInput(e) {
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
  selectGender(e) {
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

  // 手机号输入
  onPhoneInput(e) {
    let val = (e.detail.value || '').replace(/\D/g, '').slice(0, 11)
    
    // 格式验证提示
    this.validatePhoneNumber(val)
    
    this.setData({ 'userInfo.phoneNumber': val, hasChanges: true })
  },

  // 手机号格式验证
  validatePhoneNumber(phoneNumber) {
    if (!phoneNumber) {
      // 清空时不显示错误
      this.setData({ phoneError: '' })
      return true
    }
    
    let errorMsg = ''
    
    // 检查长度
    if (phoneNumber.length > 0 && phoneNumber.length < 11) {
      errorMsg = '手机号必须为11位数字'
    }
    // 检查第一位必须是1
    else if (phoneNumber.length > 0 && phoneNumber[0] !== '1') {
      errorMsg = '手机号第一位必须是1'
    }
    // 检查完整格式（11位且第一位是1）
    else if (phoneNumber.length === 11 && !/^1\d{10}$/.test(phoneNumber)) {
      errorMsg = '请输入正确的手机号格式'
    }
    
    this.setData({ phoneError: errorMsg })
    return errorMsg === ''
  },

  // 编辑个人简介
  editDescription() {
    this.setData({
      showDescModal: true,
      tempDescription: this.data.userInfo.description
    })
  },

  // 个人简介输入
  onDescInput(e) {
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
      showAgeModal: false,
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

    // 基本校验：昵称为必填，其余可选
    if (!userInfo.nickName || !userInfo.nickName.trim()) {
      wx.showToast({ title: '请输入昵称', icon: 'none' })
      return
    }

    // 手机号格式验证（如果填写了手机号）
    if (userInfo.phoneNumber) {
      if (!this.validatePhoneNumber(userInfo.phoneNumber)) {
        wx.showToast({ title: this.data.phoneError || '手机号格式不正确', icon: 'none' })
        return
      }
    }

    if (!hasChanges) {
      wx.showToast({ title: '没有修改内容', icon: 'none' })
      return
    }

    try {
      const stored = wx.getStorageSync('userInfo') || {}
      // 兼容不同的openId字段名
      const openid = wx.getStorageSync('openId') || wx.getStorageSync('openid') || stored.openid || stored.openId || stored._openid;
      
      console.log('编辑资料页获取用户信息 - openid:', openid);
      
      if (!openid) {
        wx.showToast({ title: '请先登录', icon: 'none' })
        return
      }

      // 同步到云数据库 users
      const db = app.DBS ? app.DBS.getDB() : wx.cloud.database()
      const now = new Date()
      const updateData = {
        avatarUrl: userInfo.avatarUrl || '',
        nickName: userInfo.nickName.trim(),
        gender: userInfo.gender || '',
        age: userInfo.age || '',
        phoneNumber: userInfo.phoneNumber || '',
        description: userInfo.description || '',
        updatedAt: now
      }

      console.log('[资料保存] openid=', openid, ' updateData=', updateData)

      db.collection('users').where({ _openid: openid }).get().then(res => {
        if (res.data && res.data.length > 0) {
          const docId = res.data[0]._id
          return db.collection('users').doc(docId).update({ data: updateData })
        } else {
          // 若不存在（极少数异常场景），创建一条（不写入自定义 openid 字段）
          return db.collection('users').add({ data: { createdAt: now, ...updateData } })
        }
      }).then(saveRes => {
        console.log('[资料保存] 云端更新成功：', saveRes)

        // 更新本地存储（合并 openid）
        const localUser = { ...(wx.getStorageSync('userInfo')||{}), openid, ...updateData }
        wx.setStorageSync('userInfo', localUser)

        wx.showToast({ title: '保存成功', icon: 'success', duration: 1200 })
        this.setData({ hasChanges: false })
        setTimeout(() => { wx.navigateBack() }, 1200)
      }).catch(err => {
        console.error('[资料保存] 云端更新失败：', err)
        wx.showToast({ title: '保存失败', icon: 'none' })
      })
      
    } catch (error) {
      console.error('保存用户信息失败：', error)
      wx.showToast({ title: '保存失败', icon: 'none' })
    }
  }
  ,

  // 从云端读取最新资料覆盖显示
  refreshFromDB() {
    try {
      const local = wx.getStorageSync('userInfo') || {}
      // 兼容不同的openId字段名
      const openid = wx.getStorageSync('openId') || wx.getStorageSync('openid') || local.openid || local.openId || local._openid;
      
      if (!openid) return
      const db = app.DBS ? app.DBS.getDB() : wx.cloud.database()
      db.collection('users').where({ _openid: openid }).get().then(res => {
        if (res.data && res.data.length > 0) {
          const doc = res.data[0]
          const merged = { ...local, ...doc, openid }
          wx.setStorageSync('userInfo', merged)
          this.setData({
            userInfo: {
              avatarUrl: merged.avatarUrl || '',
              nickName: merged.nickName || '微信用户',
              gender: merged.gender || '',
              age: merged.age || '',
              phoneNumber: merged.phoneNumber || '',
              description: merged.description || ''
            },
            hasChanges: false,
            phoneError: '' // 清除错误提示
          })
        }
      })
    } catch (e) {
      console.warn('[资料] 刷新编辑资料失败：', e)
    }
  },

  // 使用微信昵称（授权弹窗）
  useWeChatNickname() {
    wx.getUserProfile({
      desc: '获取微信昵称用于完善资料',
      success: (res) => {
        const nick = (res && res.userInfo && res.userInfo.nickName) || ''
        if (!nick) return
        this.setData({ 'userInfo.nickName': nick, hasChanges: true })
      }
    })
  },

  // 使用微信头像（授权弹窗）
  useWeChatAvatar() {
    wx.getUserProfile({
      desc: '获取微信头像用于完善资料',
      success: (res) => {
        let avatar = (res && res.userInfo && res.userInfo.avatarUrl) || ''
        if (!avatar) return
        // 兼容微信头像 URL 协议问题（强制 https）
        if (avatar.indexOf('http://') === 0) {
          avatar = avatar.replace('http://', 'https://')
        }
        this.setData({ 'userInfo.avatarUrl': avatar, hasChanges: true })
      }
    })
  }
})
