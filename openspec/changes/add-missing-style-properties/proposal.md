# Change: Add Missing Style Properties

## Why

当前的样式转换缺少对以下属性的处理：

### 问题 1：复杂 opacity 格式未解析

**元素：** `id:6BAF2986-6CDD-46D5-B88A-5E582A26D7BD`

原始数据中 `opacity` 是 BigDecimal 对象格式：
```json
"opacity": {
    "s": 1,
    "e": -1,
    "c": [69999998807907, 10000000000000]
}
```
这表示 0.7（科学计数法），但当前代码直接使用该对象，导致输出 `opacity: [object Object]`。

### 问题 2：渐变背景 (background) 未处理

**元素：** `id:6BAF2986-6CDD-46D5-B88A-5E582A26D7BD`

原始数据有 `background` 属性（渐变）：
```json
"background": "linear-gradient(rgb(255, 224, 219) 0%, rgb(253, 228, 191) 100%)"
```
当前只处理 `backgroundColor`，渐变背景丢失。

### 问题 3：边框 (border) 未处理

**元素：** `id:1A446D9A-2083-4FE7-92CB-E84368559E14`

原始数据有 `border` 对象：
```json
"border": {
    "width": 1,
    "color": "rgb(231, 231, 231)",
    "position": 1
}
```
当前代码未处理此属性，边框丢失。

## What Changes

### 修改方法

1. **`buildPropsStyle`** - 添加缺失的样式属性处理
   - 解析复杂 opacity 格式（BigDecimal 对象）
   - 处理 `background` 渐变背景
   - 处理 `border` 边框对象

2. **新增辅助方法**
   - `parseOpacity(opacity)` - 解析各种 opacity 格式
   - `parseBorder(border)` - 解析边框对象为 CSS border 字符串

## Impact

- Affected specs: `sketch-converter`
- Affected code: `src/sketch-json-converter.js` - JSONTransformer 类

## 算法设计

### parseOpacity

```
输入: opacity (number | object)
输出: number (0-1)

算法:
1. 如果是 number，直接返回
2. 如果是 BigDecimal 对象格式 {s, e, c}:
   - 计算值 = c[0] / c[1] * 10^e
   - 或简化为 c[0] / (c[1] * 10^(-e))
3. 返回解析后的数值
```

### parseBorder

```
输入: border { width, color, position }
输出: CSS border 字符串

算法:
1. 提取 width（默认 1）
2. 提取 color 并转换为 rgba
3. 返回 "${width}px solid ${color}"
```

## 目标输出示例

**修复前 (id:6BAF2986)：**
```css
opacity: [object Object];
/* 无背景 */
```

**修复后 (id:6BAF2986)：**
```css
opacity: 0.7;
background: linear-gradient(rgb(255, 224, 219) 0%, rgb(253, 228, 191) 100%);
```

**修复前 (id:1A446D9A)：**
```css
/* 无边框 */
```

**修复后 (id:1A446D9A)：**
```css
border: 1px solid rgba(231,231,231,1);
```
