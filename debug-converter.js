import { SketchJSONConverter } from './src/sketch-json-converter.js';
import fs from 'fs/promises';
import path from 'path';

/**
 * 调试转换器
 */

async function debugConversion() {
    try {
        // 读取 sketch2.json 文件
        const jsonPath = path.resolve('./sketch2.json');
        console.log('📂 读取 JSON 文件:', jsonPath);

        const jsonContent = await fs.readFile(jsonPath, 'utf8');
        const sketchData = JSON.parse(jsonContent);

        console.log('\n📊 JSON 数据结构:');
        console.log('- 根元素 ID:', sketchData.id);
        console.log('- 根元素名称:', sketchData.name);
        console.log('- 根元素类型:', sketchData.type);

        if (sketchData.frame) {
            console.log('- 根元素位置:', `(${sketchData.frame.x}, ${sketchData.frame.y})`);
            console.log('- 根元素尺寸:', `${sketchData.frame.width} x ${sketchData.frame.height}`);
        }

        if (sketchData.children) {
            console.log('\n🔍 子元素分析:');
            console.log('- 子元素数量:', sketchData.children.length);

            sketchData.children.forEach((child, index) => {
                console.log(`\n  子元素 ${index + 1}:`);
                console.log('    - ID:', child.id);
                console.log('    - 名称:', child.name);
                console.log('    - 类型:', child.type);

                if (child.frame) {
                    console.log('    - 有 frame: 是');
                    console.log('    - 位置:', `(${child.frame.x || 'undefined'}, ${child.frame.y || 'undefined'})`);
                } else {
                    console.log('    - 有 frame: ❌');
                }

                if (child.children && child.children.length > 0) {
                    console.log('    - 包含子元素:', child.children.length);
                }
            });
        }

        // 创建转换器并转换
        console.log('\n🔄 开始转换...');
        const converter = new SketchJSONConverter();
        await converter.loadJSON(jsonPath);

        console.log('\n✅ 转换成功！');

        // 生成 HTML
        const html = converter.generateHTML();

        // 保存结果
        const outputPath = path.resolve('./debug-output.html');
        await fs.writeFile(outputPath, html, 'utf8');

        console.log('\n📄 HTML 文件已保存到:', outputPath);
        console.log('💡 在浏览器中打开查看效果');

    } catch (error) {
        console.error('\n❌ 错误:', error.message);
        console.error('\n📋 堆栈跟踪:');
        console.error(error.stack);
    }
}

// 运行调试
debugConversion();