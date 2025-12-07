# Change: Add JSON Transform to Low-Code Format

## Why
当前系统直接将简化的 Sketch JSON（如 sketch2.json）转换为 HTML。用户希望能够先将源 JSON 清洗和重组为低代码格式（如 sketch1.json 的格式），这种格式具有以下优势：
- 包含完整的 CSS 样式信息（props.style）
- 基于位置关系重组元素层级（children 嵌套）
- 使用相对边距（marginTop/marginLeft）替代绝对定位
- 包含低代码组件元数据（componentName, lowcodeType）

## What Changes
- **ADDED**: 新增 `transformJSONToLowCode` 方法，将简化 JSON 转换为低代码格式
- **ADDED**: 实现位置关系检测，自动将平级元素重组为嵌套结构
- **ADDED**: 计算相对边距（marginTop/marginLeft）替代绝对定位
- **ADDED**: 生成 componentName（Div/Text/Image）和 lowcodeType
- **ADDED**: 新增 MCP 工具 `transformJSON` 用于 JSON 格式转换

## Impact
- Affected specs: `sketch-converter`
- Affected code:
  - `src/sketch-json-converter.js` - 新增转换方法
  - MCP 工具集 - 新增 transformJSON 工具

## 目标格式说明

### 输入格式（sketch2.json 风格）
```json
{
  "id": "xxx",
  "name": "矩形备份",
  "type": "rectangle",
  "frame": { "x": 16, "y": 300, "width": 343, "height": 45 },
  "backgroundColor": "rgb(255, 255, 255)",
  "borderRadius": 8,
  "children": []
}
```

### 输出格式（sketch1.json 风格）
```json
{
  "id": "xxx",
  "name": "矩形备份",
  "props": {
    "style": {
      "display": "flex",
      "width": "343px",
      "height": "45px",
      "backgroundColor": "rgba(255,255,255,1)",
      "borderRadius": "8px",
      "marginTop": "12px",
      "marginLeft": "16px",
      "flexDirection": "column",
      "alignItems": "center",
      "justifyContent": "center"
    },
    "className": "view_10"
  },
  "rect": { "x": 16, "y": 300, "width": 343, "height": 45 },
  "componentName": "Div",
  "lowcodeType": "KunBasicContainer",
  "children": [...]
}
```
