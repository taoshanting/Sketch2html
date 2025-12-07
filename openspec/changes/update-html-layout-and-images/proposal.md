# Change: Update HTML Layout to Use Flex and Convert Images to IMG Tags

## Why
当前的 HTML 输出存在两个主要问题：
1. 虽然代码中有 Flexbox/Grid 布局检测逻辑，但输出的 HTML 仍然全部使用绝对定位（`position: absolute`），没有真正应用现代 CSS 布局
2. symbolInstance 类型的图标/图片元素被转换为空的 `<div>` 标签，而不是语义化的 `<img>` 标签

## What Changes
- **MODIFIED**: 修复 Flexbox 布局检测和应用逻辑，确保符合条件的容器使用 `display: flex` 布局
- **MODIFIED**: 将 symbolInstance 类型转换为 `<img>` 标签
  - `src` 属性可以为空字符串（作为占位符）
  - 保留原始的 `width` 和 `height` 样式尺寸
  - 添加 `alt` 属性使用元素的 `name` 值

## Impact
- Affected specs: `sketch-converter`
- Affected code:
  - `src/sketch-json-converter.js` - 修改 `generateHTMLElement` 方法和布局检测逻辑
