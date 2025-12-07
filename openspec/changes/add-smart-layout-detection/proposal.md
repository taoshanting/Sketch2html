# Change: Add Smart Layout Detection for Flex Optimization

## Why
当前 JSON 转换逻辑使用简单的 `marginLeft`/`marginTop` 定位所有子元素，这种方式：
1. 生成的代码冗余，不利于维护
2. 不支持响应式布局
3. 没有利用 Flexbox 的强大布局能力

通过分析 sketch1.json 的目标格式，发现需要支持以下智能布局模式：

### 布局模式分析

| 模式 | 检测条件 | 父元素样式 | 子元素样式简化 |
|------|----------|------------|----------------|
| **单子元素居中** | 1个子元素，水平/垂直居中 | `alignItems: center`, `justifyContent: center` | 移除 marginLeft/marginTop/width |
| **两端对齐 (space-between)** | 2个子元素，Y坐标相同，分别靠左右 | `flexDirection: row`, `justifyContent: space-between` | 移除 marginLeft/width |
| **水平排列 (row)** | 多个子元素，Y坐标相同或接近 | `flexDirection: row`, 可选 gap | 移除 marginTop，简化 marginLeft 为 gap |
| **垂直排列 (column)** | 多个子元素，X坐标相同或接近 | `flexDirection: column`, 可选 gap | 移除 marginLeft，简化 marginTop 为 gap |
| **垂直居中对齐** | 多个子元素，X坐标居中对齐 | `alignItems: center` | 移除 marginLeft/width |

## What Changes

### 新增方法
- `detectLayoutPattern(children, parentFrame)` - 检测子元素的布局模式
- `detectAlignment(children)` - 检测子元素的对齐方式（左/中/右/两端）
- `detectSpacing(children)` - 检测子元素间距是否一致
- `createRowWrapper(children)` - 为水平排列的元素创建 Row 包装容器
- `optimizeChildStyles(child, layoutInfo)` - 根据布局模式简化子元素样式

### 修改方法
- `transformElement` - 在处理子元素前先检测布局模式，应用优化

## Impact
- Affected specs: `sketch-converter`
- Affected code: `src/sketch-json-converter.js` - JSONTransformer 类

## 检测算法

### 1. 单子元素居中检测
```
水平居中: |childX - (parentWidth - childWidth) / 2| < 5px
垂直居中: |childY - (parentHeight - childHeight) / 2| < 5px
```

### 2. 水平排列检测 (Row)
```
条件: 所有子元素的 Y 坐标差值 < 阈值 (如 10px)
```

### 3. 两端对齐检测 (space-between)
```
条件:
- 恰好 2 个子元素
- Y 坐标相同（水平排列）
- 第一个子元素靠左 (x ≈ 0 或 padding)
- 第二个子元素靠右 (x + width ≈ parentWidth 或 parentWidth - padding)
```

### 4. 间距一致性检测 (gap)
```
条件: 相邻子元素间距差值 < 阈值
结果: 使用 gap 属性替代多个 margin
```
