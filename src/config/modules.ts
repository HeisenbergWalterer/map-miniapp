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
}

export const defaultModule = 'contact'




