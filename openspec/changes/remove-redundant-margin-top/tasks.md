## 1. 修改 optimizeChildStyle 方法

- [x] 1.1 检查父元素是否有 `alignItems: center`
- [x] 1.2 当父元素有 `alignItems: center` 时，移除子元素的 `marginTop`
- [x] 1.3 适用于所有布局类型（row、space-between 等）

## 2. 修改 transformRowWrapper 方法

- [x] 2.1 接收 `layoutInfo` 参数
- [x] 2.2 当父元素有 `alignItems: center` 时，不添加 `marginTop`

## 3. 测试验证

- [x] 3.1 测试 Row 容器在父元素有 align-items: center 时不应有 margin-top ✅
- [x] 3.2 验证父元素无 align-items: center 时保留 margin-top ✅
- [x] 3.3 验证其他样式不受影响 ✅
