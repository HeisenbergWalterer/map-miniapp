// CloudBase 封装（与原生版保持一致接口）

const ENV_ID = 'cloud1-3gbydxui8864f9aa' // TODO: 替换为你的环境 ID

const app = (window as any).cloudbase.init({ env: ENV_ID })
const auth = app.auth({ persistence: 'local' })
const db = app.database()

export async function signInWithUsernameAndPassword(username: string, password: string) {
  if (!username || !password) throw new Error('请输入用户名和密码')
  if (typeof auth.signIn === 'function') {
    return auth.signIn({ username, password })
  }
  if (typeof auth.signInWithUsernameAndPassword === 'function') {
    return auth.signInWithUsernameAndPassword(username, password)
  }
  if (typeof auth.signInWithEmailAndPassword === 'function') {
    return auth.signInWithEmailAndPassword(username, password)
  }
  if (typeof auth.signInWithPassword === 'function') {
    return auth.signInWithPassword({ username, password })
  }
  throw new Error('当前 SDK 不支持用户名密码登录')
}

export async function signOut() { return auth.signOut() }
export async function ensureLogin() { const s = await auth.getLoginState(); if (!s) throw new Error('未登录'); return s }

export async function queryCollection(params: { collection: string, pageNo: number, pageSize: number, keyword?: string }) {
  const { collection, pageNo, pageSize, keyword } = params
  await ensureLogin()
  const where: any = {}
  if (keyword) {
    const reg = db.RegExp({ regexp: keyword, options: 'i' })
    where['$or'] = [{ name: reg }, { phone: reg }, { address: reg }]
  }
  const skip = (pageNo - 1) * pageSize
  const countRes = await db.collection(collection).where(where).count()
  const total = countRes?.total || 0
  const res = await db.collection(collection).where(where).orderBy('name', 'asc').skip(skip).limit(pageSize).get()
  return { list: res.data || [], total }
}

export async function updateDoc(collection: string, id: string, data: any) {
  await ensureLogin()
  const { updated } = await db.collection(collection).doc(id).update(data)
  if (!updated) throw new Error('未更新任何数据')
}

export async function createDoc(collection: string, data: any) {
  await ensureLogin()
  const res = await db.collection(collection).add(data)
  const insertedId = res?.id || res?._id || res?.insertedId || (Array.isArray(res?.ids) ? res.ids[0] : undefined) || (Array.isArray(res?.insertedIds) ? res.insertedIds[0] : undefined)
  if (insertedId) return insertedId
  const fallbackId = `${collection}_${Date.now()}_${Math.random().toString(36).slice(2,8)}`
  await db.collection(collection).doc(fallbackId).set(data)
  return fallbackId
}

export async function deleteDoc(collection: string, id: string) {
  await ensureLogin()
  const { deleted } = await db.collection(collection).doc(id).remove()
  if (!deleted) throw new Error('未删除任何数据')
}

export function getDb() { return db }
export function getAuth() { return auth }




