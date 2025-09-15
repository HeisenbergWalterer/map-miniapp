# 部署指南（本地 CLI）

本文档说明：当你修改代码后，如何将最新构建再次发布到 CloudBase 静态网站托管。

## 我是否需要再次部署？
- 需要。静态托管不会自动构建或同步你的本地代码。每次代码变更后，都需要重新构建并执行一次部署，线上站点才会更新。

## 前置条件
- 已创建 CloudBase 环境，并记下环境 ID（如：`cloud1-xxxxxxxx`）。
- 本仓库已包含 CloudBase Framework 配置：`cloudbaserc.json`（静态网站插件会发布 `dist/`）。
- 已配置前端环境变量（构建时读取）：
  - 项目根目录 `.env` 文件中设置 `VITE_CLOUD_ENV_ID=<你的环境ID>`。
- 已安装并可使用 CloudBase CLI（推荐本地/临时执行，无需全局安装）：
  - `npx tcb -v` 可输出版本表示可用。
  - 首次操作需登录：`npx tcb login`（浏览器授权）。

## 快速发布流程（每次改动后）
1) 安装依赖（如有变更）
```bash
npm ci
```
2) 构建产物
```bash
npm run build
```
3) 部署到静态网站托管（二选一）
- 交互选择环境：
```bash
npx tcb framework deploy
```
- 指定环境 ID（推荐，避免交互）：
```bash
npx tcb framework deploy -e "$VITE_CLOUD_ENV_ID"
# 或直接写死：npx tcb framework deploy -e cloud1-xxxxxxxx
```

提示：本项目 `package.json` 中也提供了脚本：
```bash
npm run deploy:tcb            # 等价于 tcb framework deploy
# 你也可以自定义一个："deploy:prod": "tcb framework deploy -e cloud1-xxxxxxxx"
```

## 上线验证
- 打开 CloudBase 控制台 → 静态网站托管，使用“默认域名”或已绑定的自定义域名访问站点。
- 本项目使用 hash 路由，无需额外的 404 回退配置。
- 如果页面没有立即更新，尝试强制刷新（Cmd+Shift+R）或在浏览器 DevTools 勾选“Disable cache”。

## 常见问题排查
- 未识别到有效的环境 ID：
  - 使用 `-e <envId>` 明确指定，或确保 `cloudbaserc.json` 有效。
- 未登录或登录过期：
  - 执行 `npx tcb login` 重新授权。
- 接口 403 或数据读写失败：
  - 检查数据库集合权限规则；开发期可临时放宽，生产需收紧。
- 账号无法登录后台：
  - 确认“登录授权”里已开启“用户名+密码”，并在控制台创建了该账号。
- 部署后内容没变：
  - 很可能是缓存。尝试浏览器强刷，或在 CloudBase 控制台刷新 CDN 缓存后再试。

## 回滚方案（简易）
- 回到上一版本代码（git checkout 上一个 tag/commit），重新构建并部署：
```bash
git checkout <previous_commit_or_tag>
npm ci
npm run build
npx tcb framework deploy -e "<envId>"
```
- 若需要更完善的版本化与回滚，可通过“保留历史构建产物 + 版本标记”的方式自行管理。

## 附：不全局安装的两种用法
- 纯 npx（推荐）：
```bash
npx tcb login
npx tcb framework deploy -e "<envId>"
```
- 本地 dev 依赖方式（本仓库已添加 @cloudbase/cli 到 devDependencies）：
```bash
npm run deploy:tcb
# 或 npx tcb framework deploy -e "<envId>"
```
