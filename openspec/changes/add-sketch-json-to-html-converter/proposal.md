# Change: Add Sketch JSON to HTML Converter

## Why
用户需要将 Sketch JSON 格式的设计文件转换为低代码 HTML，以便快速生成原型和可用的网页代码。目前项目只支持 .sketch 原生文件格式，缺少对 JSON 格式的支持。

## What Changes
- 新增 `convert-sketch-json-to-html` 工具方法，支持解析 sketch2.json 等 Sketch JSON 文件
- 实现将 JSON 中的图层、样式、文本等元素转换为带有行内样式的 HTML 代码
- 支持低代码格式输出，包括：
  - HTML 结构生成
  - 行内 CSS 样式（无需分离 CSS 文件）
  - 响应式布局支持
  - 图片资源处理
- 生成的代码可直接用于前端开发，单个 HTML 文件即可运行

## Impact
- Affected specs: 新增 `sketch-json-converter` 规格说明
- Affected code:
  - 新增 `src/sketch-json-converter.js` 核心转换器
  - 新增 `examples/sketch-json-example.js` 使用示例
  - 扩展现有的 MCP 工具集

## 新功能说明
1. 解析 Sketch JSON 结构，提取 artboard（画板）、图层、文本、形状等元素
2. 将 Sketch 的样式属性转换为行内 CSS 样式
3. 生成语义化的 HTML 结构，所有样式通过 style 属性内联
4. 智能布局系统：
   - 支持使用 Flexbox 进行一维布局（行、列）
   - 支持使用 CSS Grid 进行二维布局
   - 自动识别元素对齐和分布规律，选择合适的布局方式
   - 保持原设计的间距和对齐关系
5. 输出完整的 HTML 文件，可直接在浏览器中打开
6. 使用行内样式确保单个 HTML 文件包含所有样式信息