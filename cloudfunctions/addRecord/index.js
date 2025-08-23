// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境
const db = cloud.database();

exports.main = async (event, context) => {
  console.log(context);
  try {
    await db.collection(event.collectionName).add(event.data);
    console.log("添加成功:", event);
  } catch (error) {
    console.log("添加失败");
  }
}