## 1. 调试分析

- [x] 1.1 在 `reorganizeHierarchy` 中添加调试日志
- [x] 1.2 追踪丢失元素的处理流程
- [x] 1.3 确定元素丢失的具体位置

## 2. 修复问题

- [x] 2.1 根据调试结果修复问题
  - 问题根因：`reorganizeHierarchy` 在处理容器时递归调用自己处理 children，然后 `transformElement` 又会再次调用 `reorganizeHierarchy`，导致 children 被重组两次
  - 解决方案：在 `reorganizeHierarchy` 开头检查 children 是否已包含 `_isRowWrapper` 元素，如果有则直接返回，避免重复处理
- [x] 2.2 确保所有元素都被正确处理

## 3. 测试验证

- [x] 3.1 验证 DS、机构MOB12-24、营业部、中心 元素出现在输出中 ✅
- [x] 3.2 验证其他元素不受影响 ✅
