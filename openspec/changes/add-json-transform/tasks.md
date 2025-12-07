## 1. 核心转换逻辑

- [x] 1.1 新增 `transformToLowCodeFormat` 方法，将简化 JSON 转换为低代码格式
- [x] 1.2 实现 `buildPropsStyle` 方法，将 frame/backgroundColor/borderRadius 等转换为 props.style
- [x] 1.3 实现 `detectComponentName` 方法，根据 type 映射 componentName（rectangle→Div, text→Text, symbolInstance→Image）
- [x] 1.4 实现 `generateClassName` 方法，生成唯一的 className

## 2. 层级重组逻辑

- [x] 2.1 实现 `detectContainment` 方法，检测元素的包含关系（基于位置判断 A 是否在 B 内部）
- [x] 2.2 实现 `reorganizeHierarchy` 方法，将平级元素重组为嵌套层级
- [x] 2.3 计算相对边距 marginTop/marginLeft（基于父元素或前一个兄弟元素的位置）

## 3. 样式转换

- [x] 3.1 颜色格式转换：rgb() → rgba()
- [x] 3.2 尺寸格式转换：数字 → 带 px 单位的字符串
- [x] 3.3 添加默认 flexbox 属性：display:flex, flexDirection, alignItems, justifyContent

## 4. MCP 工具集成

- [x] 4.1 新增 `transformJSON` MCP 工具
- [x] 4.2 支持输入文件路径或 JSON 对象
- [x] 4.3 返回转换后的低代码格式 JSON

## 5. 测试验证

- [x] 5.1 使用 sketch2.json 测试转换
- [x] 5.2 对比输出与 sketch1.json 格式的一致性
- [x] 5.3 验证层级重组正确性
