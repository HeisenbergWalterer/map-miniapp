const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境

exports.main = async (event, context) => {
  return new Promise((resolve, reject) => {
    let { OPENID, APPID, UNIONID } = cloud.getWXContext();
    resolve({
      OPENID: OPENID,
      APPID: APPID,
      UNIONID: UNIONID,
    });
  });
}
