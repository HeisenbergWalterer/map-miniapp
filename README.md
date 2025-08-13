# Web 管理系统（Vue 版）

基于 Vue 3 + Vite 重构的“安新联系”管理后台，等价迁移自原生版，包含登录、模块化导航、动态表格、搜索、分页、新建/编辑/删除，接入 CloudBase JS SDK，可直接部署到微信云静态网站托管。

## 使用

```bash
cd web-new
npm i
npm run dev
```
访问 `http://localhost:5173`

## 构建与部署

```bash
npm run build
```
将 `dist/` 上传到云静态网站托管。

## 配置

在 `src/services/cloud.ts` 设置环境 ID：
```ts
const ENV_ID = 'cloud1-3gbydxui8864f9aa'
```
确保控制台已开启“用户名+密码”登录，并在数据库为相关集合配置合适的权限。

## 目录结构
```
web-new/
├── index.html
├── package.json
├── vite.config.ts
└── src/
    ├── main.ts
    ├── styles.css
    ├── App.vue
    ├── router/
    │   └── index.ts
    ├── config/
    │   └── modules.ts
    ├── services/
    │   └── cloud.ts
    └── pages/
        ├── Login.vue
        └── ModulePage.vue
```

## 等价性说明
- 模块定义与原生版一致（`contact`、`emergency`）。
- 表格与弹窗根据数据动态渲染字段（忽略 `_id/_openid/remark`）。
- 搜索匹配 `name/phone/address`。
- 新建在无数据时使用模块的 `fallbackFields`。
- 新建/编辑/删除与原生版 API 行为一致。


