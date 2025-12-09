# Change: Fix Row Element Order and Margin Calculation

## Why

当前 Row 布局中存在两个问题：

### 问题 1：子元素顺序错误

**元素位置：**
- `已勾选 0 人` (C3A70718): x=16
- `矩形` (118AF70F): x=243

**当前输出顺序：**
```
父容器 (flexDirection: row, justifyContent: space-between)
├── 矩形 (x=243)      ← 错误地排在前面
└── 已勾选 0 人 (x=16) ← 错误地排在后面
```

**期望输出顺序：**
```
父容器 (flexDirection: row, justifyContent: space-between)
├── 已勾选 0 人 (x=16)  ← 应该在左边
└── 矩形 (x=243)        ← 应该在右边
```

### 问题 2：缺少边距

- `已勾选 0 人` (x=16) 应该有 `margin-left: 16px`
- `矩形` (x=243, 父容器宽度375, 元素宽度120) 应该有 `margin-right: 12px` (375 - 243 - 120 = 12)

## What Changes

### 1. 修复子元素排序

在 `transformElement` 处理 children 时，确保按 X 坐标排序（对于 row 布局）。

### 2. 添加 margin-right 计算

对于 `justifyContent: space-between` 布局的最后一个元素，计算并添加 `margin-right`。

## Impact

- Affected specs: `sketch-converter`
- Affected code: `src/sketch-json-converter.js` - `transformElement` 方法
