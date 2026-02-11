# Supabase attendance表字段设置指南

## 步骤1：修改表名
如果您已经创建了名为`user-attendance`的表，建议将其重命名为`attendance`，这样与我们的代码保持一致：

1. 在Supabase控制台中，点击 **Database** > **Tables**
2. 找到`user-attendance`表，点击右侧的 **...** 菜单
3. 选择 **Rename**
4. 输入新表名`attendance`，点击 **Save**

## 步骤2：设置字段

### 如果您需要手动添加字段，请按照以下步骤操作：

1. 在`attendance`表的详情页面，点击 **Edit table** 按钮
2. 点击 **Add column** 按钮，添加以下字段：

#### 字段1：id
- **Name**: `id`
- **Type**: `UUID`
- **Default value**: `gen_random_uuid()`
- **Constraints**: 勾选 **Primary**

#### 字段2：user_id
- **Name**: `user_id`
- **Type**: `UUID`
- **Default value**: 留空
- **Constraints**: 勾选 **Foreign key**
  - **References table**: `users`
  - **References column**: `id`
  - **On delete**: `CASCADE`

#### 字段3：date
- **Name**: `date`
- **Type**: `Date`
- **Default value**: 留空
- **Constraints**: 勾选 **Not null**

#### 字段4：created_at
- **Name**: `created_at`
- **Type**: `Timestamp with time zone`
- **Default value**: `now()`
- **Constraints**: 留空

3. 点击 **Save** 按钮保存表结构

## 步骤3：添加索引
1. 在`attendance`表的详情页面，点击 **Indexes** 标签页
2. 点击 **New Index** 按钮
3. 输入索引名：`idx_attendance_user_date`
4. 选择列：`user_id` 和 `date`
5. 点击 **Save** 按钮

## 步骤4：启用RLS并添加策略
1. 在`attendance`表的详情页面，点击 **Policies** 标签页
2. 点击 **Enable RLS** 按钮
3. 点击 **New Policy** 按钮，创建以下策略：

### 查看策略
- **Policy name**: `Users can view their own attendance data`
- **Allowed operation**: `SELECT`
- **Using expression**: `auth.uid() = user_id`
- **Click Save**

### 插入策略
- **Policy name**: `Users can insert their own attendance data`
- **Allowed operation**: `INSERT`
- **Check expression**: `auth.uid() = user_id`
- **Click Save**

### 删除策略
- **Policy name**: `Users can delete their own attendance data`
- **Allowed operation**: `DELETE`
- **Using expression**: `auth.uid() = user_id`
- **Click Save**

## 步骤5：验证设置
1. 完成上述操作后，刷新页面
2. 确认表结构已正确设置
3. 回到应用页面，测试签到功能

如果您在操作过程中遇到任何问题，请随时告诉我。