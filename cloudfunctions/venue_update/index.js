const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境

const db = cloud.database();

exports.main = async (event, context) => {
    console.log(context);
    // 获取所有场馆记录
    const res = await db.collection('venue').get();
    const venues = res.data;
    // 遍历场馆数据
    for (const venue of venues) {
        // 更新数组
        const res = await db.collection('table_config').where({
            venue_id: venue._id
        }).get();
        const table_config = res.data[0].table_config;
        const all_time = res.data[0].all_time;
        const update_res = await db.collection('venue').doc(venue._id).update({
            data: {
                booktable: table_config,
                all_time: all_time
            }
        });
        console.log("update_res", update_res);
        // 删除预约记录
        const delete_res = await db.collection('venue_reservation').where({}).remove();
        console.log("delete_res", delete_res);
        // 更新基准日期
        const base_date = await getBaseDate();
        const year = base_date.split('-')[0];
        const date_res = await db.collection('time_slot').doc('timeslot_000').update({
            data: {
                date: base_date,
                year: year
            }
        })
        console.log("date_res", date_res);
    }

}

// 获取基准日期
async function getBaseDate() {
    const D = new Date();
    let day = D.getDay();
    // 保证获取到的是周日
    for (;;) {
        if (day == 0){
            break;
        }
        else {
            sleep(500);
            day = D.getDay();
        }
    }
    // 格式化返回日期
    let year = D.getFullYear();
    let month = D.getMonth() + 1;
    let date = D.getDate();
    return `${year}-${month}-${date}`;
}

// Promise封装sleep
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }