# Change: Fix Missing Elements in Hierarchy Reorganization

## Why

在层级重组过程中，某些元素被丢失了。

### 问题示例

**丢失的元素：**
- `DS` (D4EBCF45): x=43, y=328, width=42, height=20
- `机构MOB12-24` (7AB00D65): x=95, y=328, width=84, height=20
- `营业部` (25B9DABF): x=199, y=328, width=69, height=20
- `中心` (FA556844): x=274, y=328, width=?, height=20

**容器元素：**
- `0EBBFC0B`: x=34, y=325, width=307, height=48 (范围: x:34-341, y:325-373)

这些文本元素完全在容器范围内，应该被检测为容器的子元素，但在输出中丢失了。

### 可能原因

1. `reorganizeHierarchy` 中的包含检测可能有边界条件问题
2. 元素被分配到某个容器后，在递归处理中丢失
3. 行分组逻辑可能导致某些元素被跳过

## What Changes

### 调查和修复

1. 调试 `reorganizeHierarchy` 方法，找出元素丢失的具体原因
2. 修复包含检测或递归处理中的问题

## Impact

- Affected specs: `sketch-converter`
- Affected code: `src/sketch-json-converter.js` - JSONTransformer 类
