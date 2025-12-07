# Change: Add Row Wrapper Detection for Horizontal Elements

## Why
当前的智能布局检测只能处理已经在同一父元素下的子元素。但实际设计稿中，同一行的元素可能分散在不同层级，需要自动检测并创建 Row 包装容器。

### 问题示例

**场景 1：一组 + icon-编辑 + icon-删除**
```
一组 (x=28, y=100)  icon-编辑 (x=64, y=102)  icon-删除 (x=331, y=100)
```
这三个元素 Y 坐标接近，应该在同一行：
- `一组` 和 `icon-编辑` 靠左（可以包裹在一个 div 中）
- `icon-删除` 靠右
- 外层使用 `justify-content: space-between`

**场景 2：小组成员 + 选择**
```
小组成员 (x=28, y=146)  选择 (x=319, y=146)
```
这两个元素 Y 坐标相同，应该包裹在 Row 容器中使用 space-between。

## What Changes

### 新增方法
- `groupByRow(children)` - 将子元素按 Y 坐标分组，识别同一行的元素
- `createRowWrapper(rowElements, parentFrame)` - 为同一行的元素创建 Row 包装容器
- `detectLeftRightGroups(rowElements)` - 检测行内元素的左右分组（用于 space-between）

### 修改方法
- `reorganizeHierarchy` - 在层级重组时，先按行分组，再创建 Row 包装容器

## Impact
- Affected specs: `sketch-converter`
- Affected code: `src/sketch-json-converter.js` - JSONTransformer 类

## 算法设计

### 1. 按行分组 (groupByRow)
```
输入: 子元素数组
输出: { rowY: [elements...], ... }

算法:
1. 按 Y 坐标排序
2. 遍历元素，Y 坐标差值 < 阈值(4px) 的归为同一行
3. 返回行分组
```

### 2. 左右分组检测 (detectLeftRightGroups)
```
输入: 同一行的元素数组, 父元素 frame
输出: { left: [elements...], right: [elements...] }

算法:
1. 计算父元素中心线 centerX = parentWidth / 2
2. 元素中心点 < centerX 归为左组
3. 元素中心点 > centerX 归为右组
4. 如果左右都有元素，使用 space-between
```

### 3. Row 包装容器创建 (createRowWrapper)
```
输入: 同一行的元素数组
输出: Row 包装容器元素

结构:
{
  id: 生成唯一ID,
  name: "Row",
  type: "group",
  frame: 计算包围盒,
  children: 行内元素
}
```

## 目标输出示例

**场景 1 优化后：**
```json
{
  "name": "Row",
  "props": {
    "style": {
      "display": "flex",
      "flexDirection": "row",
      "justifyContent": "space-between",
      "alignItems": "center"
    }
  },
  "children": [
    {
      "name": "LeftGroup",
      "children": [
        { "name": "一组" },
        { "name": "icon-编辑" }
      ]
    },
    { "name": "icon-删除备份" }
  ]
}
```

**场景 2 优化后：**
```json
{
  "name": "Row",
  "props": {
    "style": {
      "display": "flex",
      "flexDirection": "row",
      "justifyContent": "space-between"
    }
  },
  "children": [
    { "name": "小组成员" },
    { "name": "选择" }
  ]
}
```
