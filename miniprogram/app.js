// app.js
App({
  onLaunch: function () {
    this.globalData = {
      // env 参数说明：
      //   env 参数决定接下来小程序发起的云开发调用（wx.cloud.xxx）会默认请求到哪个云环境的资源
      //   此处请填入环境 ID, 环境 ID 可打开云控制台查看
      //   如不填则使用默认环境（第一个创建的环境）
      env: ""
    };
    if (!wx.cloud) {
      console.error("请使用 2.2.3 或以上的基础库以使用云能力");
    } else {
      wx.cloud.init({
        env: this.globalData.env,
        traceUser: true,
      });
    }
  },

  // ---------------使用数据库---------------
  // 数据库服务类
  DBS: {
    // 获取数据库实例
    getDB: function() {
      return wx.cloud.database();
    },

  // -----数据库查询特定服务站点-----
  // 名称查询
  findStationByName: function(type, name) {
    const db = this.getDB();
    return new Promise((resolve, reject) => {
      db.collection(type).where({
        name: name
      }).get({
        success: function(res) {
          console.log('查询结果:', res.data);
          if (res.data.length > 0) {
            resolve(res.data[0]); // 返回第一条记录
          } else {
            resolve(null); // 没有找到数据
          }
        },
        fail: function(err) {
          console.error('查询失败:', err);
          reject(err); // 查询失败
        }
      });
    });
  },

  // id查询
  findStationByID: function(type, id) {
    const db = this.getDB();
    return new Promise((resolve, reject) => {
      db.collection(type).where({
        id: id
      }).get({
        success: function(res) {
          console.log('查询结果:', res.data);
          if (res.data.length > 0) {
            resolve(res.data[0]); // 返回第一条记录
          } else {
            resolve(null); // 没有找到数据
          }
        },
        fail: function(err) {
          console.error('查询失败:', err);
          reject(err); // 查询失败
        }
      });
    });
  },

  // 数据库查询一类站点
  findServStations: function(type) {
    const db = this.getDB();
    return new Promise((resolve, reject) => {
      db.collection(type).get({
        success: function(res) {
          console.log('查询结果:', res.data);
          if (res.data.length > 0) {
            resolve(res.data); // 返回第一条记录
          } else {
            resolve(null); // 没有找到数据
          }
        },
        fail: function(err) {
          console.error('查询失败:', err);
          reject(err); // 查询失败
        }
      });
    });
  }
  },

  img: {
    defaultIcon: "/images/icons/point.png",
    cloud: "cloud://cloud1-3gbydxui8864f9aa.636c-cloud1-3gbydxui8864f9aa-1369623166",
  }
});
