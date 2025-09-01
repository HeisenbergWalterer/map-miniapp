const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境

const db = cloud.database()

exports.main = async (event, context) => {
    console.log("10secs have gone~");
    return "trigger is loaded";
}