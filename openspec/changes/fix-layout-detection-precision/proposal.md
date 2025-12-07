# Change: Fix Layout Detection Precision

## Why

当前的智能布局检测存在以下问题：

### 问题 1：垂直排列容器错误添加 alignItems: center

当容器内有多个子元素垂直排列时，`detectLayoutPattern` 方法会错误地为所有垂直排列的容器添加 `alignItems: 'center'`。

**示例：**
- `id:906ACFDC-B064-47CA-A1C2-4AE4C9585593` - 白色卡片容器，子元素是左对齐的，不应该添加 `align-items: center`
- `id:5F871EA4-44D7-4815-A4E3-EF979B3D7052` - 内部矩形容器，同样不应该添加 `align-items: center`

### 问题 2：非居中元素的 margin 被错误移除

当元素不是真正居中时，其 `marginLeft` 和 `marginTop` 不应该被移除。

**示例：**
- `id:91A91890-30CE-4A21-9630-45B5BA218EB4` - "1人：范范" 文本，位于 x=28，不是居中的，应该保留 `marginLeft` 和 `marginTop`

### 根本原因

1. `detectLayoutPattern` 中对于垂直排列（column）的情况，无条件添加了 `alignItems: 'center'`
2. 没有真正检测子元素是否水平居中对齐

## What Changes

### 修改方法

1. **`detectLayoutPattern`** - 修改垂直排列检测逻辑
   - 移除对 column 布局无条件添加 `alignItems: 'center'` 的代码
   - 只有当子元素真正水平居中时才添加 `alignItems: 'center'`

2. **`detectHorizontalCenterAlignment`** - 新增方法
   - 检测所有子元素是否相对于父元素水平居中
   - 返回 boolean

3. **`optimizeChildStyle`** - 修改样式优化逻辑
   - 只有在确认元素居中时才移除 margin 属性
   - 对于非居中的元素，保留其定位属性

## Impact

- Affected specs: `sketch-converter`
- Affected code: `src/sketch-json-converter.js` - JSONTransformer 类

## 算法设计

### detectHorizontalCenterAlignment

```
输入: children (子元素数组), parentFrame (父元素 frame)
输出: boolean

算法:
1. 遍历所有子元素
2. 计算每个子元素相对于父元素的水平居中偏差
3. 如果所有子元素的偏差都 <= 阈值(5px)，返回 true
4. 否则返回 false
```

### 修改后的 detectLayoutPattern (column 部分)

```
原代码:
} else if (isVertical) {
    layoutInfo.type = 'column';
    layoutInfo.flexDirection = 'column';
    layoutInfo.alignItems = 'center';  // 错误：无条件添加
    ...
}

修改后:
} else if (isVertical) {
    layoutInfo.type = 'column';
    layoutInfo.flexDirection = 'column';
    // 只有当子元素真正水平居中时才添加 alignItems
    if (this.detectHorizontalCenterAlignment(children, parentFrame)) {
        layoutInfo.alignItems = 'center';
    }
    ...
}
```

## 目标输出示例

**修复前 (id:906ACFDC)：**
```css
align-items: center;  /* 错误 */
```

**修复后 (id:906ACFDC)：**
```css
/* 不添加 align-items: center */
```

**修复前 (id:91A91890)：**
```css
/* marginLeft 和 marginTop 被移除 */
```

**修复后 (id:91A91890)：**
```css
margin-left: 12px;
margin-top: 8px;
```
