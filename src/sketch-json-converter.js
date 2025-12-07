import fs from 'fs/promises';
import path from 'path';

/**
 * Sketch JSON 到 HTML 转换器
 * 将 Sketch JSON 文件转换为带有行内样式的 HTML 代码
 */
export class SketchJSONConverter {
    constructor() {
        this.sketchData = null;
        this.images = new Map();
        this.classNameCounters = {
            view: 0,
            text: 0,
            imageView: 0
        };
    }

    /**
     * 加载并解析 Sketch JSON 文件
     * @param {string} filePath - JSON 文件路径
     * @returns {Promise<Object>} 解析后的数据
     */
    async loadJSON(filePath) {
        try {
            const fileContent = await fs.readFile(filePath, 'utf8');
            this.sketchData = JSON.parse(fileContent);
            return this.sketchData;
        } catch (error) {
            throw new Error(`加载 JSON 文件失败: ${error.message}`);
        }
    }

    /**
     * 提取颜色值
     * @param {string|Object} color - 颜色值或颜色对象
     * @returns {string} CSS 颜色值
     */
    extractColor(color) {
        if (!color) return 'transparent';

        // 如果是字符串格式（如 "rgb(0, 0, 0)"）
        if (typeof color === 'string') return color;

        // 如果是对象格式
        if (typeof color === 'object') {
            if (color.red !== undefined && color.green !== undefined && color.blue !== undefined) {
                const r = Math.round((color.red || 0) * 255);
                const g = Math.round((color.green || 0) * 255);
                const b = Math.round((color.blue || 0) * 255);
                const a = color.alpha !== undefined ? color.alpha : 1;

                if (a < 1) {
                    return `rgba(${r}, ${g}, ${b}, ${a})`;
                }
                return `rgb(${r}, ${g}, ${b})`;
            }
        }

        return 'transparent';
    }

    /**
     * 提取阴影样式
     * @param {Array} shadows - 阴影数组
     * @returns {string} CSS box-shadow 值
     */
    extractShadows(shadows) {
        if (!shadows || !Array.isArray(shadows) || shadows.length === 0) return '';

        return shadows.map(shadow => {
            const x = shadow.x || 0;
            const y = shadow.y || 0;
            const blur = shadow.blur || 0;
            const spread = shadow.spread || 0;
            const color = this.extractColor(shadow.color);

            return `${x}px ${y}px ${blur}px ${spread}px ${color}`;
        }).join(', ');
    }

    /**
     * 转换图层为行内样式
     * @param {Object} layer - Sketch 图层对象
     * @returns {Object} 包含样式和属性的对象
     */
    convertLayerToStyle(layer) {
        const styles = {};
        const attributes = {};

        // 基础属性
        attributes.id = layer.id || '';
        attributes['data-name'] = layer.name || '';

        // 位置和尺寸
        if (layer.frame && layer.frame !== null && typeof layer.frame === 'object') {
            const { x = 0, y = 0, width = 0, height = 0 } = layer.frame;

            // 只有在需要绝对定位时才设置
            if (x !== 0 || y !== 0) {
                styles.position = 'absolute';
                styles.left = `${x}px`;
                styles.top = `${y}px`;
            }

            // 只有宽高大于0时才设置
            if (width > 0) styles.width = `${width}px`;
            if (height > 0) styles.height = `${height}px`;
        }

        // 背景色
        if (layer.backgroundColor) {
            styles.backgroundColor = this.extractColor(layer.backgroundColor);
        }

        // 边框圆角
        if (layer.borderRadius && layer.borderRadius > 0) {
            styles.borderRadius = `${layer.borderRadius}px`;
        }

        // 边框
        if (layer.borders && layer.borders.length > 0) {
            const border = layer.borders[0];
            if (border.isEnabled !== false) {
                const width = border.thickness || 1;
                const color = this.extractColor(border.color);
                styles.border = `${width}px solid ${color}`;
            }
        }

        // 阴影
        const shadows = this.extractShadows(layer.shadows || layer.innerShadows);
        if (shadows) {
            styles.boxShadow = shadows;
        }

        // 透明度
        if (layer.opacity && layer.opacity < 1) {
            styles.opacity = layer.opacity;
        }

        // 文本样式
        if (layer.type === 'text' && layer.text) {
            const text = layer.text;

            // 文本内容
            attributes.textContent = text.content || '';

            // 字体
            if (text.fontFamily) {
                styles.fontFamily = text.fontFamily;
            }
            if (text.fontSize) {
                styles.fontSize = `${text.fontSize}px`;
            }
            if (text.color) {
                styles.color = this.extractColor(text.color);
            }
            if (text.textAlign) {
                styles.textAlign = text.textAlign;
            }
            if (text.letterSpacing !== undefined && text.letterSpacing !== 0) {
                styles.letterSpacing = `${text.letterSpacing}px`;
            }

            // 处理行高
            if (text.lineHeight) {
                styles.lineHeight = typeof text.lineHeight === 'number'
                    ? `${text.lineHeight}px`
                    : text.lineHeight;
            }
        }

        return { styles, attributes };
    }

    /**
     * 检测单子元素的居中状态
     * @param {Object} childFrame - 子元素 frame
     * @param {Object} parentFrame - 父元素 frame
     * @param {number} threshold - 居中检测阈值（默认 5px）
     * @returns {Object} { horizontalCenter: boolean, verticalCenter: boolean }
     */
    detectCentering(childFrame, parentFrame, threshold = 5) {
        if (!childFrame || !parentFrame) {
            return { horizontalCenter: false, verticalCenter: false };
        }

        const relativeX = childFrame.x - parentFrame.x;
        const relativeY = childFrame.y - parentFrame.y;
        const expectedCenterX = (parentFrame.width - childFrame.width) / 2;
        const expectedCenterY = (parentFrame.height - childFrame.height) / 2;

        return {
            horizontalCenter: Math.abs(relativeX - expectedCenterX) <= threshold,
            verticalCenter: Math.abs(relativeY - expectedCenterY) <= threshold
        };
    }

    /**
     * 检测水平对齐方式（用于 space-between 检测）
     * @param {Array} children - 子元素数组
     * @param {Object} parentFrame - 父元素 frame
     * @returns {string} 'space-between' | 'none'
     */
    detectSpaceBetween(children, parentFrame) {
        if (!children || children.length !== 2 || !parentFrame) return 'none';

        const sorted = [...children].sort((a, b) => (a.frame?.x || 0) - (b.frame?.x || 0));
        const first = sorted[0];
        const last = sorted[1];

        const firstRelativeX = (first.frame?.x || 0) - parentFrame.x;
        const lastRightEdge = (last.frame?.x || 0) + (last.frame?.width || 0) - parentFrame.x;

        const isFirstAtLeft = firstRelativeX <= 25;
        const isLastAtRight = Math.abs(lastRightEdge - parentFrame.width) <= 25;

        if (isFirstAtLeft && isLastAtRight) {
            return 'space-between';
        }
        return 'none';
    }

