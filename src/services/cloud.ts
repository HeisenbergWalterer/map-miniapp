// CloudBase 封装（与原生版保持一致接口）

const ENV_ID = 'cloud1-3gbydxui8864f9aa' // TODO: 替换为你的环境 ID

const app = (window as any).cloudbase.init({ env: ENV_ID })
const auth = app.auth({ persistence: 'local' })
const db = app.database()

export async function signInWithUsernameAndPassword(username: string, password: string) {
  if (!username || !password) 
    throw new Error('请输入用户名和密码')
  console.log('使用 auth.signIn 方法登录')
  return auth.signIn({ username, password })
}

export async function signOut() { return auth.signOut() }
export async function ensureLogin() { const s = await auth.getLoginState(); if (!s) throw new Error('未登录'); return s }

export async function queryCollection(params: { collection: string, pageNo: number, pageSize: number, keyword?: string, typeFilter?: string }) {
  const { collection, pageNo, pageSize, keyword, typeFilter } = params
  await ensureLogin()
  
  // 特殊处理 sites 集合（虚拟集合，查询多个实际集合）
  if (collection === 'sites') {
    return await querySitesCollection({ pageNo, pageSize, keyword, typeFilter })
  }
  
  const where: any = {}
  if (keyword) {
    const reg = db.RegExp({ regexp: keyword, options: 'i' })
    where['$or'] = [{ name: reg }, { phone: reg }, { address: reg }]
  }
  console.log("where:", where);
  const skip = (pageNo - 1) * pageSize
  const countRes = await db.collection(collection).where(where).count()
  const total = countRes?.total || 0
  const res = await db.collection(collection).where(where).orderBy('name', 'asc').skip(skip).limit(pageSize).get()
  return { list: res.data || [], total }
}

// 新增：查询所有点位集合的函数
export async function querySitesCollection(params: { pageNo: number, pageSize: number, keyword?: string, typeFilter?: string }) {
  const { pageNo, pageSize, keyword, typeFilter } = params
  await ensureLogin()
  
  const siteCollections = ['toilet', 'warm', 'sinopec', 'partner', 'relay']
  const collectionsToQuery = typeFilter ? [typeFilter] : siteCollections
  
  // 构建查询条件
  const where: any = {}
  if (keyword) {
    const reg = db.RegExp({ regexp: keyword, options: 'i' })
    where['$or'] = [{ name: reg }, { address: reg }, { serviceContent: reg }]
  }
  
  // 并行查询所有集合
  const queryPromises = collectionsToQuery.map(async (collectionName) => {
    try {
      const res = await db.collection(collectionName).where(where).get()
      return (res.data || []).map((item: any) => ({
        ...item,
        _collection: collectionName, // 标记来源集合
        type: collectionName // 确保type字段正确
      }))
    } catch (error) {
      return []
    }
  })
  
  const results = await Promise.all(queryPromises)
  const allData = results.flat().sort((a, b) => (a.name || '').localeCompare(b.name || ''))
  
  // 分页处理
  const total = allData.length
  const skip = (pageNo - 1) * pageSize
  const list = allData.slice(skip, skip + pageSize)
  
  return { list, total }
}

export async function updateDoc(collection: string, id: string, data: any) {
  await ensureLogin()
  
  // 清理数据，移除不应该更新的字段
  const updateData = { ...data }
  delete updateData._id
  delete updateData._collection
  delete updateData._openid
  
  const result = await db.collection(collection).doc(id).update(updateData)
  if (!result.updated || result.updated === 0) {
    throw new Error('未更新任何数据')
  }
  
  return result
}

export async function createDoc(collection: string, data: any) {
  await ensureLogin()
  
  // 对于 sites 虚拟集合，需要根据数据中的 type 字段确定实际集合
  if (collection === 'sites') {
    const actualCollection = data.type
    if (!actualCollection) throw new Error('创建点位时必须指定type字段')
    delete data._collection // 移除标记字段
    const res = await db.collection(actualCollection).add(data)
    const insertedId = res?.id || res?._id || res?.insertedId || (Array.isArray(res?.ids) ? res.ids[0] : undefined) || (Array.isArray(res?.insertedIds) ? res.insertedIds[0] : undefined)
    if (insertedId) return insertedId
    const fallbackId = `${actualCollection}_${Date.now()}_${Math.random().toString(36).slice(2,8)}`
    await db.collection(actualCollection).doc(fallbackId).set(data)
    return fallbackId
  }
  
  const res = await db.collection(collection).add(data)
  const insertedId = res?.id || res?._id || res?.insertedId || (Array.isArray(res?.ids) ? res.ids[0] : undefined) || (Array.isArray(res?.insertedIds) ? res.insertedIds[0] : undefined)
  if (insertedId) return insertedId
  const fallbackId = `${collection}_${Date.now()}_${Math.random().toString(36).slice(2,8)}`
  await db.collection(collection).doc(fallbackId).set(data)
  return fallbackId
}

export async function deleteDoc(collection: string, id: string, itemData?: any) {
  await ensureLogin()
  
  // 对于 sites 虚拟集合，需要根据 itemData 中的 _collection 或 type 字段确定实际集合
  if (collection === 'sites' && itemData) {
    const actualCollection = itemData._collection || itemData.type
    if (!actualCollection) throw new Error('无法确定要删除的集合')
    const { deleted } = await db.collection(actualCollection).doc(id).remove()
    if (!deleted) throw new Error('未删除任何数据')
    return
  }
  
  const { deleted } = await db.collection(collection).doc(id).remove()
  if (!deleted) throw new Error('未删除任何数据')
}



export function getDb() { return db }
export function getAuth() { return auth }




