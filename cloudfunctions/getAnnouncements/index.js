// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境
const db = cloud.database();

exports.main = async (event, context) => {
    try {
        const { status = 'active', limit = 10 } = event;
        
        // 构建查询条件
        let query = {};
        if (status) {
            query.status = status;
        }
        
        // 执行查询
        const result = await db.collection('announcements')
            .where(query)
            .orderBy('created_at', 'desc')
            .limit(limit)
            .get();
        
        console.log('获取公告数据成功，数量:', result.data.length);
        
        return {
            success: true,
            data: result.data,
            total: result.data.length
        };
    } catch (error) {
        console.error('获取公告数据失败:', error);
        return {
            success: false,
            error: error.message,
            data: []
        };
    }
}

