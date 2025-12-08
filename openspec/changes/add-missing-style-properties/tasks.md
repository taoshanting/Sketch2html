## 1. 新增 parseOpacity 方法

- [x] 1.1 新增 `parseOpacity(opacity)` 方法
- [x] 1.2 处理 number 类型直接返回
- [x] 1.3 处理 BigDecimal 对象格式 `{s, e, c}` 解析为数值
- [x] 1.4 处理 undefined 返回默认值 1

## 2. 新增 parseBorder 方法

- [x] 2.1 新增 `parseBorder(border)` 方法
- [x] 2.2 提取 width、color 属性
- [x] 2.3 将 color 转换为 rgba 格式
- [x] 2.4 返回 CSS border 字符串格式

## 3. 修改 buildPropsStyle 方法

- [x] 3.1 使用 `parseOpacity` 处理 opacity 属性
- [x] 3.2 添加 `background` 渐变背景处理
- [x] 3.3 添加 `border` 边框处理

## 4. 测试验证

- [x] 4.1 测试 id:6BAF2986 - opacity 应为 0.7 ✅ (0.69999998807907)
- [x] 4.2 测试 id:6BAF2986 - background 应为渐变 ✅
- [x] 4.3 测试 id:1A446D9A - border 应为 1px solid rgba(231,231,231,1) ✅
- [x] 4.4 验证其他元素样式不受影响 ✅
