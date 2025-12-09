# Change: Adjust Row Grouping Threshold

## Why

当前的 `detectCloseGroups` 方法使用 30px 阈值来判断元素是否紧密相邻。但对于同一行的元素，即使间距较大，也应该被包裹在 Row 容器中使用 flex 布局。

### 问题示例

**三个元素的位置：**
- `定级缺口：29万` (2577AA2C): x=34, y=281, width=94 → 右边缘=128
- `考核缺口：51万` (8D0970BC): x=163, y=283, width=95 → 间距=35px
- `icon_enter` (706377DD): x=325, y=281, width=20 → 间距=67px

这三个元素 Y 坐标接近（281-283，差值 < 4px），属于同一行，但由于间距超过 30px 阈值，没有被包裹在 Row 容器中。

### 当前输出

```html
<span id="2577AA2C">定级缺口：29万</span>
<span id="8D0970BC">考核缺口：51万</span>
<div id="706377DD">icon_enter</div>
```

### 期望输出

```html
<div data-name="Row" style="display: flex; flex-direction: row; justify-content: space-between">
  <span id="2577AA2C">定级缺口：29万</span>
  <span id="8D0970BC">考核缺口：51万</span>
  <div id="706377DD">icon_enter</div>
</div>
```

## What Changes

### 修改方法

1. **调整 `detectCloseGroups` 阈值** - 将阈值从 30px 增加到更合理的值（如 100px 或更大）
2. **或者修改 `applyRowGrouping` 逻辑** - 对于同一行的所有元素，即使间距较大，也创建 Row 包装器

## Impact

- Affected specs: `sketch-converter`
- Affected code: `src/sketch-json-converter.js` - JSONTransformer 类

## 建议方案

将 `detectCloseGroups` 的默认阈值从 30px 调整为 150px，这样可以覆盖更多同一行的元素组合。
