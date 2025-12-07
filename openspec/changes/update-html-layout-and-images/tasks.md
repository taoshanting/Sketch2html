## 1. 修复 Flex 布局应用

- [x] 1.1 调试 `detectFlexboxLayout` 方法，确认为何布局检测结果未正确应用到输出
- [x] 1.2 修复布局样式应用逻辑，确保检测到的 flex 布局被正确写入父容器样式
- [x] 1.3 确保子元素在应用 flex 布局后移除绝对定位属性

## 2. 实现 IMG 标签转换

- [x] 2.1 修改 `generateHTMLElement` 方法，为 symbolInstance 类型使用 `<img>` 标签
- [x] 2.2 设置 `src=""` 作为空占位符
- [x] 2.3 从 frame 属性中提取 width/height 并应用为行内样式
- [x] 2.4 使用 `data-name` 或 `name` 属性值作为 `alt` 属性

## 3. 测试验证

- [x] 3.1 重新转换 sketch2.json 生成新的 HTML 输出
- [x] 3.2 验证 flex 布局已正确应用
- [x] 3.3 验证 symbolInstance 转换为带尺寸的 img 标签
