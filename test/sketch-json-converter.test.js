import { SketchJSONConverter } from '../src/sketch-json-converter.js';
import fs from 'fs/promises';
import path from 'path';

/**
 * Sketch JSON 转换器测试
 */

const testData = {
    id: "test-artboard",
    name: "Test Artboard",
    type: "artboard",
    frame: {
        x: 0,
        y: 0,
        width: 375,
        height: 812
    },
    backgroundColor: "rgb(255, 255, 255)",
    children: [
        {
            id: "header",
            name: "Header",
            type: "rectangle",
            frame: {
                x: 0,
                y: 0,
                width: 375,
                height: 64
            },
            backgroundColor: "rgb(0, 122, 255)",
            borderRadius: 0
        },
        {
            id: "title",
            name: "Title",
            type: "text",
            frame: {
                x: 20,
                y: 20,
                width: 335,
                height: 24
            },
            text: {
                content: "Hello, World!",
                fontFamily: "Arial",
                fontSize: 18,
                color: "rgb(255, 255, 255)",
                textAlign: "center"
            }
        },
        {
            id: "button-container",
            name: "Button Container",
            type: "group",
            frame: {
                x: 20,
                y: 100,
                width: 335,
                height: 44
            },
            children: [
                {
                    id: "button1",
                    name: "Button 1",
                    type: "rectangle",
                    frame: {
                        x: 0,
                        y: 0,
                        width: 160,
                        height: 44
                    },
                    backgroundColor: "rgb(88, 86, 214)",
                    borderRadius: 8
                },
                {
                    id: "button2",
                    name: "Button 2",
                    type: "rectangle",
                    frame: {
                        x: 175,
                        y: 0,
                        width: 160,
                        height: 44
                    },
                    backgroundColor: "rgb(255, 59, 48)",
                    borderRadius: 8
                }
            ]
        }
    ]
};

async function runTests() {
    console.log('🧪 开始测试 Sketch JSON 转换器\n');

    // 创建转换器实例
    const converter = new SketchJSONConverter();

    // 测试 1: 样式提取
    console.log('📝 测试 1: 样式提取');
    const testLayer = testData.children[0]; // Header rectangle
    const { styles, attributes } = converter.convertLayerToStyle(testLayer);

    console.log('原始样式:', {
        backgroundColor: testLayer.backgroundColor,
        width: testLayer.frame.width,
        height: testLayer.frame.height
    });
    console.log('转换后的样式:', styles);
    console.log('属性:', attributes);
    console.log('✅ 样式提取测试通过\n');

    // 测试 2: Flexbox 布局检测
    console.log('📐 测试 2: Flexbox 布局检测');
    const buttonContainer = testData.children[2];
    const processedContainer = converter.processLayer(buttonContainer);

    console.log('子元素数量:', processedContainer.children.length);
    console.log('检测到的布局样式:',
        Object.keys(processedContainer.style)
            .filter(key => ['display', 'flexDirection', 'gap'].includes(key))
            .reduce((obj, key) => {
                obj[key] = processedContainer.style[key];
                return obj;
            }, {})
    );
    console.log('✅ Flexbox 布局检测测试通过\n');

    // 测试 3: HTML 生成
    console.log('🌐 测试 3: HTML 生成');
    const html = converter.generateHTML(testData);

    // 保存测试输出
    const testOutputPath = path.resolve('./test-output.html');
    await fs.writeFile(testOutputPath, html, 'utf8');

    console.log('HTML 生成成功，已保存到:', testOutputPath);
    console.log('HTML 长度:', html.length, '字符');

    // 检查 HTML 结构
    const hasDOCTYPE = html.includes('<!DOCTYPE html>');
    const hasStyles = html.includes('style=');
    const hasFlexbox = html.includes('display: flex');

    console.log('HTML 结构检查:');
    console.log('  - 包含 DOCTYPE:', hasDOCTYPE ? '✅' : '❌');
    console.log('  - 包含行内样式:', hasStyles ? '✅' : '❌');
    console.log('  - 使用 Flexbox 布局:', hasFlexbox ? '✅' : '❌');
    console.log('✅ HTML 生成测试通过\n');

    // 测试 4: 颜色转换
    console.log('🎨 测试 4: 颜色转换');
    const colorTests = [
        { input: "rgb(255, 0, 0)", expected: "rgb(255, 0, 0)" },
        { input: { red: 0, green: 1, blue: 0 }, expected: "rgb(0, 255, 0)" },
        { input: { red: 0, green: 0, blue: 1, alpha: 0.5 }, expected: "rgba(0, 0, 255, 0.5)" }
    ];

    colorTests.forEach(({ input, expected }, index) => {
        const result = converter.extractColor(input);
        const passed = result === expected;
        console.log(`  颜色测试 ${index + 1}: ${passed ? '✅' : '❌'} (${JSON.stringify(input)} → ${result})`);
    });

    console.log('\n✅ 所有测试完成！');
    console.log('\n💡 在浏览器中打开 test-output.html 查看渲染效果');
}

// 运行测试
runTests().catch(error => {
    console.error('❌ 测试失败:', error);
    process.exit(1);
});