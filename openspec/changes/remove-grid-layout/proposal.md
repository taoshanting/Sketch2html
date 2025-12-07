# Change: Remove Grid Layout, Keep Only Flexbox

## Why
当前的布局检测系统同时支持 CSS Grid 和 Flexbox 两种布局方式，且优先使用 Grid。对于大多数 UI 界面，Grid 布局检测会产生过于复杂的 `grid-template-columns/rows` 值，实际效果不如 Flexbox 直观。为了简化输出并提高 HTML 的可维护性，移除 Grid 布局检测，只保留 Flexbox。

## What Changes
- **REMOVED**: 移除 `detectGridLayout` 方法的调用
- **MODIFIED**: 布局检测只使用 Flexbox
- 保留 `detectGridLayout` 方法代码（可供未来使用），但不在 `processLayer` 中调用

## Impact
- Affected specs: `sketch-converter`
- Affected code:
  - `src/sketch-json-converter.js` - 移除 `processLayer` 中对 `detectGridLayout` 的调用
