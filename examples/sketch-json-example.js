import { SketchJSONConverter, convertSketchJSONToHTML, JSONTransformer, transformJSONToLowCode } from '../src/sketch-json-converter.js';
import path from 'path';
import fs from 'fs/promises';

/**
 * Sketch JSON 转换示例
 * 演示如何使用转换器将 sketch2.json 转换为 HTML
 */

async function convertExample() {
    // 创建转换器实例
    const converter = new SketchJSONConverter();

    try {
        // 加载 sketch2.json 文件
        const jsonPath = path.resolve('./sketch2.json');
        console.log('📂 加载 JSON 文件:', jsonPath);

        await converter.loadJSON(jsonPath);
        console.log('✅ JSON 文件加载成功！');

        // 生成 HTML
        console.log('\n🔄 正在生成 HTML...');
        const html = converter.generateHTML();

        // 保存到文件
        const outputPath = path.resolve('./output.html');
        await fs.writeFile(outputPath, html, 'utf8');

        console.log('✅ HTML 文件生成成功！');
        console.log('📄 保存位置:', outputPath);
        console.log('\n💡 直接在浏览器中打开 output.html 查看效果');

    } catch (error) {
        console.error('❌ 转换失败:', error.message);
    }
}

/**
 * 快速转换示例（使用便捷函数）
 */
async function quickConvertExample() {
    try {
        const jsonPath = path.resolve('./sketch2.json');
        const outputPath = path.resolve('./output-quick.html');

        // 使用便捷函数
        const html = await convertSketchJSONToHTML(jsonPath);
        await fs.writeFile(outputPath, html, 'utf8');

        console.log('✅ 快速转换完成！');
        console.log('📄 文件已保存到:', outputPath);

    } catch (error) {
        console.error('❌ 快速转换失败:', error.message);
    }
}

/**
 * 批量转换示例
 */
async function batchConvertExample() {
    const converter = new SketchJSONConverter();
    const jsonFiles = ['./sketch2.json', './sketch1.json']; // 要转换的文件列表

    for (const file of jsonFiles) {
        try {
            const jsonPath = path.resolve(file);
            const fileName = path.basename(file, '.json');
            const outputPath = path.resolve(`./${fileName}-output.html`);

            console.log(`\n🔄 转换 ${file}...`);
            await converter.loadJSON(jsonPath);
            const html = converter.generateHTML();
            await fs.writeFile(outputPath, html, 'utf8');

            console.log(`✅ ${fileName} 转换完成！`);

        } catch (error) {
            console.error(`❌ 转换 ${file} 失败:`, error.message);
        }
    }
}

/**
 * JSON 格式转换示例
 * 将简化的 Sketch JSON 转换为低代码格式
 */
async function transformJSONExample() {
    console.log('📦 开始 JSON 格式转换...\n');

    try {
        const jsonPath = path.resolve('./sketch2.json');
        const outputPath = path.resolve('./output-lowcode.json');

        // 使用便捷函数转换
        const lowCodeData = await transformJSONToLowCode(jsonPath);

        // 保存结果
        await fs.writeFile(outputPath, JSON.stringify(lowCodeData, null, 2), 'utf8');

        console.log('✅ JSON 格式转换成功！');
        console.log('📄 保存位置:', outputPath);

        // 打印转换结果摘要
        console.log('\n📊 转换结果摘要:');
        console.log('  - 根元素 ID:', lowCodeData.id);
        console.log('  - 根元素名称:', lowCodeData.name);
        console.log('  - 组件类型:', lowCodeData.componentName);
        console.log('  - 低代码类型:', lowCodeData.lowcodeType);
        console.log('  - 子元素数量:', lowCodeData.children?.length || 0);

        // 打印样式示例
        if (lowCodeData.props?.style) {
            console.log('\n📐 根元素样式:');
            Object.entries(lowCodeData.props.style).forEach(([key, value]) => {
                console.log(`    ${key}: ${value}`);
            });
        }

        console.log('\n💡 转换后的 JSON 可用于低代码平台或进一步处理');

    } catch (error) {
        console.error('❌ JSON 格式转换失败:', error.message);
    }
}

/**
 * JSON 转换器详细示例（使用类实例）
 */
async function transformJSONDetailedExample() {
    console.log('🔧 JSON 转换器详细示例...\n');

    const transformer = new JSONTransformer();

    try {
        // 加载源 JSON
        const jsonPath = path.resolve('./sketch2.json');
        const fileContent = await fs.readFile(jsonPath, 'utf8');
        const sourceData = JSON.parse(fileContent);

        console.log('📂 源数据信息:');
        console.log('  - 名称:', sourceData.name);
        console.log('  - 类型:', sourceData.type);
        console.log('  - 子元素数量:', sourceData.children?.length || 0);

        // 转换
        const result = transformer.transform(sourceData);

        console.log('\n📦 转换后数据信息:');
        console.log('  - componentName:', result.componentName);
        console.log('  - className:', result.props.className);
        console.log('  - lowcodeType:', result.lowcodeType);
        console.log('  - 重组后子元素数量:', result.children?.length || 0);

        // 展示第一个子元素的详细信息
        if (result.children && result.children.length > 0) {
            const firstChild = result.children[0];
            console.log('\n📋 第一个子元素详情:');
            console.log('  - id:', firstChild.id);
            console.log('  - name:', firstChild.name);
            console.log('  - componentName:', firstChild.componentName);
            console.log('  - parentId:', firstChild.parentId);
            console.log('  - isLeaf:', firstChild.isLeaf);
            console.log('  - 样式:', JSON.stringify(firstChild.props.style, null, 4));
        }

        console.log('\n✅ 详细转换示例完成！');

    } catch (error) {
        console.error('❌ 详细转换失败:', error.message);
    }
}

// 运行示例
console.log('🎨 Sketch JSON 转换器示例\n');

console.log('1. 基础转换示例 (JSON → HTML):');
await convertExample();

console.log('\n' + '='.repeat(50) + '\n');

console.log('2. JSON 格式转换示例 (简化 JSON → 低代码格式):');
await transformJSONExample();

// console.log('\n' + '='.repeat(50) + '\n');

// console.log('3. 快速转换示例:');
// await quickConvertExample();

// console.log('\n' + '='.repeat(50) + '\n');

// console.log('4. 批量转换示例:');
// await batchConvertExample();

// console.log('\n' + '='.repeat(50) + '\n');

// console.log('5. JSON 转换器详细示例:');
// await transformJSONDetailedExample();