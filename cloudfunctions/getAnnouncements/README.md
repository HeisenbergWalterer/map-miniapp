# getAnnouncements 云函数

## 功能描述
获取暖心公告数据的云函数，支持按状态筛选和数量限制。

## 部署步骤

1. 在微信开发者工具中，右键点击 `cloudfunctions/getAnnouncements` 文件夹
2. 选择"上传并部署：云端安装依赖"
3. 等待部署完成

## 使用方法

### 调用方式
```javascript
wx.cloud.callFunction({
  name: 'getAnnouncements',
  data: {
    status: 'active',  // 可选：公告状态筛选
    limit: 10          // 可选：返回数量限制，默认10
  }
})
```

### 参数说明
- `status`: 公告状态，可选值：'active'（激活）、'inactive'（停用）
- `limit`: 返回数量限制，默认10条

### 返回格式
```javascript
{
  success: true,
  data: [
    {
      _id: "announcement_001",
      title: "公告标题",
      type: "article", // 或 "pdf"
      link: "链接地址",
      status: "active",
      created_at: "2025-01-20T10:00:00.000Z",
      updated_at: "2025-01-20T10:00:00.000Z",
      created_by: "admin_001",
      view_count: 0
    }
  ],
  total: 1
}
```

## 注意事项
1. 确保云开发环境已正确配置
2. 数据库中存在 `announcements` 集合
3. 集合中的文档包含必要的字段
