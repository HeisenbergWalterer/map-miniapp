# 文档数据库集合存储格式说明

## `center_example.json`

### `center` 集合

| 键名 | 描述 |
|------|------|
| `_id` | 中心的唯一标识符 |
| `id` | 中心的数字ID |
| `name` | 中心名称 |
| `address` | 中心地址 |
| `phone` | 中心联系电话 |
| `notes` | 备注信息 |

## `activity_example.json`

### `activity` 集合

| 键名 | 描述 |
|------|------|
| `_id` | 活动的唯一标识符 |
| `id` | 活动的数字ID |
| `center_id` | 关联的中心ID |
| `notes` | 备注信息 |
| `remainingSlots` | 剩余名额 |
| `status` | 活动状态（如 `active`） |
| `totalSlots` | 总名额 |
| `contact` | 活动联系人电话 |
| `dates` | 活动日期和时间 |
| `deadline` | 报名截止时间 |
| `place` | 活动地点 |
| `title` | 活动标题 |

### `activity_registration` 集合

| 键名 | 描述 |
|------|------|
| `_id` | 报名记录的唯一标识符 |
| `activity_id` | 关联的活动ID |
| `center_id` | 关联的中心ID |
| `openid` | 用户唯一标识符 |
| `status` | 报名状态（如 `registered`） |
| `name` | 报名人姓名 |
| `phone` | 报名人电话 |
| `party_size` | 报名人数 |

### `venue` 集合

| 键名 | 描述 |
|------|------|
| `_id` | 场馆的唯一标识符 |
| `id` | 场馆的数字ID |
| `center_id` | 关联的中心ID |
| `name` | 场馆名称 |
| `address` | 场馆地址 |
| `phone` | 场馆联系电话 |
| `booktable` | 预约表（二维数组） |
| `notes` | 备注信息 |

### `venue_reservation` 集合

| 键名 | 描述 |
|------|------|
| `_id` | 预约记录的唯一标识符 |
| `venue_id` | 关联的场馆ID |
| `center_id` | 关联的中心ID |
| `openid` | 用户唯一标识符 |
| `status` | 预约状态（如 `reserved`） |
| `name` | 预约人姓名 |
| `phone` | 预约人电话 |
| `party_size` | 预约人数 |
| `time_reserved` | 预约时间段 |

