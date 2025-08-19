// CloudBase 封装（与原生版保持一致接口）

const ENV_ID = 'cloud1-3gbydxui8864f9aa' // TODO: 替换为你的环境 ID

const app = (window as any).cloudbase.init({ env: ENV_ID })
const auth = app.auth({ persistence: 'local' })
const db = app.database()

export function getDb() { return db }


// 查询集合
export async function getCollection(collection: string) {
    const res = await db.collection(collection).get()
    return res.data
}

// 查询元素（条件）
// where：查询条件 { A: B, C: D }
export async function queryElements(collection: string, where: any) {
    const res = await db.collection(collection).where(where).get();
    console.log("queryElements res:", res);
    return res.data;
}

// 更新元素（id）
// data：更新数据 { A: B, C: D }
export async function updateElement(collection: string, id: string, data: any) {
    const res = await db.collection(collection).doc(id).update(data);
    return res.data;
}

// 删除元素（条件）
export async function deleteElement(collection: string, where: any) {
    const res = await db.collection(collection).where(where).remove();
    return res.data;
}

// 增加元素
// data：增加数据 { A: B, C: D }
export async function addElement(collection: string, data: any) {
    const res = await db.collection(collection).add(data);
    return res.data;
}
