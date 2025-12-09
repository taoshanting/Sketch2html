## 1. 调整 detectCloseGroups 阈值

- [x] 1.1 将 `detectCloseGroups` 的默认阈值从 30px 调整为 150px
- [x] 1.2 确保同一行的元素能被正确分组

## 2. 测试验证

- [x] 2.1 测试 id:2577AA2C、8D0970BC、706377DD 应被包裹在同一 Row 中 ✅
- [x] 2.2 验证 Row 容器使用 flex 布局 (flex-direction: row) ✅
- [x] 2.3 验证 Row 容器使用 space-between 布局 ✅
- [x] 2.4 验证其他行分组不受影响 ✅
