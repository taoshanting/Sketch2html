## 1. 移除 Grid 布局调用

- [x] 1.1 在 `processLayer` 方法中移除对 `detectGridLayout` 的调用
- [x] 1.2 移除 Grid 优先的布局应用逻辑，改为只应用 Flexbox

## 2. 测试验证

- [x] 2.1 重新转换 sketch2.json 生成新的 HTML 输出
- [x] 2.2 验证输出只使用 Flexbox 布局或绝对定位
- [x] 2.3 确认无 `display: grid` 样式出现
