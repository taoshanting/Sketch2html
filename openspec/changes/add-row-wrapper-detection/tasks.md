## 1. 按行分组检测

- [ ] 1.1 新增 `groupByRow(children, threshold)` 方法
- [ ] 1.2 按 Y 坐标对子元素进行分组
- [ ] 1.3 Y 坐标差值 < 阈值(4px) 的元素归为同一行
- [ ] 1.4 返回 Map<rowY, elements[]> 结构

## 2. 左右分组检测

- [ ] 2.1 新增 `detectLeftRightGroups(rowElements, parentFrame)` 方法
- [ ] 2.2 计算父元素中心线
- [ ] 2.3 根据元素中心点位置分为左组和右组
- [ ] 2.4 返回 { left: [], right: [], needsSpaceBetween: boolean }

## 3. Row 包装容器创建

- [ ] 3.1 新增 `createRowWrapper(rowElements, parentFrame)` 方法
- [ ] 3.2 生成唯一 ID（使用 UUID 或递增计数器）
- [ ] 3.3 计算 Row 容器的包围盒 frame
- [ ] 3.4 设置 Row 容器样式：`display: flex, flexDirection: row`
- [ ] 3.5 如果需要 space-between，添加 `justifyContent: space-between`

## 4. 左侧元素分组包装

- [ ] 4.1 新增 `createLeftGroup(leftElements)` 方法
- [ ] 4.2 当左侧有多个元素时，创建包装容器
- [ ] 4.3 设置左侧容器样式：`display: flex, flexDirection: row, gap`

## 5. 修改 reorganizeHierarchy 方法

- [ ] 5.1 在层级重组后，对每个容器的子元素调用 `groupByRow`
- [ ] 5.2 对于多元素行，调用 `createRowWrapper` 创建包装容器
- [ ] 5.3 用 Row 包装容器替换原始的平级元素
- [ ] 5.4 保持单元素行不变

## 6. 修改 transformElement 方法

- [ ] 6.1 在处理子元素时应用行分组逻辑
- [ ] 6.2 确保 Row 包装容器正确传递布局信息

## 7. 测试验证

- [ ] 7.1 测试"一组 + icon-编辑 + icon-删除"行 - 应创建 Row 包装器
- [ ] 7.2 测试"小组成员 + 选择"行 - 应创建 Row 包装器并使用 space-between
- [ ] 7.3 验证生成的 HTML 结构正确
- [ ] 7.4 验证非同行元素保持原有结构
