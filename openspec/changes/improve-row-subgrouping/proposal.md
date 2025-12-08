# Change: Improve Row Subgrouping by X-Distance

## Why

当前的行分组逻辑只按 Y 坐标分组，没有考虑 X 坐标的间距。导致同一行但距离较远的元素被错误地放在同一个 Row 容器中。

### 问题示例

**Y=237 的元素：**
- `左小西` (x=50) - 左侧元素
- `目标` (x=256) - 右侧元素组
- `矩形` (x=288) - 右侧元素组
- `万` (x=339) - 右侧元素组

**当前行为：**
这4个元素被识别为同一行，但由于 `左小西` 和 `目标` 之间距离很大（256-50=206px），它们不应该在同一个紧密的 Row 容器中。

**期望行为：**
- `目标`、`矩形`、`万` 这三个紧密相邻的元素（间距都是 4px）应该被包裹在一个 Row 容器中
- 这个 Row 容器距离左边元素的间距为 48px（256 - 左边元素右边缘）

### 元素间距分析

```
目标 (x=256, width=28) → 右边缘 = 284
矩形 (x=288, width=47) → 间距 = 288 - 284 = 4px
万   (x=339, width=14) → 间距 = 339 - 335 = 4px
```

## What Changes

### 修改方法

1. **`detectCloseGroups`** - 新增方法
   - 在同一行的元素中，按 X 坐标间距进一步分组
   - 间距 > 阈值（如 30px）的元素分为不同组

2. **`createRowWrapper`** - 修改方法
   - 在创建 Row 包装器前，先检测紧密相邻的元素组
   - 只为紧密相邻的元素组创建 Row 包装器

## Impact

- Affected specs: `sketch-converter`
- Affected code: `src/sketch-json-converter.js` - JSONTransformer 类

## 算法设计

### detectCloseGroups

```
输入: rowElements (同一行的元素数组), gapThreshold (间距阈值，默认 30px)
输出: Array<Array<Element>> (紧密相邻的元素组数组)

算法:
1. 按 X 坐标排序
2. 遍历元素，计算与前一个元素的间距
3. 如果间距 > 阈值，开始新的组
4. 返回所有组
```

### 修改后的 applyRowGrouping

```
原逻辑:
1. 按 Y 分组
2. 多元素行创建 Row 包装器

新逻辑:
1. 按 Y 分组
2. 对每行，按 X 间距进一步分组
3. 只为紧密相邻的多元素组创建 Row 包装器
```

## 目标输出示例

**修复前：**
```html
<span id="8C244BB7">目标</span>
<div id="1A446D9A">矩形</div>
<span id="7EECE3C3">万</span>
```

**修复后：**
```html
<div data-name="Row" style="display: flex; flex-direction: row; margin-left: 48px">
  <span id="8C244BB7">目标</span>
  <div id="1A446D9A" style="margin-left: 4px">矩形</div>
  <span id="7EECE3C3" style="margin-left: 4px">万</span>
</div>
```
