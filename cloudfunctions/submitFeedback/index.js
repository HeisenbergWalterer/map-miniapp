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
    const { type, content, selectedPoint, images, contact, clientTime } = event
    
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
    
    // 构建反馈数据
    const feedbackData = {
      type: type || 'suggestion',
      content: content.trim(),
      selectedPoint: selectedPoint || null,
      images: images || [],
      contact: contact || '',
      clientTime: clientTime,
      serverTime: db.serverDate(),
      createTime: db.serverDate(),
      updateTime: db.serverDate(),
      userInfo: {
        openid: wxContext.OPENID,
        appid: wxContext.APPID,
        unionid: wxContext.UNIONID
      },
      status: 'pending',
      priority: 'normal',
      viewCount: 0,
      likeCount: 0
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