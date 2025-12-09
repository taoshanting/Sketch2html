## 1. 添加图片检测逻辑

- [x] 1.1 创建 `isGroupAsImage(layer)` 方法，判断 group 是否应作为图片处理
- [x] 1.2 实现检测规则：
  - 尺寸阈值（≤48px）
  - 子元素类型（oval、shapePath、shapeGroup 等图形基元）
  - 无 text 类型子元素

## 2. 修改转换逻辑

- [x] 2.1 修改 `detectComponentName` 方法，支持 group 作为 Image
- [x] 2.2 修改 `transformElement` 方法：
  - 当 group 被识别为图片时，设置 `props.src = ""`
  - 设置 `props.alt` 为元素名称
  - 跳过 children 处理（作为原子图片）

## 3. 测试验证

- [x] 3.1 验证 `8E73971D-434F-42FD-999E-4AD594A2B6D6` 被转换为 Image 组件 ✅
- [x] 3.2 验证 `CCAD2B28-9FB8-4179-8CC9-C4469D45B2A2` 被转换为 Image 组件 ✅
- [x] 3.3 验证普通 group（如容器）不受影响 ✅
- [x] 3.4 验证包含文本的 group 不被误识别为图片 ✅
