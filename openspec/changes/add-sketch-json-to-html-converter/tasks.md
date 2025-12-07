## 1. 核心转换器实现
- [x] 1.1 创建 `src/sketch-json-converter.js` 主文件
- [x] 1.2 实现 JSON 解析功能，支持读取 sketch2.json 文件
- [x] 1.3 实现图层遍历算法，处理嵌套的 children 结构
- [x] 1.4 实现样式提取器，将 Sketch 样式转换为行内 CSS 样式

## 2. HTML 生成功能（行内样式）
- [x] 2.1 实现 HTML 结构生成器
  - 将 artboard 转换为容器元素
  - 将 rectangle 转换为 div 元素
  - 将 text 转换为文本元素
  - 将 symbolInstance 转换为组件引用
- [x] 2.2 实现行内样式生成器
  - 位置和尺寸转换为 style 属性（frame.x, frame.y, frame.width, frame.height）
  - 背景色和边框样式转换为 style 属性
  - 文本样式转换为 style 属性（字体、大小、颜色）
  - 阴影效果转换为 style 属性
  - 所有样式直接内联到 HTML 元素的 style 属性中
- [x] 2.3 实现智能布局系统
  - 实现基于元素位置关系的布局检测算法
  - 检测水平/垂直对齐，自动应用 Flexbox 布局
  - 检测网格状分布，自动应用 CSS Grid 布局
  - 转换绝对定位为相对定位，使用 flex 和 gap 属性
- [x] 2.4 实现响应式布局支持
  - 使用相对单位和百分比
  - 支持设备适配

## 3. MCP 工具集成
- [x] 3.1 在 `sketch2Web.js` 中新增 MCP 工具
  - `loadSketchJSON` - 加载 Sketch JSON 文件
  - `convertJSONToHTML` - 将 JSON 转换为 HTML
  - `generateHTMLFile` - 生成完整的 HTML 文件
- [x] 3.2 实现工具的错误处理和验证
- [x] 3.3 添加工具使用文档和示例

## 4. 测试和示例
- [x] 4.1 创建测试用例，验证各种图层类型的转换
  - 测试矩形图层转换
  - 测试文本图层转换
  - 测试嵌套图层结构
- [x] 4.2 测试布局系统
  - 测试 Flexbox 布局转换（水平/垂直排列）
  - 测试 CSS Grid 布局转换（网格状排列）
  - 验证元素间距和对齐保持一致
- [x] 4.3 使用 sketch2.json 创建转换示例
- [x] 4.4 生成示例输出文件

## 5. 代码优化
- [x] 5.1 添加代码注释和文档
- [x] 5.2 优化性能，支持大型 JSON 文件
- [ ] 5.3 实现增量更新功能

## 6. 发布准备
- [x] 6.1 更新 package.json 添加新命令
- [x] 6.2 创建使用说明文档
- [x] 6.3 验证生成的 HTML 代码正确性