    /**
     * 检测并应用智能 Flexbox 布局
     * @param {Array} children - 子元素数组
     * @param {Object} parentFrame - 父元素 frame（用于居中检测）
     * @returns {Object} Flexbox 样式和布局信息
     */
    detectFlexboxLayout(children, parentFrame = null) {
        if (!children || children.length === 0) return {};

        const validChildren = children.filter(child => child.frame);
        if (validChildren.length === 0) return {};

        const styles = {};
        let layoutType = 'default';

        // 单子元素居中检测
        if (validChildren.length === 1 && parentFrame) {
            const centering = this.detectCentering(validChildren[0].frame, parentFrame);
            if (centering.horizontalCenter || centering.verticalCenter) {
                styles.display = 'flex';
                styles.flexDirection = 'column';
                layoutType = 'single-center';

                if (centering.horizontalCenter) {
                    styles.alignItems = 'center';
                }
                if (centering.verticalCenter) {
                    styles.justifyContent = 'center';
                }

                // 简化子元素样式
                validChildren.forEach(child => {
                    if (child.style) {
                        delete child.style.position;
                        delete child.style.left;
                        delete child.style.top;
                        if (centering.horizontalCenter) {
                            delete child.style.marginLeft;
                        }
                        if (centering.verticalCenter) {
                            delete child.style.marginTop;
                        }
                    }
                });

                return { ...styles, _layoutType: layoutType };
            }
        }

        // 多子元素布局检测
        if (validChildren.length >= 2) {
            const positions = validChildren.map(child => child.frame);

            // 检测水平排列（所有元素的 y 值相近）
            const yValues = positions.map(p => p.y);
            const minY = Math.min(...yValues);
            const maxY = Math.max(...yValues);
            const isHorizontal = (maxY - minY) <= 10;

            // 检测垂直排列（所有元素的 x 值相近）
            const xValues = positions.map(p => p.x);
            const minX = Math.min(...xValues);
            const maxX = Math.max(...xValues);
            const isVertical = (maxX - minX) <= 10;

            if (isHorizontal && parentFrame) {
                styles.display = 'flex';
                styles.flexDirection = 'row';

                // 检测 space-between
                const alignment = this.detectSpaceBetween(validChildren, parentFrame);
                if (alignment === 'space-between') {
                    styles.justifyContent = 'space-between';
                    layoutType = 'space-between';

                    // 检测垂直居中
                    const allCentered = validChildren.every(child => {
                        const relativeY = (child.frame?.y || 0) - parentFrame.y;
                        const expectedCenterY = (parentFrame.height - (child.frame?.height || 0)) / 2;
                        return Math.abs(relativeY - expectedCenterY) <= 10;
                    });
                    if (allCentered) {
                        styles.alignItems = 'center';
                    }

                    // 简化子元素样式
                    validChildren.forEach(child => {
                        if (child.style) {
                            delete child.style.position;
                            delete child.style.left;
                            delete child.style.top;
                            delete child.style.marginLeft;
                            delete child.style.marginTop;
                        }
                    });
                } else {
                    layoutType = 'row';
                    // 计算间距
                    const sortedByX = [...positions].sort((a, b) => a.x - b.x);
                    const gaps = [];
                    for (let i = 1; i < sortedByX.length; i++) {
                        const gap = sortedByX[i].x - (sortedByX[i-1].x + sortedByX[i-1].width);
                        if (gap >= 0) gaps.push(gap);
                    }

                    if (gaps.length > 0) {
                        const avgGap = gaps.reduce((sum, g) => sum + g, 0) / gaps.length;
                        const isConsistent = gaps.every(g => Math.abs(g - avgGap) <= 3);
                        if (isConsistent && avgGap > 0) {
                            styles.gap = `${Math.round(avgGap)}px`;
                        }
                    }

                    // 移除子元素的绝对定位
                    children.forEach(child => {
                        if (child.style) {
                            delete child.style.position;
                            delete child.style.left;
                            delete child.style.top;
                        }
                    });
                }
            } else if (isVertical) {
                styles.display = 'flex';
                styles.flexDirection = 'column';
                layoutType = 'column';

                // 计算间距
                const sortedByY = [...positions].sort((a, b) => a.y - b.y);
                const gaps = [];
                for (let i = 1; i < sortedByY.length; i++) {
                    const gap = sortedByY[i].y - (sortedByY[i-1].y + sortedByY[i-1].height);
                    if (gap >= 0) gaps.push(gap);
                }

                if (gaps.length > 0) {
                    const avgGap = gaps.reduce((sum, g) => sum + g, 0) / gaps.length;
                    const isConsistent = gaps.every(g => Math.abs(g - avgGap) <= 3);
                    if (isConsistent && avgGap > 0) {
                        styles.gap = `${Math.round(avgGap)}px`;
                    }
                }

                // 移除子元素的绝对定位
                children.forEach(child => {
                    if (child.style) {
                        delete child.style.position;
                        delete child.style.left;
                        delete child.style.top;
                    }
                });
            }
        }

        return styles;
    }

