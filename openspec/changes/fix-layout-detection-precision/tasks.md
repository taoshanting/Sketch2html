## 1. 新增水平居中检测方法

- [x] 1.1 新增 `detectHorizontalCenterAlignment(children, parentFrame)` 方法
- [x] 1.2 计算每个子元素相对于父元素的水平居中偏差
- [x] 1.3 设置居中检测阈值为 5px
- [x] 1.4 返回 boolean 表示是否所有子元素都水平居中

## 2. 修改 detectLayoutPattern 方法

- [x] 2.1 修改 column 布局检测逻辑
- [x] 2.2 移除无条件添加 `alignItems: 'center'` 的代码
- [x] 2.3 调用 `detectHorizontalCenterAlignment` 检测是否真正居中
- [x] 2.4 只有检测结果为 true 时才添加 `alignItems: 'center'`

## 3. 修改 optimizeChildStyle 方法

- [x] 3.1 检查 column 布局下的样式优化逻辑
- [x] 3.2 只有当 `alignItems === 'center'` 时才移除 `marginLeft`
- [x] 3.3 确保非居中元素保留 `marginLeft` 和 `marginTop`

## 4. 测试验证

- [x] 4.1 测试 id:906ACFDC - 白色卡片容器不应有 `align-items: center` ✅
- [x] 4.2 测试 id:5F871EA4 - 内部矩形容器不应有 `align-items: center` ✅
- [x] 4.3 测试 id:91A91890 - "1人：范范" 应保留 `marginLeft` 和 `marginTop` ✅
- [x] 4.4 验证原有居中布局（如"新增小组"按钮）仍然正常工作 ✅
