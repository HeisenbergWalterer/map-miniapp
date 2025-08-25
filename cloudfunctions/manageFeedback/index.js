// 反馈管理云函数
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  
  try {
    const { action, ...params } = event
    
    switch (action) {
      case 'list':
        return await listFeedback(params, wxContext)
      case 'detail':
        return await getFeedbackDetail(params, wxContext)
      case 'delete':
        return await deleteFeedback(params, wxContext)
      case 'stats':
        return await getFeedbackStats(params, wxContext)
      default:
        return {
          success: false,
          error: 'INVALID_ACTION',
          message: '无效的操作类型'
        }
    }
  } catch (error) {
    console.error('反馈管理操作失败:', error)
    return {
      success: false,
      error: 'SERVER_ERROR',
      message: '服务器错误，请稍后重试'
    }
  }
}

// 获取反馈列表
async function listFeedback(params, wxContext) {
  const {
    page = 1,
    pageSize = 10,
    type,
    startTime,
    endTime,
    onlyMine = false  // 是否只查看自己的反馈
  } = params

  const skip = (page - 1) * pageSize
  let where = {}

  // 构建查询条件
  if (onlyMine) {
    where.openid = wxContext.OPENID
  }
  
  if (type) {
    where.type = type
  }
  
  if (startTime && endTime) {
    where.createTime = _.gte(new Date(startTime)).and(_.lte(new Date(endTime)))
  }

  try {
    // 获取总数
    const countResult = await db.collection('feedback').where(where).count()
    const total = countResult.total

    // 获取列表数据
    const listResult = await db.collection('feedback')
      .where(where)
      .orderBy('createTime', 'desc')
      .skip(skip)
      .limit(pageSize)
      .field({
        _id: true,
        type: true,
        selectedPoint: true,
        content: true,
        createTime: true,
        nickName: true,
        phoneNumber: true
      })
      .get()

    return {
      success: true,
      data: {
        list: listResult.data,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize)
        }
      }
    }
  } catch (error) {
    console.error('获取反馈列表失败:', error)
    throw error
  }
}

// 获取反馈详情
async function getFeedbackDetail(params, wxContext) {
  const { feedbackId } = params

  if (!feedbackId) {
    return {
      success: false,
      error: 'MISSING_PARAMS',
      message: '缺少反馈ID'
    }
  }

  try {
    const result = await db.collection('feedback').doc(feedbackId).get()
    
    if (!result.data) {
      return {
        success: false,
        error: 'NOT_FOUND',
        message: '反馈不存在'
      }
    }

    return {
      success: true,
      data: result.data
    }
  } catch (error) {
    console.error('获取反馈详情失败:', error)
    throw error
  }
}

// 删除反馈 (硬删除)
async function deleteFeedback(params, wxContext) {
  const { feedbackId } = params

  if (!feedbackId) {
    return {
      success: false,
      error: 'MISSING_PARAMS',
      message: '缺少反馈ID'
    }
  }

  try {
    // 硬删除 - 直接删除数据
    const result = await db.collection('feedback').doc(feedbackId).remove()

    return {
      success: true,
      data: {
        feedbackId,
        deleted: result.stats.removed > 0,
        message: '反馈删除成功'
      }
    }
  } catch (error) {
    console.error('删除反馈失败:', error)
    throw error
  }
}

// 获取反馈统计
async function getFeedbackStats(params, wxContext) {
  try {
    // 统计各类型的反馈数量
    const typeStats = await Promise.all([
      db.collection('feedback').where({ type: 'point' }).count(),
      db.collection('feedback').where({ type: 'suggestion' }).count()
    ])

    // 获取今日新增反馈
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayStats = await db.collection('feedback')
      .where({
        createTime: _.gte(today)
      })
      .count()

    // 获取总数
    const totalStats = await db.collection('feedback').count()

    return {
      success: true,
      data: {
        typeStats: {
          point: typeStats[0].total,
          suggestion: typeStats[1].total
        },
        todayCount: todayStats.total,
        totalCount: totalStats.total
      }
    }
  } catch (error) {
    console.error('获取反馈统计失败:', error)
    throw error
  }
} 