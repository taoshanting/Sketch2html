# Change: Detect Group Elements as Images

## Why

当前转换器只将 `symbolInstance` 类型识别为图片（Image 组件）。但在 Sketch 设计中，很多小图标、图形是由 `group` 类型包含多个子元素（如 oval、shapePath、shapeGroup 等）组成的。

### 问题示例

**元素 `8E73971D-434F-42FD-999E-4AD594A2B6D6`（编组 16备份 3）：**
- 类型：`group`
- 尺寸：12x12px
- 包含：椭圆形 + 问号形状
- 实际用途：这是一个小图标，应该作为图片处理

**元素 `CCAD2B28-9FB8-4179-8CC9-C4469D45B2A2`（编组 3备份）：**
- 类型：`group`
- 尺寸：20x20px
- 实际用途：这是一个图标，在 sketch4.json 中已被正确识别为 Image

### 期望行为

参考 sketch4.json 的输出格式，这些元素应该被转换为：
```json
{
  "componentName": "Image",
  "props": {
    "src": "",
    "alt": "编组 16备份 3"
  }
}
```

## What Changes

### 智能图片检测

添加启发式规则来识别应该作为图片处理的 group 元素：

1. **尺寸检测**：小尺寸的 group（如 ≤48px）更可能是图标
2. **子元素类型检测**：包含 `oval`、`shapePath`、`shapeGroup` 等图形元素的 group
3. **无文本内容**：不包含 `text` 类型子元素
4. **叶子节点优先**：子元素都是图形基元，没有深层嵌套的复杂结构

### 转换规则

当 group 被识别为图片时：
- `componentName` 设为 `Image`
- `props.src` 设为空字符串 `""`
- `props.alt` 设为元素的 `name` 属性
- 不递归处理其 children（作为原子图片处理）

## Impact

- Affected specs: `sketch-converter`
- Affected code: `src/sketch-json-converter.js` - `detectComponentName` 方法和 `transformElement` 方法
