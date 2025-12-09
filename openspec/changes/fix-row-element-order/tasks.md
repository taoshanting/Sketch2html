## 1. 修复子元素排序

- [x] 1.1 在 `transformElement` 中，对于 row 布局的 children，按 X 坐标排序
- [x] 1.2 确保排序在转换之前进行

## 2. 添加边距计算

- [x] 2.1 对于 row 布局的第一个元素，添加 margin-left（相对于父容器左边缘）
- [x] 2.2 对于 row 布局的最后一个元素，添加 margin-right（相对于父容器右边缘）

## 3. 测试验证

- [x] 3.1 验证 `已勾选 0 人` (C3A70718) 在左边，有 margin-left: 16px ✅
- [x] 3.2 验证 `矩形` (118AF70F) 在右边，有 margin-right: 12px ✅
- [x] 3.3 验证其他 row 布局不受影响 ✅
