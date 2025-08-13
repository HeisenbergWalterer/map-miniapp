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
  

  img: {
    defaultIcon: "/images/icons/point.png",
    cloud: "cloud://cloud1-3gbydxui8864f9aa.636c-cloud1-3gbydxui8864f9aa-1369623166",
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
  },

  // -----数据库操作-----

  // 获取集合
  getCollection: function(cll) {
    const db = this.getDB();
    return db.collection(cll).get().then(res => res.data);
  },

  // 名称查找
  getElementByName: function(cll, name) {
    const db = this.getDB();
    return db.collection(cll).where({
      name: name
    }).get();
  },

  // id查找
  getElementByID: function(cll, id) {
    const db = this.getDB();
    return db.collection(cll).where({
      id: id
    }).get();
  },

  // 添加元素
  addElement: function(cll, data) {
    const db = this.getDB();
    return db.collection(cll).add({
      data: data
    });
  },

  // -----活动报名相关数据库操作-----
  
  // 获取活动列表
  getActivities: function() {
    const db = this.getDB();
    return new Promise((resolve, reject) => {
      db.collection('activity').get({
        success: function(res) {
          console.log('获取活动列表:', res.data);
          resolve(res.data);
        },
        fail: function(err) {
          console.error('获取活动列表失败:', err);
          reject(err);
        }
      });
    });
  },

  // 根据ID获取单个活动信息
  getActivityById: function(activityId) {
    const db = this.getDB();
    return new Promise((resolve, reject) => {
      db.collection('activity').where({
        id: activityId
      }).get({
        success: function(res) {
          console.log('获取活动详情:', res.data);
          if (res.data.length > 0) {
            resolve(res.data[0]);
          } else {
            resolve(null);
          }
        },
        fail: function(err) {
          console.error('获取活动详情失败:', err);
          reject(err);
        }
      });
    });
  },

  // 提交报名记录
  submitRegistration: function(registrationData) {
    const db = this.getDB();
    return new Promise((resolve, reject) => {
      // 报名数据结构
      const registration = {
        activityId: registrationData.activityId,
        activityTitle: registrationData.activityTitle,
        userId: registrationData.userId || '', // 用户openid
        userInfo: registrationData.userInfo || {}, // 用户信息
        selectedDate: registrationData.selectedDate,
        selectedTimeSlot: registrationData.selectedTimeSlot,
        registrationTime: new Date(), // 报名时间
        status: 'active' // 报名状态: active, cancelled
      };

      db.collection('registrations').add({
        data: registration,
        success: function(res) {
          console.log('报名成功:', res);
          resolve(res);
        },
        fail: function(err) {
          console.error('报名失败:', err);
          reject(err);
        }
      });
    });
  },

  // 检查用户是否已报名某活动
  checkUserRegistration: function(activityId, userId) {
    const db = this.getDB();
    return new Promise((resolve, reject) => {
      db.collection('registrations').where({
        activityId: activityId,
        userId: userId,
        status: 'active'
      }).get({
        success: function(res) {
          console.log('检查报名状态:', res.data);
          resolve(res.data.length > 0 ? res.data : null);
        },
        fail: function(err) {
          console.error('检查报名状态失败:', err);
          reject(err);
        }
      });
    });
  },

  // 获取活动的报名人数统计
  getActivityRegistrationCount: function(activityId) {
    const db = this.getDB();
    return new Promise((resolve, reject) => {
      db.collection('registrations').where({
        activityId: activityId,
        status: 'active'
      }).count({
        success: function(res) {
          console.log('活动报名人数:', res.total);
          resolve(res.total);
        },
        fail: function(err) {
          console.error('获取报名人数失败:', err);
          reject(err);
        }
      });
    });
  },

  // 更新活动余位信息
  updateActivitySlots: function(activityId, newSlotsCount) {
    const db = this.getDB();
    return new Promise((resolve, reject) => {
      db.collection('activity').where({
        id: activityId
      }).update({
        data: {
          remainingSlots: newSlotsCount,
          updatedAt: new Date()
        },
        success: function(res) {
          console.log('更新活动余位成功:', res);
          resolve(res);
        },
        fail: function(err) {
          console.error('更新活动余位失败:', err);
          reject(err);
        }
      });
    });
  },

  // 取消报名
  cancelRegistration: function(registrationId) {
    const db = this.getDB();
    return new Promise((resolve, reject) => {
      db.collection('registrations').doc(registrationId).update({
        data: {
          status: 'cancelled',
          cancelledAt: new Date()
        },
        success: function(res) {
          console.log('取消报名成功:', res);
          resolve(res);
        },
        fail: function(err) {
          console.error('取消报名失败:', err);
          reject(err);
        }
      });
    });
  },

  // 获取用户的报名记录
  getUserRegistrations: function(userId) {
    const db = this.getDB();
    return new Promise((resolve, reject) => {
      db.collection('registrations').where({
        userId: userId,
        status: 'active'
      }).orderBy('registrationTime', 'desc').get({
        success: function(res) {
          console.log('用户报名记录:', res.data);
          resolve(res.data);
        },
        fail: function(err) {
          console.error('获取用户报名记录失败:', err);
          reject(err);
        }
      });
    });
  }
  }
});
