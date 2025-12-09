# Change: Fix Adjacent Element Grouping

## Why

当前的行分组逻辑存在问题：紧邻的元素可能被分到不同的组中。

### 问题示例

**元素位置：**
- `机构MOB12-24` (7AB00D65): x=95, width=84, 右边缘=179
- `编组 16备份 3` (8E73971D): x=179, width=12, 左边缘=179

这两个元素紧邻（间距=0px），应该被视为一个整体放在同一个 LeftGroup 中。

**当前输出：**
```
Row
├── LeftGroup
│   ├── DS
│   ├── 矩形
│   └── 机构MOB12-24
├── 矩形备份 3
├── 营业部
├── 矩形备份 5
└── 中心
编组 16备份 3  ← 被单独放在 Row 外面！
```

**期望输出：**
```
Row
├── LeftGroup
│   ├── DS
│   ├── 矩形
│   ├── 机构MOB12-24
│   └── 编组 16备份 3  ← 应该在这里
├── 矩形备份 3
├── 营业部
├── 矩形备份 5
└── 中心
```

### 问题分析

1. `detectLeftRightGroups` 使用父元素中心线分组，但没有考虑元素之间的紧邻关系
2. 紧邻的元素（间距很小）应该被视为一个整体，不应该被中心线分割

## What Changes

### 优化 detectLeftRightGroups 逻辑

在按中心线分组之前，先检测紧邻的元素组，确保紧邻的元素不会被分割到不同的组中。

**规则：**
- 如果两个元素的间距 ≤ 10px，它们应该被视为一个整体
- 整体的归属由整体的中心点决定

## Impact

- Affected specs: `sketch-converter`
- Affected code: `src/sketch-json-converter.js` - `detectLeftRightGroups` 方法
