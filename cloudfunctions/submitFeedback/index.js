const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  console.log('云函数开始执行')
  console.log('接收到的数据:', event)
  
  const wxContext = cloud.getWXContext()
  console.log('用户上下文:', wxContext)
  
  try {
    const { type, content, selectedPoint } = event
    
    // 数据验证
    if (!content || content.trim().length === 0) {
      console.log('验证失败: 内容为空')
      return {
        success: false,
        message: '反馈内容不能为空'
      }
    }
    
    if (content.trim().length > 500) {
      return {
        success: false,
        message: '反馈内容不能超过500字'
      }
    }

    // 验证用户是否登录
    if (!wxContext.OPENID) {
      console.log('验证失败: 用户未登录')
      return {
        success: false,
        message: '请先登录后再提交反馈'
      }
    }

    // 从users集合获取用户信息
    console.log('开始从users集合获取用户信息, openid:', wxContext.OPENID)
    const userResult = await db.collection('users').where({
      _openid: wxContext.OPENID
    }).get()

    if (!userResult.data || userResult.data.length === 0) {
      console.log('用户信息不存在，需要先完善个人资料')
      return {
        success: false,
        message: '请先完善个人资料后再提交反馈'
      }
    }

    const userInfo = userResult.data[0]
    console.log('获取到的用户信息:', userInfo)

    // 验证用户是否已绑定手机号
    if (!userInfo.phoneNumber || userInfo.phoneNumber.trim() === '') {
      console.log('用户未绑定手机号')
      return {
        success: false,
        message: '请先绑定手机号后再提交反馈'
      }
    }

    // 验证手机号格式
    const phoneRegex = /^1\d{10}$/
    if (!phoneRegex.test(userInfo.phoneNumber.trim())) {
      console.log('用户手机号格式不正确:', userInfo.phoneNumber)
      return {
        success: false,
        message: '手机号格式不正确，请先修改为正确的11位手机号'
      }
    }
    
    // 构建反馈数据 - 使用从users集合获取的最新信息
    const feedbackData = {
      type: type || 'suggestion',
      content: content.trim(),
      selectedPoint: selectedPoint || null,
      createTime: db.serverDate(),
      // 用户信息从users集合获取，确保数据一致性
      openid: wxContext.OPENID,
      nickName: userInfo.nickName || '微信用户',
      phoneNumber: userInfo.phoneNumber.trim()
    }
    
    console.log('准备保存到数据库的数据:', feedbackData)
    
    // 保存到数据库
    const dbResult = await db.collection('feedback').add({
      data: feedbackData
    })
    
    console.log('数据库保存结果:', dbResult)
    
    // 返回成功结果
    const result = {
      success: true,
      message: '反馈提交成功',
      data: {
        feedbackId: dbResult._id,
        timestamp: new Date().toISOString()
      }
    }
    
    console.log('返回结果:', result)
    return result
    
  } catch (error) {
    console.error('云函数执行出错:', error)
    console.error('错误堆栈:', error.stack)
    
    const errorResult = {
      success: false,
      message: '系统错误，请稍后重试',
      error: error.message,
      errorType: error.name
    }
    
    console.log('返回错误结果:', errorResult)
    return errorResult
  }
} 