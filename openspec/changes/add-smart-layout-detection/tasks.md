## 1. 布局模式检测核心方法

- [x] 1.1 新增 `detectLayoutPattern(children, parentFrame)` 方法，返回布局模式类型
- [x] 1.2 新增 `isHorizontallyAligned(children, threshold)` 方法，检测子元素是否水平排列（Y坐标接近）
- [x] 1.3 新增 `isVerticallyAligned(children, threshold)` 方法，检测子元素是否垂直排列（X坐标接近）
- [x] 1.4 新增 `detectCentering(child, parentFrame)` 方法，检测单子元素居中状态

## 2. 对齐方式检测

- [x] 2.1 新增 `detectHorizontalAlignment(children, parentFrame)` 方法
  - 返回: 'left' | 'center' | 'right' | 'space-between' | 'none'
- [x] 2.2 新增 `detectVerticalAlignment(children, parentFrame)` 方法
  - 返回: 'top' | 'center' | 'bottom' | 'none'
- [x] 2.3 设置对齐检测阈值为 5px

## 3. 间距检测

- [x] 3.1 新增 `detectConsistentGap(children, direction)` 方法
- [x] 3.2 如果间距一致（差值 < 3px），返回 gap 值
- [x] 3.3 如果间距不一致，返回 null

## 4. 父元素样式优化

- [x] 4.1 单子元素居中：添加 `alignItems: 'center'`, `justifyContent: 'center'`
- [x] 4.2 水平排列：设置 `flexDirection: 'row'`
- [x] 4.3 两端对齐：添加 `justifyContent: 'space-between'`
- [x] 4.4 一致间距：添加 `gap` 属性（仅非 space-between 时）

## 5. 子元素样式简化

- [x] 5.1 居中布局下：移除 `marginLeft`, `marginTop`, `width`（Text 元素）
- [x] 5.2 space-between 布局下：移除 `marginLeft`, `width`
- [x] 5.3 row 布局下：移除 `marginTop`，首个子元素移除 `marginLeft`
- [x] 5.4 使用 gap 时：移除相邻元素的 margin

## 6. Row 包装容器（可选）

- [ ] 6.1 检测同一水平线上的多个元素
- [ ] 6.2 自动创建 Row 包装容器
- [ ] 6.3 设置包装容器的 `flexDirection: 'row'`

> 注：Row 包装容器功能暂未实现，当前版本直接在父元素上应用 row 布局

## 7. 修改 transformElement 方法

- [x] 7.1 在处理子元素前调用 `detectLayoutPattern`
- [x] 7.2 根据检测结果设置父元素样式
- [x] 7.3 根据检测结果简化子元素样式

## 8. 测试验证

- [x] 8.1 测试"新增小组"按钮 - 单子元素居中 ✅
- [x] 8.2 测试"团队长 / 选择"行 - space-between 布局 ✅
- [x] 8.3 测试"确认"按钮 - 单子元素居中 ✅
- [x] 8.4 验证非特殊布局元素保持原有样式 ✅