    /**
     * 检测并应用 Grid 布局
     * @param {Array} children - 子元素数组
     * @returns {Object} Grid 样式
     */
    detectGridLayout(children) {
        if (!children || children.length < 4) return {};

        // 过滤出有 frame 属性的子元素
        const validChildren = children.filter(child => child.frame);
        if (validChildren.length < 4) return {};

        const positions = validChildren.map(child => child.frame);

        // 简单的网格检测：查找多个行和列
        const uniqueXValues = [...new Set(positions.map(p => p.x))].sort((a, b) => a - b);
        const uniqueYValues = [...new Set(positions.map(p => p.y))].sort((a, b) => a - b);

        if (uniqueXValues.length > 1 && uniqueYValues.length > 1) {
            const styles = {
                display: 'grid'
            };

            // 计算列宽
            const columnWidths = [];
            for (let i = 0; i < uniqueXValues.length - 1; i++) {
                const x = uniqueXValues[i];
                const elementsAtX = children.filter(c => c.frame.x === x);
                if (elementsAtX.length > 0) {
                    columnWidths.push(`${elementsAtX[0].frame.width}px`);
                }
            }
            // 最后一列
            const lastX = uniqueXValues[uniqueXValues.length - 1];
            const lastElements = children.filter(c => c.frame.x === lastX);
            if (lastElements.length > 0) {
                columnWidths.push(`${lastElements[0].frame.width}px`);
            }

            if (columnWidths.length > 0) {
                styles.gridTemplateColumns = columnWidths.join(' ');
            }

            // 计算行高
            const rowHeights = [];
            for (let i = 0; i < uniqueYValues.length - 1; i++) {
                const y = uniqueYValues[i];
                const elementsAtY = children.filter(c => c.frame.y === y);
                if (elementsAtY.length > 0) {
                    rowHeights.push(`${elementsAtY[0].frame.height}px`);
                }
            }
            // 最后一行
            const lastY = uniqueYValues[uniqueYValues.length - 1];
            const lastRowElements = children.filter(c => c.frame.y === lastY);
            if (lastRowElements.length > 0) {
                rowHeights.push(`${lastRowElements[0].frame.height}px`);
            }

            if (rowHeights.length > 0) {
                styles.gridTemplateRows = rowHeights.join(' ');
            }

            // 计算间距
            if (uniqueXValues.length > 1) {
                const gaps = [];
                for (let i = 1; i < uniqueXValues.length; i++) {
                    gaps.push(uniqueXValues[i] - uniqueXValues[i-1]);
                }
                if (gaps.length > 0) {
                    const avgGap = gaps.reduce((sum, g) => sum + g, 0) / gaps.length;
                    styles.gap = `${Math.round(avgGap)}px`;
                }
            }

            // 移除子元素的定位
            children.forEach(child => {
                if (child.style) {
                    delete child.style.position;
                    delete child.style.left;
                    delete child.style.top;
                }
            });

            return styles;
        }

        return {};
    }

    /**
     * 递归处理图层及其子元素
     * @param {Object} layer - 图层对象
     * @param {number} depth - 递归深度
     * @returns {Object} 处理后的元素数据
     */
    processLayer(layer, depth = 0) {
        const element = {
            type: layer.type || 'group',
            name: layer.name || '',
            children: [],
            frame: layer.frame || null // 保留 frame 信息用于布局检测
        };

        // 转换样式
        const { styles, attributes } = this.convertLayerToStyle(layer);
        element.style = styles;
        element.attributes = attributes;

        // 处理子元素
        if (layer.children && Array.isArray(layer.children)) {
            const processedChildren = layer.children.map(child => this.processLayer(child, depth + 1));

            // 检测布局（传递父元素 frame 用于居中和 space-between 检测）
            const flexboxStyles = this.detectFlexboxLayout(processedChildren, layer.frame);

            // 应用 Flexbox 布局
            if (Object.keys(flexboxStyles).length > 0) {
                // 移除内部标记
                delete flexboxStyles._layoutType;
                Object.assign(element.style, flexboxStyles);
            }

            element.children = processedChildren;
        }

        return element;
    }

    /**
     * 生成 HTML 元素
     * @param {Object} element - 元素数据
     * @returns {string} HTML 字符串
     */
    generateHTMLElement(element) {
        // 根据类型选择标签
        let tagName = 'div';
        let isSelfClosing = false;

        switch (element.type) {
            case 'text':
                tagName = element.attributes.textContent ? 'span' : 'div';
                break;
            case 'artboard':
                tagName = 'div';
                break;
            case 'rectangle':
                tagName = 'div';
                break;
            case 'symbolInstance':
                tagName = 'img';
                isSelfClosing = true;
                break;
            default:
                tagName = 'div';
        }

        // 构建属性
        let attributes = [];

        // ID
        if (element.attributes.id) {
            attributes.push(`id="${element.attributes.id}"`);
        }

        // 数据属性
        if (element.attributes['data-name']) {
            attributes.push(`data-name="${element.attributes['data-name']}"`);
        }

        // 对于 img 标签，添加 src 和 alt 属性
        if (tagName === 'img') {
            attributes.push(`src=""`);
            attributes.push(`alt="${element.name || element.attributes['data-name'] || ''}"`);
        }

        // 样式
        if (element.style && Object.keys(element.style).length > 0) {
            const styleString = Object.entries(element.style)
                .map(([key, value]) => `${this.camelToKebab(key)}: ${value}`)
                .join('; ');
            attributes.push(`style="${styleString}"`);
        }

        // 生成 HTML
        if (isSelfClosing) {
            // img 标签使用自闭合格式
            return `<${tagName}${attributes.length > 0 ? ' ' + attributes.join(' ') : ''} />`;
        }

        // 开始标签
        let html = `<${tagName}${attributes.length > 0 ? ' ' + attributes.join(' ') : ''}>`;

        // 文本内容（如果有）
        if (element.attributes.textContent) {
            html += element.attributes.textContent;
        }

        // 子元素
        if (element.children && element.children.length > 0) {
            element.children.forEach(child => {
                html += this.generateHTMLElement(child);
            });
        }

        // 结束标签
        html += `</${tagName}>`;

        return html;
    }

    /**
     * 驼峰转短横线
     * @param {string} str - 驼峰字符串
     * @returns {string} 短横线字符串
     */
    camelToKebab(str) {
        return str.replace(/([A-Z])/g, '-$1').toLowerCase();
    }

    /**
     * 从低代码格式元素生成 HTML
     * @param {Object} element - 低代码格式元素
     * @param {number} indent - 缩进级别
     * @returns {string} HTML 字符串
     */
    generateHTMLFromLowCode(element, indent = 0) {
        const indentStr = '  '.repeat(indent);

        // 根据 componentName 选择标签
        let tagName = 'div';
        let isSelfClosing = false;

        switch (element.componentName) {
            case 'Text':
                tagName = 'span';
                break;
            case 'Image':
                tagName = 'img';
                isSelfClosing = true;
                break;
            default:
                tagName = 'div';
        }

        // 构建属性
        const attributes = [];

        // ID
        if (element.id) {
            attributes.push(`id="${element.id}"`);
        }

        // data-name
        if (element.name) {
            attributes.push(`data-name="${element.name}"`);
        }

        // 对于 img 标签，添加 src 和 alt
        if (tagName === 'img') {
            attributes.push(`src="${element.props?.src || ''}"`);
            attributes.push(`alt="${element.name || ''}"`);
        }

        // 样式
        if (element.props?.style && Object.keys(element.props.style).length > 0) {
            const styleString = Object.entries(element.props.style)
                .map(([key, value]) => `${this.camelToKebab(key)}: ${value}`)
                .join('; ');
            attributes.push(`style="${styleString}"`);
        }

        // 生成 HTML
        if (isSelfClosing) {
            return `${indentStr}<${tagName}${attributes.length > 0 ? ' ' + attributes.join(' ') : ''} />`;
        }

        let html = `${indentStr}<${tagName}${attributes.length > 0 ? ' ' + attributes.join(' ') : ''}>`;

        // 文本内容
        if (element.props?.text) {
            html += element.props.text;
        }

        // 子元素
        if (element.children && element.children.length > 0) {
            html += '\n';
            element.children.forEach(child => {
                html += this.generateHTMLFromLowCode(child, indent + 1) + '\n';
            });
            html += indentStr;
        }

        html += `</${tagName}>`;

        return html;
    }

