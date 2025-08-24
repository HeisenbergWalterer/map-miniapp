export const modules = {
  contact: {
    key: 'contact',
    title: '联系信息',
    collection: 'contact',
    searchFields: ['name', 'phone', 'address'],
    fallbackFields: ['name','phone','address','latitude','longitude','photoUrl','serviceContent','serviceTime'],
  },
  emergency: {
    key: 'emergency',
    title: '紧急服务',
    collection: 'emergency',
    searchFields: ['name', 'phone', 'address'],
    fallbackFields: ['name','phone','address'],
  },
  sites: {
    key: 'sites',
    title: '点位修改',
    collection: 'sites', // 这将是一个虚拟集合名，实际查询多个集合
    searchFields: ['name', 'address', 'serviceContent'],
    fallbackFields: ['id','name','address','latitude','longitude','type','photoUrl','serviceContent','serviceTime'],
    // 新增：支持的点位类型配置
    siteTypes: {
      'toilet': { name: '公共厕所', collection: 'toilet' },
      'warm': { name: '暖心服务站', collection: 'warm' },
      'sinopec': { name: '爱心驿站', collection: 'sinopec' },
      'partner': { name: '合作商户', collection: 'partner' },
      'relay': { name: '接力站', collection: 'relay' }
    }
  },
  reservations: {
    key: 'reservations',
    title: '预约管理',
    collection: 'reservations',
    searchFields: ['name', 'phone', 'address'],
    fallbackFields: ['id','name','phone'],
  },
  feedback: {
    key: 'feedback',
    title: '用户反馈',
    collection: 'feedback',
    searchFields: ['userName', 'phone', 'content', 'type'],
    fallbackFields: ['userName', 'phone', 'content', 'type', 'createTime', 'status'],
  }
}

export const defaultModule = 'contact'




