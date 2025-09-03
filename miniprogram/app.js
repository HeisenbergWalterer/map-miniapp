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

  // ---------------使用图片/云存储---------------
  img: {
    defaultIcon: "/images/icons/point.png",
    cloud: "cloud://cloud1-3gbydxui8864f9aa.636c-cloud1-3gbydxui8864f9aa-1369623166",
  },

  // ---------------使用时间信息---------------
  time: {
    base_id: 'timeslot_000',
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
      return db.collection(cll).get().then(res => {return res.data});
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
        _id: id
      }).get();
    },

    // 条件查询
    queryElement: function(cll, params) {
      const db = this.getDB();
      return db.collection(cll).where(params).get();
    },

    // 添加元素
    addElement: function(cll, data) {
      const db = this.getDB();
      return db.collection(cll).add({
        data: data
      });
    },

    // 更新元素（id）
    updateElementByID: function(cll, id, data) {
      const db = this.getDB();
      return db.collection(cll).doc(id).update({
        data: data,
        success: function(res) {
          console.log("updateElementByID success", res);
        },
        fail: function(err) {
          console.error("updateElementByID fail", err);
        }
      });
    },

    // 更新元素（name）
    updateElementByName: function(cll, name, data) {
      const db = this.getDB();
      return db.collection(cll).where({
        name: name
      }).update({
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

    // 获取当前用户的活动报名记录（倒序返回，只显示有效记录）
    getMyActivityRegistrations: function(openid) {
      const db = this.getDB();
      return new Promise((resolve, reject) => {
        db.collection('activity_registration')
          .where({ _openid: openid, status: 'registered' })
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

    // -----场馆预约相关数据库操作-----
    // 获取当前用户的场馆预约记录（倒序返回）
    // 兼容历史数据：优先使用 _openid，如果没有则使用 open_id
    getMyVenueReservations: function(openid) {
      const db = this.getDB();
      const _ = db.command;
      return new Promise((resolve, reject) => {
        db.collection('venue_reservation')
          .where(_.or([
            { _openid: openid, status: 'reserved' },
            { open_id: openid, status: 'reserved' }
          ]))
          .orderBy('_createTime', 'desc')
          .get({
            success: function(res){ 
              console.log('获取场馆预约记录:', res.data);
              resolve(res.data || []); 
            },
            fail: function(err){ 
              console.error('获取我的场馆预约失败:', err); 
              // 如果复杂查询失败，尝试简单查询
              db.collection('venue_reservation')
                .where({ status: 'reserved' })
                .get({
                  success: function(res2) {
                    // 在前端过滤匹配的记录
                    const filtered = (res2.data || []).filter(record => 
                      record._openid === openid || record.open_id === openid
                    );
                    resolve(filtered);
                  },
                  fail: reject
                });
            }
          });
      });
    },

    // 批量获取场馆信息（按 _id 列表）
    getVenuesByIds: function(venueIds) {
      const db = this.getDB();
      const _ = db.command;
      return new Promise((resolve, reject) => {
        if (!Array.isArray(venueIds) || venueIds.length === 0) {
          resolve([]);
          return;
        }
        db.collection('venue').where({ _id: _.in(venueIds) }).get({
          success: function(res){ resolve(res.data || []); },
          fail: function(err){ console.error('批量获取场馆失败:', err); reject(err); }
        });
      });
    },

    // 取消场馆预约（更新状态为cancelled并恢复booktable时间段）
    cancelVenueReservation: function(reservationId) {
      const db = this.getDB();
      const self = this; // 保存this引用
      return new Promise((resolve, reject) => {
        // 首先获取预约记录详情
        db.collection('venue_reservation').doc(reservationId).get({
          success: (getRes) => {
            if (!getRes.data) {
              reject(new Error('预约记录不存在'));
              return;
            }
            
            const reservation = getRes.data;
            const { venue_id, time_reserved } = reservation;
            
            console.log('取消预约 - 预约记录:', reservation);
            
            // 更新预约状态为cancelled
            db.collection('venue_reservation').doc(reservationId).update({
              data: { status: 'cancelled', cancelledAt: new Date() },
              success: (updateRes) => {
                console.log('预约状态更新成功:', updateRes);
                
                // 如果有预约时间段，需要恢复venue的booktable
                if (time_reserved && time_reserved.length > 0) {
                  self.restoreVenueTimeSlots(venue_id, time_reserved).then(() => {
                    console.log('场馆时间段恢复成功');
                    resolve(updateRes);
                  }).catch((restoreErr) => {
                    console.error('恢复场馆时间段失败:', restoreErr);
                    // 即使恢复失败，预约取消已成功，仍然resolve
                    resolve(updateRes);
                  });
                } else {
                  resolve(updateRes);
                }
              },
              fail: (updateErr) => {
                console.error('取消场馆预约失败:', updateErr);
                reject(updateErr);
              }
            });
          },
          fail: (getErr) => {
            console.error('获取预约记录失败:', getErr);
            reject(getErr);
          }
        });
      });
    },

    // 恢复场馆时间段可用性
    restoreVenueTimeSlots: function(venueId, timeReserved) {
      const db = this.getDB();
      return new Promise((resolve, reject) => {
        // 获取场馆当前的booktable
        db.collection('venue').doc(venueId).get({
          success: (getRes) => {
            if (!getRes.data || !getRes.data.booktable) {
              reject(new Error('场馆数据不存在'));
              return;
            }
            
            const venue = getRes.data;
            const booktable = JSON.parse(JSON.stringify(venue.booktable)); // 深拷贝
            
            console.log('恢复时间段 - 原始booktable:', booktable);
            console.log('恢复时间段 - timeReserved:', timeReserved);
            
            // 恢复所有预约的时间段为可用（设为1）
            timeReserved.forEach(([day, hour]) => {
              if (booktable[day] && booktable[day][hour] !== undefined) {
                const oldValue = booktable[day][hour];
                booktable[day][hour] = 1; // 1表示可预约
                console.log(`恢复时间段 [第${day}天, 第${hour}时段] 从 ${oldValue} 改为 1`);
              } else {
                console.warn(`时间段 [${day}, ${hour}] 超出booktable范围`);
              }
            });
            
            console.log('恢复时间段 - 更新后booktable:', booktable);
            
            // 更新场馆的booktable
            db.collection('venue').doc(venueId).update({
              data: { booktable: booktable },
              success: (updateRes) => {
                console.log('场馆时间段恢复成功:', updateRes);
                resolve(updateRes);
              },
              fail: (updateErr) => {
                console.error('更新场馆时间段失败:', updateErr);
                reject(updateErr);
              }
            });
          },
          fail: (getErr) => {
            console.error('获取场馆数据失败:', getErr);
            reject(getErr);
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
    },

    // -----收藏功能相关数据库操作-----
    
    // 添加收藏
    addFavorite: function(favoriteData) {
      const db = this.getDB();
      const payload = {
        station_id: favoriteData.station_id,
        station_type: favoriteData.station_type,
        createdAt: new Date()
      };
      return db.collection('favorites').add({ data: payload })
        .then(res => { console.log('添加收藏成功:', res); return res; });
    },

    // 检查是否已收藏
    checkFavorite: function(stationId, openid) {
      const db = this.getDB();
      const where = { station_id: stationId, _openid: openid };
      return db.collection('favorites').where(where).get().then(res => {
        console.log('检查收藏状态:', res.data);
        return (res.data && res.data.length > 0) ? res.data[0] : null;
      });
    },

    // 获取用户的所有收藏
    getUserFavorites: function(openid) {
      const db = this.getDB();
      return new Promise((resolve, reject) => {
        db.collection('favorites')
          .where({ _openid: openid })
          .orderBy('createdAt', 'desc')
          .get({
            success: function(res){ 
              console.log('获取用户收藏:', res.data);
              resolve(res.data || []); 
            },
            fail: function(err){ 
              console.error('获取用户收藏失败:', err); 
              reject(err); 
            }
          });
      });
    },

    // 获取收藏的完整信息（包含站点详情）
    getUserFavoritesWithDetails: async function(openid) {
      try {
        // 1. 获取用户的收藏列表
        const favorites = await this.getUserFavorites(openid);
        
        // 2. 为每个收藏获取完整的站点信息
        const favoritesWithDetails = await Promise.all(
          favorites.map(async (favorite) => {
            try {
              // 根据站点类型和ID获取完整信息
              const stationInfo = await this.findStationByID(
                favorite.station_type, 
                favorite.station_id
              );
              
              if (stationInfo) {
                const result = {
                  ...favorite,
                  station_name: stationInfo.name,
                  station_address: stationInfo.address,
                  station_latitude: stationInfo.latitude,
                  station_longitude: stationInfo.longitude,
                  station_photoUrl: stationInfo.photoUrl || '',
                  station_serviceTime: stationInfo.serviceTime || '',
                  station_serviceContent: stationInfo.serviceContent || '',
                  typeName: this.getTypeName(favorite.station_type)
                };
                return result;
              } else {
                // 如果站点信息不存在，返回基本信息
                return {
                  ...favorite,
                  station_name: '站点信息已删除',
                  station_address: '',
                  station_latitude: 0,
                  station_longitude: 0,
                  station_photoUrl: '',
                  station_serviceTime: '',
                  station_serviceContent: '',
                  typeName: this.getTypeName(favorite.station_type)
                };
              }
            } catch (error) {
              console.error('获取站点详情失败:', error);
              return {
                ...favorite,
                station_name: '获取信息失败',
                station_address: '',
                station_latitude: 0,
                station_longitude: 0,
                station_photoUrl: '',
                station_serviceTime: '',
                station_serviceContent: '',
                typeName: this.getTypeName(favorite.station_type)
              };
            }
          })
        );
        
        return favoritesWithDetails;
      } catch (error) {
        console.error('获取收藏详情失败:', error);
        throw error;
      }
    },

    // 获取类型名称（辅助方法）
    getTypeName: function(type) {
      const typeMap = {
        'toilet': '公共厕所',
        'warm': '暖心服务站',
        'sinopec': '爱心驿站',
        'partner': '合作商户',
        'relay': '接力站'
      };
      return typeMap[type] || '未知类型';
    },

    // 取消收藏
    removeFavorite: function(favoriteId) {
      const db = this.getDB();
      return new Promise((resolve, reject) => {
        db.collection('favorites').doc(favoriteId).remove({
          success: function(res) {
            console.log('取消收藏成功:', res);
            resolve(res);
          },
          fail: function(err) {
            console.error('取消收藏失败:', err);
            reject(err);
          }
        });
      });
    }
  }
});
