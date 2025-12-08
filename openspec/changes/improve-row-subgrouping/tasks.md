## 1. 新增 detectCloseGroups 方法

- [x] 1.1 新增 `detectCloseGroups(rowElements, gapThreshold)` 方法
- [x] 1.2 按 X 坐标排序元素
- [x] 1.3 计算相邻元素间距，间距 > 阈值时分组
- [x] 1.4 返回紧密相邻的元素组数组

## 2. 修改 applyRowGrouping 方法

- [x] 2.1 在按 Y 分组后，对每行调用 `detectCloseGroups`
- [x] 2.2 只为紧密相邻的多元素组创建 Row 包装器
- [x] 2.3 单元素组保持不变

## 3. 修复 Row 容器 margin 计算

- [x] 3.1 修改 `transformRowWrapper` 接收 `prevRight` 参数
- [x] 3.2 使用前一个兄弟元素的右边缘计算 marginLeft
- [x] 3.3 修改 `transformElement` 传递 `prevRight` 给 Row 包装器
- [x] 3.4 在处理子元素时跟踪 `currentRight`

## 4. 测试验证

- [x] 4.1 测试 id:8C244BB7、1A446D9A、7EECE3C3 应被包裹在同一 Row 中 ✅
- [x] 4.2 验证 Row 容器的 margin-left 正确（48px） ✅
- [x] 4.3 验证子元素 margin-left 正确（4px） ✅
- [x] 4.4 验证其他行分组不受影响 ✅
