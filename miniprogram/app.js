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
  // 说明：封装数据库读写与业务服务，便于页面复用与统一维护
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
  // 围绕“活动 activity”与“报名 activity_registration”进行读写、查重与余位维护
  
  // 获取活动列表（列表页展示）
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

  // 批量获取活动（按 _id 列表）
  getActivitiesByIds: function(activityIds) {
    const db = this.getDB();
    const _ = db.command;
    return new Promise((resolve, reject) => {
      if (!Array.isArray(activityIds) || activityIds.length === 0) {
        resolve([]);
        return;
      }
      db.collection('activity').where({ _id: _.in(activityIds) }).get({
        success: function(res){ resolve(res.data || []); },
        fail: function(err){ console.error('批量获取活动失败:', err); reject(err); }
      });
    });
  },

  // 根据业务字段 id 获取单个活动信息（若前端仅传了业务 id）
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

  // 提交报名记录（活动报名）
  // 目标集合：activity_registration，openid 使用系统字段 _openid，不重复冗余
  submitActivityRegistration: function(registrationData) {
    const db = this.getDB();
    const payload = {
      activity_id: registrationData.activity_id,
      center_id: registrationData.center_id || '',
      name: registrationData.name || '',
      phone: registrationData.phone || '',
      party_size: registrationData.party_size || 1,
      status: registrationData.status || 'registered',
      createdAt: new Date(),
    };
    return db.collection('activity_registration').add({ data: payload })
      .then(res => { console.log('活动报名成功:', res); return res; });
  },

  // 检查用户是否已报名某活动（基于 _openid + activity_id，且 status=registered）
  checkActivityRegistration: function(activityId, openid) {
    const db = this.getDB();
    const where = { activity_id: activityId, _openid: openid, status: 'registered' };
    return db.collection('activity_registration').where(where).get().then(res => {
      console.log('检查活动报名状态:', res.data);
      return (res.data && res.data.length > 0) ? res.data : null;
    });
  },

  // 获取活动的报名人数统计（基于 activity_registration）
  getActivityRegistrationCount: function(activityId) {
    const db = this.getDB();
    return new Promise((resolve, reject) => {
      db.collection('activity_registration').where({
        activity_id: activityId,
        status: 'registered'
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

  // 覆盖式更新活动余位（支持活动文档 _id 或业务 id）
  // 并发场景建议优先使用 incrementActivitySlots
  updateActivitySlots: function(activityIdOrDocId, newSlotsCount) {
    const db = this.getDB();
    return new Promise((resolve, reject) => {
      const collection = db.collection('activity');
      const updater = {
        remainingSlots: newSlotsCount,
        updatedAt: new Date()
      };

      // 若传入看起来像文档 _id（字符串），优先按 doc 更新
      if (typeof activityIdOrDocId === 'string') {
        collection.doc(activityIdOrDocId).update({
          data: updater,
          success: function(res) {
            console.log('按 _id 更新活动余位成功:', res);
            resolve(res);
          },
          fail: function(err) {
            console.warn('按 _id 更新失败，尝试按 id 字段更新:', err);
            // 兜底：尝试按 id 字段更新
            collection.where({ id: activityIdOrDocId }).update({
              data: updater,
              success: function(res) {
                console.log('按 id 字段更新活动余位成功:', res);
                resolve(res);
              },
              fail: function(err2) {
                console.error('更新活动余位失败:', err2);
                reject(err2);
              }
            });
          }
        });
      } else {
        // 数字 id
        collection.where({ id: activityIdOrDocId }).update({
          data: updater,
          success: function(res) {
            console.log('按 id 字段更新活动余位成功:', res);
            resolve(res);
          },
          fail: function(err) {
            console.error('更新活动余位失败:', err);
            reject(err);
          }
        });
      }
    });
  },

  // 余位增量更新（使用 inc 原子操作，适合并发扣减/恢复）
  incrementActivitySlots: function(activityIdOrDocId, delta) {
    const db = this.getDB();
    const _ = db.command;
    return new Promise((resolve, reject) => {
      const collection = db.collection('activity');
      const updater = {
        remainingSlots: _.inc(delta),
        updatedAt: new Date()
      };
      if (typeof activityIdOrDocId === 'string') {
        collection.doc(activityIdOrDocId).update({
          data: updater,
          success: resolve,
          fail: function(err){
            console.warn('按 _id inc 失败，尝试按 id 字段：', err);
            collection.where({ id: activityIdOrDocId }).update({ data: updater, success: resolve, fail: reject });
          }
        });
      } else {
        collection.where({ id: activityIdOrDocId }).update({ data: updater, success: resolve, fail: reject });
      }
    });
  },

  // 获取当前用户的活动报名记录（倒序返回）
  getMyActivityRegistrations: function(openid) {
    const db = this.getDB();
    return new Promise((resolve, reject) => {
      db.collection('activity_registration')
        .where({ _openid: openid })
        .orderBy('createdAt', 'desc')
        .get({
          success: function(res){ resolve(res.data || []); },
          fail: function(err){ console.error('获取我的报名失败:', err); reject(err); }
        });
    });
  },

  // 取消活动报名（更新记录为 cancelled，并恢复活动余位 +1）
  cancelActivityRegistration: function(registrationId, activityIdOrDocId) {
    const db = this.getDB();
    return new Promise((resolve, reject) => {
      db.collection('activity_registration').doc(registrationId).update({
        data: { status: 'cancelled', cancelledAt: new Date() },
        success: async (res) => {
          try {
            await this.incrementActivitySlots(activityIdOrDocId, 1);
            resolve(res);
          } catch (e) {
            reject(e);
          }
        },
        fail: function(err){ console.error('取消报名失败:', err); reject(err); }
      });
    });
  },
  // 旧版通用报名（未使用，保留以兼容历史调用）
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

  // 旧版通用报名记录（未使用，保留以兼容历史调用）
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
