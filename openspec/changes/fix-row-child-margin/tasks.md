## 1. 修改 transformRowWrapper 方法

- [x] 1.1 在处理子元素时，跟踪前一个兄弟元素的右边缘位置
- [x] 1.2 第一个子元素使用 parentFrame.x 作为基准计算 marginLeft
- [x] 1.3 后续子元素使用前一个兄弟元素的右边缘计算 marginLeft
- [x] 1.4 当 LeftGroup 有 gap 属性时，移除子元素的 marginLeft

## 2. 修改 transformElement 方法

- [x] 2.1 检查 row 布局下子元素的 margin 计算逻辑
- [x] 2.2 确保 layoutInfo 正确传递给子元素

## 3. 测试验证

- [x] 3.1 测试 id:5995F401 (icon-编辑) - marginLeft 应为 8px 或被 gap 替代 ✅
- [x] 3.2 验证 LeftGroup 内元素间距正确 (gap: 8px) ✅
- [x] 3.3 验证其他 Row 容器的子元素间距正确 ✅
