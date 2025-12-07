# Change: Fix Row Child Margin Calculation

## Why

当前在 Row 或 LeftGroup 容器内，子元素的 `marginLeft` 计算不正确。

### 问题示例

**原始数据：**
- `一组` (10D5CFB1): x=28, width=28 → 右边缘 = 56
- `icon-编辑` (5995F401): x=64, width=16

**正确的 marginLeft：**
- `icon-编辑` 的 marginLeft = 64 - 56 = **8px**

**当前错误输出：**
- `margin-left: 36px` (错误地用 64 - 28 = 36)

### 根本原因

在 `transformRowWrapper` 方法中处理子元素时，`marginLeft` 的计算使用的是 `parentFrame.x` 作为基准，而不是**前一个兄弟元素的右边缘**。

对于水平排列（row）的容器，子元素之间的间距应该是：
```
当前元素.x - 前一个元素的右边缘
= 当前元素.x - (前一个元素.x + 前一个元素.width)
```

## What Changes

### 修改方法

1. **`transformRowWrapper`** - 修改子元素 margin 计算逻辑
   - 对于 row 布局的子元素，使用前一个兄弟元素的右边缘计算 marginLeft
   - 第一个子元素仍然使用 parentFrame.x 作为基准

2. **`createLeftGroup`** - 确保 LeftGroup 也正确传递布局信息

## Impact

- Affected specs: `sketch-converter`
- Affected code: `src/sketch-json-converter.js` - JSONTransformer 类

## 算法设计

### 修改后的子元素 marginLeft 计算

```
对于 row 布局的容器:
  prevRight = parentFrame.x  // 初始值为父元素左边缘

  for each child in children:
    marginLeft = child.x - prevRight
    prevRight = child.x + child.width  // 更新为当前元素的右边缘
```

## 目标输出示例

**修复前：**
```html
<img id="5995F401..." style="margin-left: 36px" />
```

**修复后：**
```html
<img id="5995F401..." style="margin-left: 8px" />
```

或者，由于 LeftGroup 已经设置了 `gap: 8px`，可以完全移除 marginLeft：
```html
<img id="5995F401..." style="..." />  <!-- 无 marginLeft，由 gap 控制间距 -->
```