    /**
     * 生成完整的 HTML 文档
     * @param {Object} sketchData - Sketch 数据
     * @returns {string} HTML 文档字符串
     */
    generateHTML(sketchData = null) {
        const data = sketchData || this.sketchData;
        if (!data) {
            throw new Error('没有可用的 Sketch 数据，请先加载 JSON 文件');
        }

        // 使用 JSONTransformer 进行智能布局转换
        const transformer = new JSONTransformer();
        const lowCodeElement = transformer.transform(data);

        // 从低代码格式生成 HTML
        const bodyHTML = this.generateHTMLFromLowCode(lowCodeElement, 1);

        // 完整的 HTML 文档
        const htmlDocument = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sketch Design</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
    </style>
</head>
<body>
${bodyHTML}
</body>
</html>`;

        return htmlDocument;
    }
}

// 导出便捷函数
export async function convertSketchJSONToHTML(filePath) {
    const converter = new SketchJSONConverter();
    await converter.loadJSON(filePath);
    return converter.generateHTML();
}

/**
 * JSON 格式转换器
 * 将简化的 Sketch JSON 转换为低代码格式
 */
export class JSONTransformer {
    constructor() {
        this.classNameCounters = {
            view: 0,
            text: 0,
            imageView: 0
        };
    }

    /**
     * 重置 className 计数器
     */
    resetCounters() {
        this.classNameCounters = {
            view: 0,
            text: 0,
            imageView: 0
        };
    }

    /**
     * 将 rgb() 颜色转换为 rgba() 格式
     * @param {string} color - rgb 颜色字符串
     * @returns {string} rgba 颜色字符串
     */
    convertToRgba(color) {
        if (!color) return 'transparent';

        // 已经是 rgba 格式
        if (color.startsWith('rgba')) return color;

        // rgb 格式转换为 rgba
        const rgbMatch = color.match(/rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/);
        if (rgbMatch) {
            return `rgba(${rgbMatch[1]},${rgbMatch[2]},${rgbMatch[3]},1)`;
        }

        return color;
    }

    /**
     * 根据 type 检测 componentName
     * @param {string} type - 元素类型
     * @returns {string} componentName
     */
    detectComponentName(type) {
        switch (type) {
            case 'text':
                return 'Text';
            case 'symbolInstance':
                return 'Image';
            case 'rectangle':
            case 'artboard':
            case 'group':
            default:
                return 'Div';
        }
    }

    /**
     * 生成唯一的 className
     * @param {string} componentName - 组件名称
     * @returns {string} className
     */
    generateClassName(componentName) {
        let prefix;
        switch (componentName) {
            case 'Text':
                prefix = 'text';
                break;
            case 'Image':
                prefix = 'imageView';
                break;
            default:
                prefix = 'view';
        }

        this.classNameCounters[prefix]++;
        return `${prefix}_${this.classNameCounters[prefix]}`;
    }

    /**
     * 检测元素 A 是否被元素 B 包含
     * @param {Object} frameA - 元素 A 的 frame
     * @param {Object} frameB - 元素 B 的 frame
     * @returns {boolean} A 是否在 B 内部
     */
    detectContainment(frameA, frameB) {
        if (!frameA || !frameB) return false;

        return (
            frameA.x >= frameB.x &&
            frameA.y >= frameB.y &&
            frameA.x + frameA.width <= frameB.x + frameB.width &&
            frameA.y + frameA.height <= frameB.y + frameB.height
        );
    }

    // ==================== 智能布局检测方法 ====================

    /**
     * 检测单子元素的居中状态
     * @param {Object} childFrame - 子元素 frame
     * @param {Object} parentFrame - 父元素 frame
     * @param {number} threshold - 居中检测阈值（默认 5px）
     * @returns {Object} { horizontalCenter: boolean, verticalCenter: boolean }
     */
    detectCentering(childFrame, parentFrame, threshold = 5) {
        if (!childFrame || !parentFrame) {
            return { horizontalCenter: false, verticalCenter: false };
        }

        // 计算子元素相对于父元素的位置
        const relativeX = childFrame.x - parentFrame.x;
        const relativeY = childFrame.y - parentFrame.y;

        // 计算居中位置
        const expectedCenterX = (parentFrame.width - childFrame.width) / 2;
        const expectedCenterY = (parentFrame.height - childFrame.height) / 2;

        return {
            horizontalCenter: Math.abs(relativeX - expectedCenterX) <= threshold,
            verticalCenter: Math.abs(relativeY - expectedCenterY) <= threshold
        };
    }

    /**
     * 检测子元素是否水平排列（Y坐标接近）
     * @param {Array} children - 子元素数组
     * @param {number} threshold - Y坐标差值阈值（默认 10px）
     * @returns {boolean}
     */
    isHorizontallyAligned(children, threshold = 10) {
        if (!children || children.length < 2) return false;

        const yValues = children.map(c => c.frame?.y || 0);
        const minY = Math.min(...yValues);
        const maxY = Math.max(...yValues);

        return (maxY - minY) <= threshold;
    }

    /**
     * 检测子元素是否垂直排列（X坐标接近）
     * @param {Array} children - 子元素数组
     * @param {number} threshold - X坐标差值阈值（默认 10px）
     * @returns {boolean}
     */
    isVerticallyAligned(children, threshold = 10) {
        if (!children || children.length < 2) return false;

        const xValues = children.map(c => c.frame?.x || 0);
        const minX = Math.min(...xValues);
        const maxX = Math.max(...xValues);

        return (maxX - minX) <= threshold;
    }

    /**
     * 检测水平对齐方式
     * @param {Array} children - 子元素数组
     * @param {Object} parentFrame - 父元素 frame
     * @param {number} threshold - 边缘检测阈值（默认 5px）
     * @returns {string} 'left' | 'center' | 'right' | 'space-between' | 'none'
     */
    detectHorizontalAlignment(children, parentFrame, threshold = 5) {
        if (!children || children.length === 0 || !parentFrame) return 'none';

        // 按 X 坐标排序
        const sorted = [...children].sort((a, b) => (a.frame?.x || 0) - (b.frame?.x || 0));
        const first = sorted[0];
        const last = sorted[sorted.length - 1];

        const firstRelativeX = (first.frame?.x || 0) - parentFrame.x;
        const lastRightEdge = (last.frame?.x || 0) + (last.frame?.width || 0) - parentFrame.x;

        const isFirstAtLeft = firstRelativeX <= threshold + 20; // 允许一些 padding
        const isLastAtRight = Math.abs(lastRightEdge - parentFrame.width) <= threshold + 20;

        // 两端对齐检测
        if (children.length === 2 && isFirstAtLeft && isLastAtRight) {
            return 'space-between';
        }

        // 居中对齐检测（所有元素的中心点接近父元素中心）
        const childrenTotalWidth = children.reduce((sum, c) => sum + (c.frame?.width || 0), 0);
        const gaps = children.length > 1 ?
            sorted.slice(1).reduce((sum, c, i) => {
                const prevRight = (sorted[i].frame?.x || 0) + (sorted[i].frame?.width || 0);
                return sum + ((c.frame?.x || 0) - prevRight);
            }, 0) : 0;
        const totalContentWidth = childrenTotalWidth + gaps;
        const expectedStartX = (parentFrame.width - totalContentWidth) / 2;

        if (Math.abs(firstRelativeX - expectedStartX) <= threshold) {
            return 'center';
        }

        if (isFirstAtLeft) return 'left';
        if (isLastAtRight) return 'right';

        return 'none';
    }

    /**
     * 检测垂直对齐方式
     * @param {Array} children - 子元素数组
     * @param {Object} parentFrame - 父元素 frame
     * @param {number} threshold - 边缘检测阈值（默认 5px）
     * @returns {string} 'top' | 'center' | 'bottom' | 'none'
     */
    detectVerticalAlignment(children, parentFrame, threshold = 5) {
        if (!children || children.length === 0 || !parentFrame) return 'none';

        // 检测所有子元素是否垂直居中
        const allCentered = children.every(child => {
            const relativeY = (child.frame?.y || 0) - parentFrame.y;
            const expectedCenterY = (parentFrame.height - (child.frame?.height || 0)) / 2;
            return Math.abs(relativeY - expectedCenterY) <= threshold;
        });

        if (allCentered) return 'center';

        // 检测是否顶部对齐
        const allTop = children.every(child => {
            const relativeY = (child.frame?.y || 0) - parentFrame.y;
            return relativeY <= threshold + 20;
        });

        if (allTop) return 'top';

        return 'none';
    }

    /**
     * 检测所有子元素是否水平居中对齐
     * @param {Array} children - 子元素数组
     * @param {Object} parentFrame - 父元素 frame
     * @param {number} threshold - 居中检测阈值（默认 5px）
     * @returns {boolean} 是否所有子元素都水平居中
     */
    detectHorizontalCenterAlignment(children, parentFrame, threshold = 5) {
        if (!children || children.length === 0 || !parentFrame) return false;

        return children.every(child => {
            if (!child.frame) return false;

            // 计算子元素相对于父元素的 X 位置
            const relativeX = child.frame.x - parentFrame.x;
            // 计算期望的居中位置
            const expectedCenterX = (parentFrame.width - child.frame.width) / 2;
            // 检查是否在阈值范围内
            return Math.abs(relativeX - expectedCenterX) <= threshold;
        });
    }

    /**
     * 检测一致的间距
     * @param {Array} children - 子元素数组
     * @param {string} direction - 'horizontal' | 'vertical'
     * @param {number} threshold - 间距差值阈值（默认 3px）
     * @returns {number|null} 一致的间距值，或 null
     */
    detectConsistentGap(children, direction = 'vertical', threshold = 3) {
        if (!children || children.length < 2) return null;

        const sorted = direction === 'horizontal'
            ? [...children].sort((a, b) => (a.frame?.x || 0) - (b.frame?.x || 0))
            : [...children].sort((a, b) => (a.frame?.y || 0) - (b.frame?.y || 0));

        const gaps = [];
        for (let i = 1; i < sorted.length; i++) {
            const prev = sorted[i - 1];
            const curr = sorted[i];

            if (direction === 'horizontal') {
                const prevRight = (prev.frame?.x || 0) + (prev.frame?.width || 0);
                gaps.push((curr.frame?.x || 0) - prevRight);
            } else {
                const prevBottom = (prev.frame?.y || 0) + (prev.frame?.height || 0);
                gaps.push((curr.frame?.y || 0) - prevBottom);
            }
        }

        if (gaps.length === 0) return null;

        // 检测间距是否一致
        const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;
        const isConsistent = gaps.every(g => Math.abs(g - avgGap) <= threshold);

        return isConsistent && avgGap > 0 ? Math.round(avgGap) : null;
    }

    /**
     * 检测布局模式
     * @param {Array} children - 子元素数组
     * @param {Object} parentFrame - 父元素 frame
     * @returns {Object} 布局信息
     */
    detectLayoutPattern(children, parentFrame) {
        const layoutInfo = {
            type: 'default',           // 'single-center' | 'row' | 'column' | 'space-between' | 'default'
            flexDirection: 'column',
            alignItems: null,
            justifyContent: null,
            gap: null
        };

        if (!children || children.length === 0 || !parentFrame) {
            return layoutInfo;
        }

        // 单子元素居中检测
        if (children.length === 1) {
            const centering = this.detectCentering(children[0].frame, parentFrame);
            if (centering.horizontalCenter || centering.verticalCenter) {
                layoutInfo.type = 'single-center';
                if (centering.horizontalCenter) {
                    layoutInfo.alignItems = 'center';
                }
                if (centering.verticalCenter) {
                    layoutInfo.justifyContent = 'center';
                }
                return layoutInfo;
            }
        }

        // 多子元素布局检测
        if (children.length >= 2) {
            const isHorizontal = this.isHorizontallyAligned(children);
            const isVertical = this.isVerticallyAligned(children);

            if (isHorizontal) {
                layoutInfo.flexDirection = 'row';

                // 检测水平对齐方式
                const hAlign = this.detectHorizontalAlignment(children, parentFrame);
                if (hAlign === 'space-between') {
                    layoutInfo.type = 'space-between';
                    layoutInfo.justifyContent = 'space-between';
                    // space-between 不需要 gap
                } else if (hAlign === 'center') {
                    layoutInfo.type = 'row';
                    layoutInfo.justifyContent = 'center';
                    // 检测一致间距（仅非 space-between 时）
                    const gap = this.detectConsistentGap(children, 'horizontal');
                    if (gap) {
                        layoutInfo.gap = gap;
                    }
                } else {
                    layoutInfo.type = 'row';
                    // 检测一致间距
                    const gap = this.detectConsistentGap(children, 'horizontal');
                    if (gap) {
                        layoutInfo.gap = gap;
                    }
                }

                // 检测垂直居中
                const vAlign = this.detectVerticalAlignment(children, parentFrame);
                if (vAlign === 'center') {
                    layoutInfo.alignItems = 'center';
                }
            } else if (isVertical) {
                layoutInfo.type = 'column';
                layoutInfo.flexDirection = 'column';

                // 只有当子元素真正水平居中时才添加 alignItems: center
                if (this.detectHorizontalCenterAlignment(children, parentFrame)) {
                    layoutInfo.alignItems = 'center';
                }

                // 检测一致间距
                const gap = this.detectConsistentGap(children, 'vertical');
                if (gap) {
                    layoutInfo.gap = gap;
                }
            }
        }

        return layoutInfo;
    }

    /**
     * 根据布局模式简化子元素样式
     * @param {Object} style - 原始样式对象
     * @param {Object} layoutInfo - 布局信息
     * @param {string} componentName - 组件名称
     * @returns {Object} 简化后的样式
     */
    optimizeChildStyle(style, layoutInfo, componentName) {
        const optimized = { ...style };

        if (layoutInfo.type === 'single-center') {
            // 居中布局：移除定位相关属性
            if (layoutInfo.alignItems === 'center') {
                delete optimized.marginLeft;
                // Text 元素移除 width，让内容自适应
                if (componentName === 'Text') {
                    delete optimized.width;
                }
            }
            if (layoutInfo.justifyContent === 'center') {
                delete optimized.marginTop;
            }
        } else if (layoutInfo.type === 'space-between') {
            // 两端对齐：移除 marginLeft 和 width
            delete optimized.marginLeft;
            if (componentName === 'Text') {
                delete optimized.width;
            }
        } else if (layoutInfo.type === 'row') {
            // 水平排列：移除 marginTop
            delete optimized.marginTop;
            if (layoutInfo.alignItems === 'center') {
                delete optimized.marginTop;
            }
            if (layoutInfo.gap) {
                delete optimized.marginLeft;
            }
        } else if (layoutInfo.type === 'column' && layoutInfo.alignItems === 'center') {
            // 垂直居中对齐：移除 marginLeft 和 width
            delete optimized.marginLeft;
            if (componentName === 'Text') {
                delete optimized.width;
            }
        }

        return optimized;
    }

    /**
     * 构建 props.style 对象
     * @param {Object} layer - 原始图层
     * @param {Object} parentFrame - 父元素 frame
     * @param {number} prevBottom - 前一个兄弟元素的底部位置
     * @returns {Object} style 对象
     */
    buildPropsStyle(layer, parentFrame = null, prevBottom = 0) {
        const style = {
            display: 'flex',
            opacity: layer.opacity !== undefined ? layer.opacity : 1
        };

        // 尺寸
        if (layer.frame) {
            style.width = `${layer.frame.width}px`;
            style.height = `${layer.frame.height}px`;

            // 计算相对边距
            if (parentFrame) {
                const marginLeft = layer.frame.x - parentFrame.x;
                const marginTop = prevBottom > 0
                    ? layer.frame.y - prevBottom
                    : layer.frame.y - parentFrame.y;

                if (marginLeft > 0) style.marginLeft = `${marginLeft}px`;
                if (marginTop > 0) style.marginTop = `${marginTop}px`;
            }
        }

        // 背景色
        if (layer.backgroundColor) {
            style.backgroundColor = this.convertToRgba(layer.backgroundColor);
        }

        // 圆角
        if (layer.borderRadius && layer.borderRadius > 0) {
            style.borderRadius = `${layer.borderRadius}px`;
        }

        // 默认 flex 布局方向
        style.flexDirection = 'column';

        // 文本样式
        if (layer.type === 'text' && layer.text) {
            const text = layer.text;

            if (text.color) {
                style.color = this.convertToRgba(text.color);
            }
            if (text.fontSize) {
                style.fontSize = `${text.fontSize}px`;
            }
            if (text.fontFamily) {
                style.fontFamily = text.fontFamily;
                // 根据字体名称设置 fontWeight
                if (text.fontFamily.includes('Semibold') || text.fontFamily.includes('Bold')) {
                    style.fontWeight = '600';
                } else if (text.fontFamily.includes('Medium')) {
                    style.fontWeight = '500';
                }
            }
            if (text.textAlign) {
                style.textAlign = text.textAlign;
            }
            if (layer.frame && layer.frame.height) {
                style.lineHeight = `${layer.frame.height}px`;
            }
            style.whiteSpace = 'nowrap';

            // 文本不需要 flex display
            delete style.display;
            delete style.flexDirection;
        }

        return style;
    }

    // ==================== Row 包装容器检测方法 ====================

    /**
     * 按行分组子元素
     * @param {Array} children - 子元素数组
     * @param {number} threshold - Y 坐标差值阈值（默认 4px）
     * @returns {Array} 行分组数组，每个元素是同一行的元素数组
     */
    groupByRow(children, threshold = 4) {
        if (!children || children.length === 0) return [];

        // 按 Y 坐标排序
        const sorted = [...children].sort((a, b) => (a.frame?.y || 0) - (b.frame?.y || 0));

        const rows = [];
        let currentRow = [sorted[0]];
        let currentRowY = sorted[0].frame?.y || 0;

        for (let i = 1; i < sorted.length; i++) {
            const element = sorted[i];
            const elementY = element.frame?.y || 0;

            // 如果 Y 坐标差值小于阈值，归为同一行
            if (Math.abs(elementY - currentRowY) <= threshold) {
                currentRow.push(element);
            } else {
                // 开始新的一行
                rows.push(currentRow);
                currentRow = [element];
                currentRowY = elementY;
            }
        }

        // 添加最后一行
        if (currentRow.length > 0) {
            rows.push(currentRow);
        }

        return rows;
    }

    /**
     * 检测行内元素的左右分组
     * @param {Array} rowElements - 同一行的元素数组
     * @param {Object} parentFrame - 父元素 frame
     * @returns {Object} { left: [], right: [], needsSpaceBetween: boolean }
     */
    detectLeftRightGroups(rowElements, parentFrame) {
        if (!rowElements || rowElements.length < 2 || !parentFrame) {
            return { left: rowElements || [], right: [], needsSpaceBetween: false };
        }

        // 按 X 坐标排序
        const sorted = [...rowElements].sort((a, b) => (a.frame?.x || 0) - (b.frame?.x || 0));

        // 计算父元素中心线
        const centerX = parentFrame.x + parentFrame.width / 2;

        const left = [];
        const right = [];

        for (const element of sorted) {
            const elementCenterX = (element.frame?.x || 0) + (element.frame?.width || 0) / 2;

            if (elementCenterX < centerX) {
                left.push(element);
            } else {
                right.push(element);
            }
        }

        // 判断是否需要 space-between
        const needsSpaceBetween = left.length > 0 && right.length > 0;

        return { left, right, needsSpaceBetween };
    }

    /**
     * 生成唯一 ID
     * @returns {string} 唯一 ID
     */
    generateUniqueId() {
        return 'row_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * 计算元素数组的包围盒
     * @param {Array} elements - 元素数组
     * @returns {Object} 包围盒 frame
     */
    calculateBoundingBox(elements) {
        if (!elements || elements.length === 0) return { x: 0, y: 0, width: 0, height: 0 };

        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

        for (const el of elements) {
            const frame = el.frame;
            if (!frame) continue;

            minX = Math.min(minX, frame.x);
            minY = Math.min(minY, frame.y);
            maxX = Math.max(maxX, frame.x + frame.width);
            maxY = Math.max(maxY, frame.y + frame.height);
        }

        return {
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY
        };
    }

    /**
     * 创建左侧分组容器
     * @param {Array} leftElements - 左侧元素数组
     * @param {Object} parentFrame - 父元素 frame
     * @returns {Object} 左侧分组容器
     */
    createLeftGroup(leftElements, parentFrame) {
        if (!leftElements || leftElements.length === 0) return null;
        if (leftElements.length === 1) return leftElements[0]; // 单个元素不需要包装

        const frame = this.calculateBoundingBox(leftElements);

        // 计算元素间距
        const sorted = [...leftElements].sort((a, b) => (a.frame?.x || 0) - (b.frame?.x || 0));
        let gap = null;
        if (sorted.length >= 2) {
            const gaps = [];
            for (let i = 1; i < sorted.length; i++) {
                const prevRight = (sorted[i-1].frame?.x || 0) + (sorted[i-1].frame?.width || 0);
                const currLeft = sorted[i].frame?.x || 0;
                gaps.push(currLeft - prevRight);
            }
            const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;
            if (avgGap > 0) gap = Math.round(avgGap);
        }

        return {
            id: this.generateUniqueId(),
            name: 'LeftGroup',
            type: 'group',
            frame,
            children: leftElements,
            _isRowWrapper: true,
            _rowStyle: {
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                ...(gap ? { gap: `${gap}px` } : {})
            }
        };
    }

    /**
     * 创建 Row 包装容器
     * @param {Array} rowElements - 同一行的元素数组
     * @param {Object} parentFrame - 父元素 frame
     * @returns {Object} Row 包装容器或原始元素
     */
    createRowWrapper(rowElements, parentFrame) {
        if (!rowElements || rowElements.length === 0) return null;
        if (rowElements.length === 1) return rowElements[0]; // 单个元素不需要包装

        const { left, right, needsSpaceBetween } = this.detectLeftRightGroups(rowElements, parentFrame);
        const frame = this.calculateBoundingBox(rowElements);

        let children;
        if (needsSpaceBetween) {
            // 左侧可能需要分组
            const leftGroup = this.createLeftGroup(left, parentFrame);
            children = leftGroup ? [leftGroup, ...right] : right;
        } else {
            // 按 X 坐标排序
            children = [...rowElements].sort((a, b) => (a.frame?.x || 0) - (b.frame?.x || 0));
        }

        return {
            id: this.generateUniqueId(),
            name: 'Row',
            type: 'group',
            frame,
            children,
            _isRowWrapper: true,
            _rowStyle: {
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                ...(needsSpaceBetween ? { justifyContent: 'space-between' } : {})
            }
        };
    }

    /**
     * 对子元素应用行分组
     * @param {Array} children - 子元素数组
     * @param {Object} parentFrame - 父元素 frame
     * @returns {Array} 应用行分组后的子元素数组
     */
    applyRowGrouping(children, parentFrame) {
        if (!children || children.length < 2) return children;

        const rows = this.groupByRow(children);
        const result = [];

        for (const row of rows) {
            if (row.length === 1) {
                // 单元素行，保持不变
                result.push(row[0]);
            } else {
                // 多元素行，创建 Row 包装器
                const rowWrapper = this.createRowWrapper(row, parentFrame);
                if (rowWrapper) {
                    result.push(rowWrapper);
                }
            }
        }

        return result;
    }

    /**
     * 重组层级结构
     * @param {Array} children - 平级子元素数组
     * @param {Object} parentFrame - 父元素 frame（用于行分组）
     * @returns {Array} 重组后的嵌套结构
     */
    reorganizeHierarchy(children, parentFrame = null) {
        if (!children || children.length === 0) return [];

        // 按面积从大到小排序（大的可能是容器）
        const sorted = [...children].sort((a, b) => {
            const areaA = (a.frame?.width || 0) * (a.frame?.height || 0);
            const areaB = (b.frame?.width || 0) * (b.frame?.height || 0);
            return areaB - areaA;
        });

        const result = [];
        const assigned = new Set();

        for (const container of sorted) {
            if (assigned.has(container.id)) continue;

            // 查找可以放入这个容器的子元素
            const containedChildren = [];
            for (const child of sorted) {
                if (child.id === container.id || assigned.has(child.id)) continue;

                if (this.detectContainment(child.frame, container.frame)) {
                    containedChildren.push(child);
                    assigned.add(child.id);
                }
            }

            // 如果有子元素，递归处理
            if (containedChildren.length > 0) {
                container.children = this.reorganizeHierarchy(containedChildren, container.frame);
            }

            if (!assigned.has(container.id)) {
                result.push(container);
                assigned.add(container.id);
            }
        }

        // 按 y 坐标排序
        result.sort((a, b) => (a.frame?.y || 0) - (b.frame?.y || 0));

        // 应用行分组（为同一行的元素创建 Row 包装器）
        if (parentFrame) {
            return this.applyRowGrouping(result, parentFrame);
        }

        return result;
    }

    /**
     * 转换 Row 包装容器为低代码格式
     * @param {Object} rowWrapper - Row 包装容器
     * @param {string} parentId - 父元素 ID
     * @param {Object} parentFrame - 父元素 frame
     * @param {number} prevBottom - 前一个兄弟元素的底部
     * @returns {Object} 低代码格式元素
     */
    transformRowWrapper(rowWrapper, parentId = null, parentFrame = null, prevBottom = 0) {
        const className = this.generateClassName('Div');

        // 计算 Row 容器的样式
        const style = {
            display: 'flex',
            opacity: 1,
            ...rowWrapper._rowStyle
        };

        // 计算尺寸和边距
        if (rowWrapper.frame) {
            style.width = `${rowWrapper.frame.width}px`;
            style.height = `${rowWrapper.frame.height}px`;

            if (parentFrame) {
                const marginLeft = rowWrapper.frame.x - parentFrame.x;
                const marginTop = prevBottom > 0
                    ? rowWrapper.frame.y - prevBottom
                    : rowWrapper.frame.y - parentFrame.y;

                if (marginLeft > 0) style.marginLeft = `${marginLeft}px`;
                if (marginTop > 0) style.marginTop = `${marginTop}px`;
            }
        }

        const element = {
            id: rowWrapper.id,
            name: rowWrapper.name,
            props: {
                style,
                className
            },
            rect: rowWrapper.frame ? { ...rowWrapper.frame } : { x: 0, y: 0, width: 0, height: 0 },
            componentName: 'Div',
            intelligent: {
                layout_opt: {},
                is_need_detection: false
            },
            isInteractive: false,
            lowcodeType: 'KunBasicContainer',
            ui_library_type: '',
            ui_component_type: ''
        };

        if (parentId) {
            element.parentId = parentId;
        }

        element.isLeaf = false;
        element.isHover = false;
        element.isClick = false;

        // 创建 Row 的布局信息，用于优化子元素样式
        const rowLayoutInfo = {
            type: rowWrapper._rowStyle.justifyContent === 'space-between' ? 'space-between' : 'row',
            flexDirection: 'row',
            alignItems: rowWrapper._rowStyle.alignItems || null,
            justifyContent: rowWrapper._rowStyle.justifyContent || null,
            gap: null
        };

        // 处理子元素
        if (rowWrapper.children && rowWrapper.children.length > 0) {
            element.children = rowWrapper.children.map(child => {
                return this.transformElement(
                    child,
                    rowWrapper.id,
                    rowWrapper.frame,
                    0,
                    rowLayoutInfo
                );
            });
        } else {
            element.children = [];
        }

        return element;
    }

    /**
     * 转换单个元素为低代码格式
     * @param {Object} layer - 原始图层
     * @param {string} parentId - 父元素 ID
     * @param {Object} parentFrame - 父元素 frame
     * @param {number} prevBottom - 前一个兄弟元素的底部
     * @param {Object} layoutInfo - 父元素的布局信息（用于优化子元素样式）
     * @returns {Object} 低代码格式元素
     */
    transformElement(layer, parentId = null, parentFrame = null, prevBottom = 0, layoutInfo = null) {
        // 处理 Row 包装容器
        if (layer._isRowWrapper) {
            return this.transformRowWrapper(layer, parentId, parentFrame, prevBottom);
        }

        const componentName = this.detectComponentName(layer.type);
        const className = this.generateClassName(componentName);
        let style = this.buildPropsStyle(layer, parentFrame, prevBottom);

        // 如果有父元素的布局信息，优化当前元素的样式
        if (layoutInfo && layoutInfo.type !== 'default') {
            style = this.optimizeChildStyle(style, layoutInfo, componentName);
        }

        const element = {
            id: layer.id,
            name: layer.name,
            props: {
                style,
                className
            },
            rect: layer.frame ? { ...layer.frame } : { x: 0, y: 0, width: 0, height: 0 },
            componentName,
            intelligent: {
                layout_opt: {},
                is_need_detection: layer.children && layer.children.length > 0
            },
            isInteractive: false,
            lowcodeType: 'KunBasicContainer',
            ui_library_type: '',
            ui_component_type: ''
        };

        // 添加文本内容
        if (layer.type === 'text' && layer.text) {
            element.props.text = layer.text.content || '';
            element.props.lines = 1;
        }

        // 添加图片占位
        if (layer.type === 'symbolInstance') {
            element.props.src = '';
        }

        // 添加父级引用
        if (parentId) {
            element.parentId = parentId;
        }

        // 标记叶子节点
        element.isLeaf = !layer.children || layer.children.length === 0;
        element.isHover = false;
        element.isClick = false;

        // 处理子元素
        if (layer.children && layer.children.length > 0) {
            // 先重组层级（传递父元素 frame 用于行分组）
            const reorganized = this.reorganizeHierarchy(layer.children, layer.frame);

            // 检测子元素的布局模式
            const childLayoutInfo = this.detectLayoutPattern(reorganized, layer.frame);

            // 根据布局模式优化父元素样式
            if (childLayoutInfo.type !== 'default') {
                // 设置 flexDirection
                element.props.style.flexDirection = childLayoutInfo.flexDirection;

                // 添加对齐属性
                if (childLayoutInfo.alignItems) {
                    element.props.style.alignItems = childLayoutInfo.alignItems;
                }
                if (childLayoutInfo.justifyContent) {
                    element.props.style.justifyContent = childLayoutInfo.justifyContent;
                }

                // 添加 gap
                if (childLayoutInfo.gap) {
                    element.props.style.gap = `${childLayoutInfo.gap}px`;
                }
            }

            let currentBottom = layer.frame ? layer.frame.y : 0;
            element.children = reorganized.map(child => {
                const transformed = this.transformElement(
                    child,
                    layer.id,
                    layer.frame,
                    currentBottom,
                    childLayoutInfo  // 传递布局信息给子元素
                );
                currentBottom = (child.frame?.y || 0) + (child.frame?.height || 0);
                return transformed;
            });
        } else {
            element.children = [];
        }

        return element;
    }

    /**
     * 转换整个 JSON 为低代码格式
     * @param {Object} sketchData - 原始 Sketch JSON 数据
     * @returns {Object} 低代码格式 JSON
     */
    transform(sketchData) {
        this.resetCounters();
        return this.transformElement(sketchData);
    }
}

/**
 * 便捷函数：转换 JSON 文件为低代码格式
 * @param {string} filePath - JSON 文件路径
 * @returns {Promise<Object>} 转换后的低代码格式 JSON
 */
export async function transformJSONToLowCode(filePath) {
    const fileContent = await fs.readFile(filePath, 'utf8');
    const sketchData = JSON.parse(fileContent);
    const transformer = new JSONTransformer();
    return transformer.transform(sketchData);
}