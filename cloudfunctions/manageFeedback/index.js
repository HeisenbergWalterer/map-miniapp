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
      case 'update':
        return await updateFeedback(params, wxContext)
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
    status,
    type,
    priority,
    startTime,
    endTime,
    onlyMine = false  // 是否只查看自己的反馈
  } = params

  const skip = (page - 1) * pageSize
  let where = {}

  // 构建查询条件
  if (onlyMine) {
    where['userInfo.openid'] = wxContext.OPENID
  }
  
  if (status) {
    where.status = status
  }
  
  if (type) {
    where.type = type
  }
  
  if (priority) {
    where.priority = priority
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
        status: true,
        priority: true,
        createTime: true,
        updateTime: true,
        viewCount: true,
        likeCount: true,
        contact: true,
        // 隐藏敏感信息
        userInfo: false,
        images: true
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

    // 增加查看次数
    await db.collection('feedback').doc(feedbackId).update({
      data: {
        viewCount: _.inc(1)
      }
    })

    // 记录查看日志
    await db.collection('feedback_logs').add({
      data: {
        feedbackId: feedbackId,
        action: 'view',
        operator: wxContext.OPENID,
        details: '查看反馈详情',
        timestamp: db.serverDate()
      }
    })

    return {
      success: true,
      data: result.data
    }
  } catch (error) {
    console.error('获取反馈详情失败:', error)
    throw error
  }
}

// 更新反馈
async function updateFeedback(params, wxContext) {
  const { feedbackId, status, priority, processNote, processor } = params

  if (!feedbackId) {
    return {
      success: false,
      error: 'MISSING_PARAMS',
      message: '缺少反馈ID'
    }
  }

  try {
    const updateData = {
      updateTime: db.serverDate()
    }

    if (status) updateData.status = status
    if (priority) updateData.priority = priority
    if (processNote) updateData.processNote = processNote
    if (processor) updateData.processor = processor

    // 如果状态改为处理中或已解决，记录处理时间
    if (status === 'processing' || status === 'resolved') {
      updateData.processTime = db.serverDate()
    }

    const result = await db.collection('feedback').doc(feedbackId).update({
      data: updateData
    })

    // 记录操作日志
    await db.collection('feedback_logs').add({
      data: {
        feedbackId: feedbackId,
        action: 'update',
        operator: wxContext.OPENID,
        details: `更新反馈状态: ${status || '未更改'}`,
        oldData: params,
        timestamp: db.serverDate()
      }
    })

    return {
      success: true,
      data: {
        feedbackId,
        updated: result.stats.updated > 0,
        message: '反馈更新成功'
      }
    }
  } catch (error) {
    console.error('更新反馈失败:', error)
    throw error
  }
}

// 删除反馈 (软删除)
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
    // 软删除 - 只更新状态，不真正删除数据
    const result = await db.collection('feedback').doc(feedbackId).update({
      data: {
        status: 'deleted',
        deleteTime: db.serverDate(),
        deletedBy: wxContext.OPENID,
        updateTime: db.serverDate()
      }
    })

    // 记录删除日志
    await db.collection('feedback_logs').add({
      data: {
        feedbackId: feedbackId,
        action: 'delete',
        operator: wxContext.OPENID,
        details: '删除反馈',
        timestamp: db.serverDate()
      }
    })

    return {
      success: true,
      data: {
        feedbackId,
        deleted: result.stats.updated > 0,
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
    // 统计各状态的反馈数量
    const statusStats = await Promise.all([
      db.collection('feedback').where({ status: 'pending' }).count(),
      db.collection('feedback').where({ status: 'processing' }).count(),
      db.collection('feedback').where({ status: 'resolved' }).count(),
      db.collection('feedback').where({ status: 'closed' }).count()
    ])

    // 统计各类型的反馈数量
    const typeStats = await Promise.all([
      db.collection('feedback').where({ type: 'point' }).count(),
      db.collection('feedback').where({ type: 'suggestion' }).count()
    ])

    // 统计各优先级的反馈数量
    const priorityStats = await Promise.all([
      db.collection('feedback').where({ priority: 'urgent' }).count(),
      db.collection('feedback').where({ priority: 'high' }).count(),
      db.collection('feedback').where({ priority: 'normal' }).count(),
      db.collection('feedback').where({ priority: 'low' }).count()
    ])

    // 获取今日新增反馈
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayStats = await db.collection('feedback')
      .where({
        createTime: _.gte(today)
      })
      .count()

    return {
      success: true,
      data: {
        statusStats: {
          pending: statusStats[0].total,
          processing: statusStats[1].total,
          resolved: statusStats[2].total,
          closed: statusStats[3].total
        },
        typeStats: {
          point: typeStats[0].total,
          suggestion: typeStats[1].total
        },
        priorityStats: {
          urgent: priorityStats[0].total,
          high: priorityStats[1].total,
          normal: priorityStats[2].total,
          low: priorityStats[3].total
        },
        todayCount: todayStats.total,
        totalCount: statusStats.reduce((sum, stat) => sum + stat.total, 0)
      }
    }
  } catch (error) {
    console.error('获取反馈统计失败:', error)
    throw error
  }
} 