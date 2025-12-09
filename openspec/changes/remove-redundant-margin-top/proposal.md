# Change: Remove Redundant Margin-Top When Parent Has Align-Items Center

## Why

当父元素使用 `align-items: center` 时，子元素会自动垂直居中，此时子元素的 `margin-top` 是多余的。

### 问题示例

**当前输出：**
```html
<div id="A57FC07A" style="align-items: center; justify-content: space-between">
  <div id="row_kim53bte2" style="margin-top: 12px">  <!-- 多余的 margin-top -->
    ...
  </div>
</div>
```

父元素 `A57FC07A` 已经设置了 `align-items: center`，子元素 `row_kim53bte2` 的 `margin-top: 12px` 是多余的，因为 flexbox 的 `align-items: center` 会自动处理垂直居中。

### 根本原因

在 `optimizeChildStyle` 方法中，对于 `space-between` 布局只移除了 `marginLeft`，没有考虑当父元素有 `alignItems: center` 时也应该移除 `marginTop`。

## What Changes

### 修改方法

1. **`optimizeChildStyle`** - 增强样式优化逻辑
   - 当父元素有 `alignItems: center` 时，移除子元素的 `marginTop`

## Impact

- Affected specs: `sketch-converter`
- Affected code: `src/sketch-json-converter.js` - JSONTransformer 类的 `optimizeChildStyle` 方法

## 目标输出示例

**修复前：**
```html
<div id="row_kim53bte2" style="margin-top: 12px">
```

**修复后：**
```html
<div id="row_kim53bte2" style="">  <!-- 无 margin-top -->
```
