# Sketch JSON 转 HTML 转换器

将 Sketch JSON 格式的设计文件转换为带有行内样式的 HTML 代码，支持 Flexbox 和 Grid 智能布局。

## 功能特性

- ✅ 解析 Sketch JSON 文件（如 sketch2.json）
- ✅ 将图层样式转换为行内 CSS
- ✅ 智能布局系统：
  - 自动检测并应用 Flexbox 布局
  - 自动检测并应用 CSS Grid 布局
  - 保持原设计的间距和对齐
- ✅ 生成单个 HTML 文件，无需额外 CSS
- ✅ 支持嵌套图层结构
- ✅ 完整的 MCP 工具集成

## 安装和使用

### 1. 作为 Node.js 模块使用

```javascript
import { SketchJSONConverter, convertSketchJSONToHTML } from './src/sketch-json-converter.js';

// 方式 1: 使用类
const converter = new SketchJSONConverter();
await converter.loadJSON('./sketch2.json');
const html = converter.generateHTML();

// 方式 2: 使用便捷函数
const html = await convertSketchJSONToHTML('./sketch2.json');
```

### 2. 运行示例

```bash
# 运行转换示例
npm run example:json

# 运行测试
npm run test:json
```

### 3. 使用 MCP 工具

启动 MCP 服务器：
```bash
npm run mcp
```

可用的工具：
- `loadSketchJSON` - 加载 Sketch JSON 文件
- `convertJSONToHTML` - 将 JSON 转换为 HTML
- `generateHTMLFile` - 一键生成 HTML 文件

## API 文档

### SketchJSONConverter 类

#### 方法

##### `loadJSON(filePath)`
加载并解析 Sketch JSON 文件。

**参数:**
- `filePath` (string): JSON 文件路径

**返回:**
- Promise<Object>: 解析后的数据

##### `generateHTML(data?)`
生成完整的 HTML 文档。

**参数:**
- `data` (Object, 可选): Sketch 数据，如果不提供则使用已加载的数据

**返回:**
- string: HTML 文档字符串

### 便捷函数

#### `convertSketchJSONToHTML(filePath)`
一步式转换，加载 JSON 并生成 HTML。

**参数:**
- `filePath` (string): JSON 文件路径

**返回:**
- Promise<string>: HTML 文档字符串

## 转换规则

### 图层类型映射

| Sketch 类型 | HTML 标签 |
|------------|-----------|
| artboard   | `<div>` |
| rectangle  | `<div>` |
| text       | `<span>` 或 `<div>` |
| group      | `<div>` |
| symbolInstance | `<div>` |

### 样式转换

- **位置**: frame.x, frame.y → position, left, top
- **尺寸**: frame.width, frame.height → width, height
- **背景**: backgroundColor → background-color
- **边框**: borders → border
- **圆角**: borderRadius → border-radius
- **阴影**: shadows → box-shadow
- **文本**: text.* → font-*, color, text-align 等

### 智能布局

#### Flexbox 检测
- 检测水平排列的元素（y 坐标相近）
- 检测垂直排列的元素（x 坐标相近）
- 自动计算元素间距，使用 `gap` 属性
- 移除子元素的绝对定位

#### Grid 检测
- 检测网格状分布的元素
- 自动计算列宽和行高
- 使用 `grid-template-columns` 和 `grid-template-rows`
- 保持网格对齐

## 示例

### 输入 JSON 结构

```json
{
    "id": "8B3E5E6C-E322-42BB-9EC2-C232F3471D2D",
    "name": "My Artboard",
    "type": "artboard",
    "frame": {
        "x": 0,
        "y": 0,
        "width": 375,
        "height": 812
    },
    "backgroundColor": "rgb(255, 255, 255)",
    "children": [
        {
            "id": "header",
            "name": "Header",
            "type": "rectangle",
            "frame": {
                "x": 0,
                "y": 0,
                "width": 375,
                "height": 64
            },
            "backgroundColor": "rgb(0, 122, 255)"
        }
    ]
}
```

### 输出 HTML

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sketch Design</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
    </style>
</head>
<body>
    <div id="8B3E5E6C-E322-42BB-9EC2-C232F3471D2D"
         data-name="My Artboard"
         style="width: 375px; height: 812px; background-color: rgb(255, 255, 255);">
        <div id="header"
             data-name="Header"
             style="position: absolute; left: 0px; top: 0px;
                    width: 375px; height: 64px;
                    background-color: rgb(0, 122, 255);">
        </div>
    </div>
</body>
</html>
```

## 注意事项

1. 生成的 HTML 使用行内样式，可以直接在浏览器中打开
2. Flexbox/Grid 布局会自动检测并应用，无需手动配置
3. 支持嵌套图层，会递归处理所有子元素
4. 颜色支持多种格式：rgb/rgba 字符串或对象格式

## 故障排除

### 文件路径错误
确保使用绝对路径或正确的相对路径。

### JSON 格式错误
检查 JSON 文件是否有效，可以使用在线 JSON 验证器。

### 样式不正确
- 检查原始 JSON 中的样式属性名称
- 确保颜色值格式正确
- 验证 frame 对象包含必要的坐标和尺寸信息

## 更新日志

### v1.0.0
- 初始版本发布
- 支持基本的图层转换
- 实现智能布局系统
- 集成 MCP 工具