import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import fs from "fs/promises";
import path from "path";
import AdmZip from "adm-zip";
import { SketchJSONConverter, JSONTransformer } from "./src/sketch-json-converter.js";

const server = new McpServer({
    name: "sketch-parser",
    version: "1.0.0",
    capabilities: {
        resources: {},
        tools: {},
    },
});

// ================== 配置 ==================
const USER_AGENT = "mcp-sketch-parser/1.0";

// ================== 全局状态 ==================
let currentSketchData = null;
let currentFilePath = null;
let extractedImages = new Map();
let currentSketchJSONData = null;
let sketchJSONConverter = new SketchJSONConverter();
let jsonTransformer = new JSONTransformer();

// ================== Sketch 文件解析函数 ==================

/**
 * 解析 Sketch 文件(实际是 ZIP 压缩包)
 */
async function parseSketchFile(filePath) {
    try {
        const fileExists = await fs.access(filePath).then(() => true).catch(() => false);
        if (!fileExists) {
            throw new Error("文件不存在: " + filePath);
        }

        const zip = new AdmZip(filePath);
        const zipEntries = zip.getEntries();

        const sketchData = {
            meta: null,
            document: null,
            pages: [],
            user: null,
            previews: [],
            images: new Map()
        };

        for (const entry of zipEntries) {
            const entryName = entry.entryName;

            if (entryName === "meta.json") {
                const content = entry.getData().toString("utf8");
                sketchData.meta = JSON.parse(content);
            }
            else if (entryName === "document.json") {
                const content = entry.getData().toString("utf8");
                sketchData.document = JSON.parse(content);
            }
            else if (entryName === "user.json") {
                const content = entry.getData().toString("utf8");
                sketchData.user = JSON.parse(content);
            }
            else if (entryName.startsWith("pages/") && entryName.endsWith(".json")) {
                const content = entry.getData().toString("utf8");
                const pageData = JSON.parse(content);
                sketchData.pages.push({
                    fileName: path.basename(entryName),
                    data: pageData
                });
            }
            else if (entryName.startsWith("images/")) {
                const imageData = entry.getData();
                const base64 = imageData.toString("base64");
                const imageId = path.basename(entryName, path.extname(entryName));
                sketchData.images.set(imageId, base64);
            }
            else if (entryName.startsWith("previews/") && 
                     (entryName.endsWith(".png") || entryName.endsWith(".jpg"))) {
                sketchData.previews.push({
                    fileName: path.basename(entryName),
                    size: entry.header.size
                });
            }
        }

        return sketchData;
    } catch (error) {
        console.error("❌ 解析 Sketch 文件失败:", error.message);
        throw error;
    }
}

/**
 * 提取颜色值(支持多种格式)
 */
function extractColor(color) {
    if (!color) return "transparent";
    
    const r = Math.round((color.red || 0) * 255);
    const g = Math.round((color.green || 0) * 255);
    const b = Math.round((color.blue || 0) * 255);
    const a = color.alpha !== undefined ? color.alpha : 1;
    
    if (a < 1) {
        return "rgba(" + r + ", " + g + ", " + b + ", " + a + ")";
    }
    return "rgb(" + r + ", " + g + ", " + b + ")";
}

/**
 * 提取渐变色
 */
function extractGradient(gradient) {
    if (!gradient || !gradient.stops) return "";
    
    const stops = gradient.stops.map((stop) => {
        const color = extractColor(stop.color);
        const position = Math.round(stop.position * 100);
        return color + " " + position + "%";
    }).join(", ");
    
    if (gradient.gradientType === 1) {
        return "radial-gradient(circle, " + stops + ")";
    }
    return "linear-gradient(" + stops + ")";
}

/**
 * 提取图层的完整样式信息(用于生成 CSS)
 */
function extractLayerStyle(layer) {
    const style = {
        name: layer.name,
        type: layer._class,
        frame: {
            x: Math.round(layer.frame?.x || 0),
            y: Math.round(layer.frame?.y || 0),
            width: Math.round(layer.frame?.width || 0),
            height: Math.round(layer.frame?.height || 0)
        },
        isVisible: layer.isVisible !== false,
        opacity: layer.style?.contextSettings?.opacity || 1,
        rotation: layer.rotation || 0
    };

    if (layer.style) {
        const layerStyle = layer.style;

        // 背景色/填充
        if (layerStyle.fills && layerStyle.fills.length > 0) {
            const fill = layerStyle.fills[0];
            if (fill.isEnabled !== false) {
                if (fill.fillType === 0) {
                    style.backgroundColor = extractColor(fill.color);
                } else if (fill.fillType === 1) {
                    style.background = extractGradient(fill.gradient);
                } else if (fill.fillType === 4) {
                    style.backgroundImage = fill.image?._ref;
                }
            }
        }

        // 边框
        if (layerStyle.borders && layerStyle.borders.length > 0) {
            const border = layerStyle.borders[0];
            if (border.isEnabled !== false) {
                style.border = {
                    width: Math.round(border.thickness || 1),
                    color: extractColor(border.color),
                    position: border.position
                };
            }
        }

        // 圆角
        if (layer.points || layerStyle.borderOptions) {
            style.borderRadius = layer.fixedRadius || 0;
        }

        // 阴影
        if (layerStyle.shadows && layerStyle.shadows.length > 0) {
            style.shadows = layerStyle.shadows
                .filter((s) => s.isEnabled !== false)
                .map((shadow) => ({
                    x: Math.round(shadow.offsetX || 0),
                    y: Math.round(shadow.offsetY || 0),
                    blur: Math.round(shadow.blurRadius || 0),
                    spread: Math.round(shadow.spread || 0),
                    color: extractColor(shadow.color)
                }));
        }

        // 内阴影
        if (layerStyle.innerShadows && layerStyle.innerShadows.length > 0) {
            style.innerShadows = layerStyle.innerShadows
                .filter((s) => s.isEnabled !== false)
                .map((shadow) => ({
                    x: Math.round(shadow.offsetX || 0),
                    y: Math.round(shadow.offsetY || 0),
                    blur: Math.round(shadow.blurRadius || 0),
                    color: extractColor(shadow.color)
                }));
        }

        // 模糊效果
        if (layerStyle.blur && layerStyle.blur.isEnabled) {
            style.blur = {
                type: layerStyle.blur.type,
                radius: Math.round(layerStyle.blur.radius || 0)
            };
        }
    }

    // 文本样式
    if (layer._class === "text" && layer.attributedString) {
        const textStyle = layer.attributedString.attributes?.[0]?.attributes;
        if (textStyle) {
            style.text = {
                content: layer.attributedString.string,
                fontFamily: textStyle.MSAttributedStringFontAttribute?.attributes?.name,
                fontSize: Math.round(textStyle.MSAttributedStringFontAttribute?.attributes?.size || 14),
                fontWeight: textStyle.MSAttributedStringFontAttribute?.attributes?.weight,
                color: extractColor(textStyle.MSAttributedStringColorAttribute),
                textAlign: layer.textBehaviour === 1 ? "center" : "left",
                lineHeight: textStyle.paragraphStyle?.maximumLineHeight,
                letterSpacing: textStyle.kerning || 0
            };
        }
    }

    // 图片图层
    if (layer._class === "bitmap" && layer.image) {
        style.imageRef = layer.image._ref;
    }

    return style;
}

/**
 * 提取页面的完整 UI 结构(用于生成 HTML)
 */
function extractUIStructure(page) {
    const structure = {
        pageName: page.data.name,
        pageId: page.data.do_objectID,
        backgroundColor: extractColor(page.data.backgroundColor),
        artboards: [],
        elements: []
    };

    function processLayer(layer, parentId = null) {
        const element = {
            id: layer.do_objectID,
            parentId: parentId,
            ...extractLayerStyle(layer),
            children: []
        };

        if (layer.layers && Array.isArray(layer.layers)) {
            for (const childLayer of layer.layers) {
                const childElement = processLayer(childLayer, element.id);
                element.children.push(childElement);
            }
        }

        return element;
    }

    if (page.data && page.data.layers) {
        for (const layer of page.data.layers) {
            if (layer._class === "artboard") {
                const artboard = processLayer(layer);
                structure.artboards.push(artboard);
            } else {
                const element = processLayer(layer);
                structure.elements.push(element);
            }
        }
    }

    return structure;
}

/**
 * 生成 HTML 结构建议
 */
function generateHTMLSuggestion(structure) {
    const suggestions = [];
    
            suggestions.push("# 页面: " + structure.pageName);
    suggestions.push("\n## 布局建议:");
    suggestions.push("- 页面背景色: " + structure.backgroundColor);
    suggestions.push("- 画板数量: " + structure.artboards.length);
    suggestions.push("- 独立元素: " + structure.elements.length);
    
    if (structure.artboards.length > 0) {
        suggestions.push("\n## 画板列表:");
        structure.artboards.forEach((artboard, index) => {
            suggestions.push("\n### 画板 " + (index + 1) + ": " + artboard.name);
            suggestions.push("- 尺寸: " + artboard.frame.width + "x" + artboard.frame.height + "px");
            suggestions.push("- 背景: " + (artboard.backgroundColor || "transparent"));
            suggestions.push("- 子元素数量: " + artboard.children.length);
            
            const types = {};
            function countTypes(element) {
                types[element.type] = (types[element.type] || 0) + 1;
                element.children?.forEach(countTypes);
            }
            artboard.children.forEach(countTypes);
            
            suggestions.push("- 元素类型分布: " + JSON.stringify(types));
        });
    }
    
    return suggestions.join("\n");
}

/**
 * 提取设计规范(颜色、字体、间距等)
 */
function extractDesignTokens(sketchData) {
    const tokens = {
        colors: new Set(),
        fonts: new Set(),
        fontSizes: new Set(),
        spacings: new Set(),
        borderRadius: new Set(),
        shadows: []
    };

    function analyzeLayer(layer) {
        const style = extractLayerStyle(layer);
        
        if (style.backgroundColor) tokens.colors.add(style.backgroundColor);
        if (style.border?.color) tokens.colors.add(style.border.color);
        
        if (style.text) {
            if (style.text.fontFamily) tokens.fonts.add(style.text.fontFamily);
            if (style.text.fontSize) tokens.fontSizes.add(style.text.fontSize);
            if (style.text.color) tokens.colors.add(style.text.color);
        }
        
        if (style.borderRadius) tokens.borderRadius.add(style.borderRadius);
        
        if (style.shadows) {
            style.shadows.forEach((s) => {
                tokens.shadows.push(s.x + "px " + s.y + "px " + s.blur + "px " + s.spread + "px " + s.color);
                tokens.colors.add(s.color);
            });
        }
        
        if (style.frame) {
            tokens.spacings.add(style.frame.x);
            tokens.spacings.add(style.frame.y);
        }
        
        if (layer.layers) {
            layer.layers.forEach(analyzeLayer);
        }
    }

    sketchData.pages.forEach((page) => {
        if (page.data?.layers) {
            page.data.layers.forEach(analyzeLayer);
        }
    });

    return {
        colors: Array.from(tokens.colors).sort(),
        fonts: Array.from(tokens.fonts).sort(),
        fontSizes: Array.from(tokens.fontSizes).sort((a, b) => a - b),
        spacings: Array.from(tokens.spacings).sort((a, b) => a - b).slice(0, 20),
        borderRadius: Array.from(tokens.borderRadius).sort((a, b) => a - b),
        shadows: Array.from(new Set(tokens.shadows))
    };
}

// ================== MCP 工具注册 ==================

server.tool(
    "loadSketchFile",
    "Load and parse a Sketch file (.sketch)",
    {
        filePath: z.string().describe("Absolute path to the .sketch file"),
    },
    async ({ filePath }) => {
        try {
            const sketchData = await parseSketchFile(filePath);
            currentSketchData = sketchData;
            currentFilePath = filePath;
            extractedImages = sketchData.images;

            const stats = {
                version: sketchData.meta?.appVersion || "Unknown",
                pagesCount: sketchData.pages.length,
                imagesCount: sketchData.images.size
            };

            return {
                content: [
                    {
                        type: "text",
                        text: "✅ Sketch 文件加载成功！\n\n📊 文件信息:\n- 文件路径: " + filePath + "\n- Sketch 版本: " + stats.version + "\n- 页面数量: " + stats.pagesCount + "\n- 图片资源: " + stats.imagesCount + " 个\n\n📌 下一步操作:\n1. getDesignTokens - 提取设计规范(颜色、字体等)\n2. getPageForHTML - 获取指定页面的完整 UI 结构(用于生成 HTML)\n3. getArtboardForHTML - 获取指定画板的详细信息\n4. listImages - 查看所有图片资源",
                    },
                ],
            };
        } catch (error) {
            return {
                content: [
                    {
                        type: "text",
                        text: "❌ 加载失败: " + error.message,
                    },
                ],
            };
        }
    }
);

server.tool(
    "getDesignTokens",
    "Extract design tokens (colors, fonts, spacings) from the Sketch file",
    {},
    async () => {
        if (!currentSketchData) {
            return {
                content: [
                    {
                        type: "text",
                        text: "❌ 未加载任何 Sketch 文件！请先使用 loadSketchFile 工具",
                    },
                ],
            };
        }

        const tokens = extractDesignTokens(currentSketchData);

        return {
            content: [
                {
                    type: "text",
                                            text: "🎨 设计规范 (Design Tokens):\n\n**颜色 (" + tokens.colors.length + " 个):**\n" + tokens.colors.map((c) => "- " + c).join("\n") + "\n\n**字体 (" + tokens.fonts.length + " 个):**\n" + tokens.fonts.map((f) => "- " + f).join("\n") + "\n\n**字号 (" + tokens.fontSizes.length + " 个):**\n" + tokens.fontSizes.map((s) => "- " + s + "px").join(", ") + "\n\n**圆角 (" + tokens.borderRadius.length + " 个):**\n" + tokens.borderRadius.map((r) => "- " + r + "px").join(", ") + "\n\n**常用间距 (前20个):**\n" + tokens.spacings.map((s) => "- " + s + "px").join(", ") + "\n\n**阴影样式 (" + tokens.shadows.length + " 个):**\n" + tokens.shadows.slice(0, 10).map((s) => "- box-shadow: " + s).join("\n") + "\n\n💡 这些设计规范可以用来生成 CSS 变量或 Tailwind 配置",
                },
            ],
        };
    }
);

// server.tool(
//     "getPageForHTML",
//     "Get complete UI structure of a page for HTML generation",
//     {
//         pageIndex: z.number().describe("Page index (0-based)"),
//     },
//     async ({ pageIndex }) => {
//         if (!currentSketchData) {
//             return {
//                 content: [
//                     {
//                         type: "text",
//                         text: "❌ 未加载任何 Sketch 文件！请先使用 loadSketchFile 工具",
//                     },
//                 ],
//             };
//         }

//         if (pageIndex < 0 || pageIndex >= currentSketchData.pages.length) {
//             return {
//                 content: [
//                     {
//                         type: "text",
//                         text: "❌ 页面索引无效！有效范围: 0-" + (currentSketchData.pages.length - 1),
//                     },
//                 ],
//             };
//         }

//         const page = currentSketchData.pages[pageIndex];
//         const structure = extractUIStructure(page);
//         const suggestion = generateHTMLSuggestion(structure);

//         return {
//             content: [
//                 {
//                     type: "text",
//                                             text: suggestion + "\n\n## 完整 UI 结构数据:\n\n" + JSON.stringify(structure, null, 2) + "\n\n💡 使用说明:\n- 每个元素包含: id, type, frame(位置尺寸), style(样式), children(子元素)\n- frame: {x, y, width, height} - 用于定位\n- style: 包含 CSS 所需的所有样式信息\n- type: 元素类型 (artboard, rectangle, text, bitmap, group 等)\n- 可以直接转换为 HTML/CSS 或 React 组件",
//                 },
//             ],
//         };
//     }
// );

server.tool(
    "listAllArtboards",
    "List all artboards across all pages with detailed information for selection",
    {},
    async () => {
        if (!currentSketchData) {
            return {
                content: [
                    {
                        type: "text",
                        text: "❌ 未加载任何 Sketch 文件！请先使用 loadSketchFile 工具",
                    },
                ],
            };
        }

        const allArtboards = [];
        let globalIndex = 0;

        // 遍历所有页面，收集画板信息
        currentSketchData.pages.forEach((page, pageIndex) => {
            if (page.data?.layers) {
                const artboards = page.data.layers.filter(layer => layer._class === "artboard");
                
                artboards.forEach((artboard, localIndex) => {
                    // 统计子元素类型
                    const elementTypes = {};
                    const countElements = (layer) => {
                        const type = layer._class;
                        elementTypes[type] = (elementTypes[type] || 0) + 1;
                        if (layer.layers) {
                            layer.layers.forEach(countElements);
                        }
                    };
                    if (artboard.layers) {
                        artboard.layers.forEach(countElements);
                    }

                    allArtboards.push({
                        globalIndex: globalIndex++,
                        pageIndex,
                        pageName: page.data.name,
                        artboardIndex: localIndex,
                        artboardId: artboard.do_objectID,
                        artboardName: artboard.name,
                        frame: {
                            width: Math.round(artboard.frame?.width || 0),
                            height: Math.round(artboard.frame?.height || 0),
                            x: Math.round(artboard.frame?.x || 0),
                            y: Math.round(artboard.frame?.y || 0)
                        },
                        backgroundColor: extractColor(artboard.backgroundColor),
                        childrenCount: artboard.layers?.length || 0,
                        elementTypes,
                        isVisible: artboard.isVisible !== false
                    });
                });
            }
        });

        if (allArtboards.length === 0) {
            return {
                content: [
                    {
                        type: "text",
                        text: "⚠️ 未找到任何画板！此 Sketch 文件可能不包含画板，或所有图层都是独立元素。"
                    }
                ]
            };
        }

        // 生成格式化的画板列表
        const output = [
            `🎨 共找到 ${allArtboards.length} 个画板\n`,
            `${"=".repeat(80)}\n`
        ];

        let currentPage = null;
        allArtboards.forEach(ab => {
            // 当切换到新页面时，显示页面标题
            if (currentPage !== ab.pageName) {
                currentPage = ab.pageName;
                output.push(`\n📄 页面: ${ab.pageName} (pageIndex: ${ab.pageIndex})`);
                output.push(`${"-".repeat(80)}\n`);
            }

            // 画板信息
            output.push(`[${ab.globalIndex}] ${ab.artboardName}`);
            output.push(`    📐 尺寸: ${ab.frame.width} × ${ab.frame.height} px`);
            output.push(`    📍 位置: (${ab.frame.x}, ${ab.frame.y})`);
            output.push(`    🎨 背景: ${ab.backgroundColor || "transparent"}`);
            output.push(`    📦 子元素: ${ab.childrenCount} 个`);
            
            // 显示元素类型分布
            const types = Object.entries(ab.elementTypes)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([type, count]) => `${type}(${count})`)
                .join(", ");
            if (types) {
                output.push(`    🔍 主要元素: ${types}`);
            }
            
            output.push(`    ⚙️  使用方法: getArtboardForHTML({ pageIndex: ${ab.pageIndex}, artboardIndex: ${ab.artboardIndex} })`);
            output.push('');
        });

        output.push(`\n${"=".repeat(80)}`);
        output.push(`\n💡 使用说明:`);
        output.push(`1. 选择你想要生成 HTML 的画板序号 [0-${allArtboards.length - 1}]`);
        output.push(`2. 使用对应的 getArtboardForHTML 命令获取详细数据`);
        output.push(`3. 也可以使用 getArtboardByGlobalIndex 直接通过序号获取`);

        return {
            content: [
                {
                    type: "text",
                    text: output.join("\n")
                }
            ]
        };
    }
);

server.tool(
    "getArtboardByGlobalIndex",
    "Get artboard details by global index from listAllArtboards",
    {
        globalIndex: z.number().describe("Global artboard index from listAllArtboards (0-based)"),
    },
    async ({ globalIndex }) => {
        if (!currentSketchData) {
            return {
                content: [
                    {
                        type: "text",
                        text: "❌ 未加载任何 Sketch 文件！请先使用 loadSketchFile 工具",
                    },
                ],
            };
        }

        // 重新构建画板索引
        let currentGlobalIndex = 0;
        let targetArtboard = null;
        let targetPageIndex = -1;
        let targetArtboardIndex = -1;

        for (let pageIndex = 0; pageIndex < currentSketchData.pages.length; pageIndex++) {
            const page = currentSketchData.pages[pageIndex];
            if (page.data?.layers) {
                const artboards = page.data.layers.filter(layer => layer._class === "artboard");
                
                for (let artboardIndex = 0; artboardIndex < artboards.length; artboardIndex++) {
                    if (currentGlobalIndex === globalIndex) {
                        targetPageIndex = pageIndex;
                        targetArtboardIndex = artboardIndex;
                        targetArtboard = artboards[artboardIndex];
                        break;
                    }
                    currentGlobalIndex++;
                }
                
                if (targetArtboard) break;
            }
        }

        if (!targetArtboard) {
            return {
                content: [
                    {
                        type: "text",
                        text: `❌ 全局索引 ${globalIndex} 无效！请使用 listAllArtboards 查看有效范围。`,
                    },
                ],
            };
        }

        // 提取画板的完整结构
        const page = currentSketchData.pages[targetPageIndex];
        const structure = extractUIStructure(page);
        const artboard = structure.artboards[targetArtboardIndex];

        return {
            content: [
                {
                    type: "text",
                    text: `🎨 画板 [${globalIndex}]: ${artboard.name}\n\n` +
                          `## 基本信息:\n` +
                          `- 页面: ${page.data.name} (pageIndex: ${targetPageIndex})\n` +
                          `- 画板索引: ${targetArtboardIndex}\n` +
                          `- 尺寸: ${artboard.frame.width} × ${artboard.frame.height} px\n` +
                          `- 背景: ${artboard.backgroundColor || "transparent"}\n` +
                          `- 子元素: ${artboard.children.length} 个\n\n` +
                          `## 完整结构数据:\n\n` +
                          JSON.stringify(artboard, null, 2) +
                          `\n\n✅ 这个画板已准备好转换为 HTML！`
                }
            ]
        };
    }
);

// 优化原有的 getPageForHTML 工具
server.tool(
    "getPageForHTML",
    "Get artboards overview for a specific page (use listAllArtboards to see all pages)",
    {
        pageIndex: z.number().describe("Page index (0-based)"),
    },
    async ({ pageIndex }) => {
        if (!currentSketchData) {
            return {
                content: [
                    {
                        type: "text",
                        text: "❌ 未加载任何 Sketch 文件！请先使用 loadSketchFile 工具",
                    },
                ],
            };
        }

        if (pageIndex < 0 || pageIndex >= currentSketchData.pages.length) {
            return {
                content: [
                    {
                        type: "text",
                        text: `❌ 页面索引无效！有效范围: 0-${currentSketchData.pages.length - 1}\n\n💡 提示: 使用 listAllArtboards 查看所有画板`,
                    },
                ],
            };
        }

        const page = currentSketchData.pages[pageIndex];
        
        const artboardsOverview = [];
        if (page.data?.layers) {
            page.data.layers
                .filter(layer => layer._class === "artboard")
                .forEach((layer, index) => {
                    const basicInfo = {
                        index,
                        id: layer.do_objectID,
                        name: layer.name,
                        frame: {
                            x: Math.round(layer.frame?.x || 0),
                            y: Math.round(layer.frame?.y || 0),
                            width: Math.round(layer.frame?.width || 0),
                            height: Math.round(layer.frame?.height || 0)
                        },
                        backgroundColor: extractColor(layer.backgroundColor),
                        childrenCount: layer.layers?.length || 0,
                        isVisible: layer.isVisible !== false
                    };
                    artboardsOverview.push(basicInfo);
                });
        }

        const summary = [
            `📄 页面: ${page.data.name} (索引: ${pageIndex})`,
            `${"=".repeat(60)}`,
            `- 页面ID: ${page.data.do_objectID}`,
            `- 背景色: ${extractColor(page.data.backgroundColor)}`,
            `- 画板数量: ${artboardsOverview.length}`,
            `- 独立元素: ${(page.data.layers?.filter(l => l._class !== "artboard") || []).length}`,
            ``,
            `## 📋 画板列表:\n`
        ];

        if (artboardsOverview.length === 0) {
            summary.push(`⚠️ 该页面没有画板\n`);
        } else {
            artboardsOverview.forEach(ab => {
                summary.push(`[${ab.index}] ${ab.name}`);
                summary.push(`    📐 ${ab.frame.width}×${ab.frame.height}px @ (${ab.frame.x}, ${ab.frame.y})`);
                summary.push(`    🎨 ${ab.backgroundColor || "transparent"} | 📦 ${ab.childrenCount}个元素`);
                summary.push(`    ⚙️  getArtboardForHTML({ pageIndex: ${pageIndex}, artboardIndex: ${ab.index} })\n`);
            });
        }

        summary.push(`${"=".repeat(60)}`);
        summary.push(`\n💡 提示: 使用 listAllArtboards 查看所有页面的画板`);

        return {
            content: [
                {
                    type: "text",
                    text: summary.join("\n")
                }
            ]
        };
    }
);

 
server.tool(
    "getArtboardForHTML",
    "Get detailed information of a specific artboard for HTML generation",
    {
        pageIndex: z.number().describe("Page index (0-based)"),
        artboardIndex: z.number().describe("Artboard index within the page (0-based)"),
    },
    async ({ pageIndex, artboardIndex }) => {
        if (!currentSketchData) {
            return {
                content: [
                    {
                        type: "text",
                        text: "❌ 未加载任何 Sketch 文件！请先使用 loadSketchFile 工具",
                    },
                ],
            };
        }

        const page = currentSketchData.pages[pageIndex];
        if (!page) {
            return {
                content: [
                    {
                        type: "text",
                        text: `❌ 页面索引无效！`,
                    },
                ],
            };
        }

        const structure = extractUIStructure(page);
        const artboard = structure.artboards[artboardIndex];

        if (!artboard) {
            return {
                content: [
                    {
                        type: "text",
                        text: "❌ 画板索引无效！该页面有 " + structure.artboards.length + " 个画板",
                    },
                ],
            };
        }

        return {
            content: [
                {
                    type: "text",
                                            text: "🎨 画板详情: " + artboard.name + "\n\n## 基本信息:\n- 尺寸: " + artboard.frame.width + "x" + artboard.frame.height + "px\n- 背景: " + (artboard.backgroundColor || "transparent") + "\n- 子元素: " + artboard.children.length + " 个\n\n## 完整结构数据:\n\n" + JSON.stringify(artboard, null, 2) + "\n\n💡 这个画板可以直接转换为一个独立的 HTML 页面或组件",
                },
            ],
        };
    }
);

server.tool(
    "listImages",
    "List all image resources in the Sketch file",
    {},
    async () => {
        if (!currentSketchData) {
            return {
                content: [
                    {
                        type: "text",
                        text: "❌ 未加载任何 Sketch 文件！请先使用 loadSketchFile 工具",
                    },
                ],
            };
        }

        const imageList = Array.from(extractedImages.keys());

        return {
            content: [
                {
                    type: "text",
                                            text: "🖼️ 图片资源列表 (共 " + imageList.length + " 个):\n\n" + imageList.map((id, index) => (index + 1) + ". " + id).join("\n") + "\n\n💡 使用 getImageBase64 工具获取图片的 base64 数据",
                },
            ],
        };
    }
);

server.tool(
    "getImageBase64",
    "Get base64 encoded data of a specific image",
    {
        imageId: z.string().describe("Image ID from the Sketch file"),
    },
    async ({ imageId }) => {
        if (!currentSketchData) {
            return {
                content: [
                    {
                        type: "text",
                        text: "❌ 未加载任何 Sketch 文件！请先使用 loadSketchFile 工具",
                    },
                ],
            };
        }

        const base64 = extractedImages.get(imageId);
        if (!base64) {
            return {
                content: [
                    {
                        type: "text",
                        text: "❌ 找不到图片: " + imageId,
                    },
                ],
            };
        }

        return {
            content: [
                {
                    type: "text",
                                            text: "✅ 图片 " + imageId + " 的 base64 数据:\n\ndata:image/png;base64," + base64.substring(0, 100) + "...\n\n💡 完整 base64 (" + base64.length + " 字符):\n" + base64 + "\n\n可以直接用在 HTML 的 <img> 标签或 CSS 的 background-image 中",
                },
            ],
        };
    }
);

server.tool(
    "generateCSSVariables",
    "Generate CSS custom properties (variables) from design tokens",
    {},
    async () => {
        if (!currentSketchData) {
            return {
                content: [
                    {
                        type: "text",
                        text: "❌ 未加载任何 Sketch 文件！请先使用 loadSketchFile 工具",
                    },
                ],
            };
        }

        const tokens = extractDesignTokens(currentSketchData);
        
        let css = ":root {\n";
        
        css += "  /* Colors */\n";
        tokens.colors.forEach((color, index) => {
            css += "  --color-" + (index + 1) + ": " + color + ";\n";
        });
        
        css += "\n  /* Font Sizes */\n";
        tokens.fontSizes.forEach((size, index) => {
            css += "  --font-size-" + (index + 1) + ": " + size + "px;\n";
        });
        
        css += "\n  /* Spacings */\n";
        tokens.spacings.slice(0, 10).forEach((space, index) => {
            css += "  --spacing-" + (index + 1) + ": " + space + "px;\n";
        });
        
        css += "\n  /* Border Radius */\n";
        tokens.borderRadius.forEach((radius, index) => {
            css += "  --radius-" + (index + 1) + ": " + radius + "px;\n";
        });
        
        css += "}\n";

        return {
            content: [
                {
                    type: "text",
                                            text: "🎨 生成的 CSS 变量:\n\n" + css + "\n\n💡 将这些变量添加到你的 CSS 文件中，然后在样式中使用 var(--color-1) 等引用",
                },
            ],
        };
    }
);

server.tool(
    "searchElementsByType",
    "Search for elements by type (text, rectangle, bitmap, etc.)",
    {
        elementType: z.string().describe("Element type: text, rectangle, bitmap, oval, group, artboard"),
    },
    async ({ elementType }) => {
        if (!currentSketchData) {
            return {
                content: [
                    {
                        type: "text",
                        text: "❌ 未加载任何 Sketch 文件！请先使用 loadSketchFile 工具",
                    },
                ],
            };
        }

        const results = [];

        for (const [pageIndex, page] of currentSketchData.pages.entries()) {
            function searchInLayers(layer, path = []) {
                const currentPath = [...path, layer.name || "Unnamed"];

                if (layer._class === elementType) {
                    const style = extractLayerStyle(layer);
                    results.push({
                        pageIndex: pageIndex,
                        pageName: page.data.name,
                        path: currentPath.join(" > "),
                        ...style
                    });
                }

                if (layer.layers && Array.isArray(layer.layers)) {
                    for (const childLayer of layer.layers) {
                        searchInLayers(childLayer, currentPath);
                    }
                }
            }

            if (page.data && page.data.layers) {
                for (const layer of page.data.layers) {
                    searchInLayers(layer);
                }
            }
        }

        return {
            content: [
                {
                    type: "text",
                                            text: "🔍 找到 " + results.length + " 个 \"" + elementType + "\" 类型的元素:\n\n" + JSON.stringify(results, null, 2),
                },
            ],
        };
    }
);

// ================== Sketch JSON 转换工具 ==================

server.tool(
    "loadSketchJSON",
    "加载并解析 Sketch JSON 文件",
    {
        filePath: z.string().describe("Sketch JSON 文件的绝对路径"),
    },
    async ({ filePath }) => {
        try {
            await sketchJSONConverter.loadJSON(filePath);
            currentSketchJSONData = await fs.readFile(filePath, 'utf8').then(JSON.parse);

            // 分析数据结构
            const stats = {
                name: currentSketchJSONData.name || 'Untitled',
                type: currentSketchJSONData.type || 'unknown',
                hasChildren: !!(currentSketchJSONData.children && currentSketchJSONData.children.length > 0),
                childrenCount: currentSketchJSONData.children ? currentSketchJSONData.children.length : 0
            };

            return {
                content: [
                    {
                        type: "text",
                        text: "✅ Sketch JSON 文件加载成功！\n\n📊 文件信息:\n- 文件路径: " + filePath + "\n- 名称: " + stats.name + "\n- 类型: " + stats.type + "\n- 包含子元素: " + (stats.hasChildren ? "是" : "否") + "\n- 子元素数量: " + stats.childrenCount + "\n\n📌 下一步操作:\n1. convertJSONToHTML - 将 JSON 转换为 HTML\n2. generateHTMLFile - 生成完整的 HTML 文件",
                    },
                ],
            };
        } catch (error) {
            return {
                content: [
                    {
                        type: "text",
                        text: "❌ 加载失败: " + error.message,
                    },
                ],
            };
        }
    }
);

server.tool(
    "convertJSONToHTML",
    "将已加载的 Sketch JSON 转换为 HTML 代码",
    {
        outputPath: z.string().optional().describe("可选的输出文件路径，如果不提供则返回 HTML 字符串"),
    },
    async ({ outputPath }) => {
        if (!currentSketchJSONData) {
            return {
                content: [
                    {
                        type: "text",
                        text: "❌ 未加载任何 Sketch JSON 文件！请先使用 loadSketchJSON 工具",
                    },
                ],
            };
        }

        try {
            const html = sketchJSONConverter.generateHTML(currentSketchJSONData);

            // 如果指定了输出路径，保存文件
            if (outputPath) {
                await fs.writeFile(outputPath, html, 'utf8');
                return {
                    content: [
                        {
                            type: "text",
                            text: "✅ HTML 文件生成成功！\n\n📁 保存位置: " + outputPath + "\n\n💡 你可以直接在浏览器中打开这个文件查看效果",
                        },
                    ],
                };
            } else {
                // 返回 HTML 代码的前1000个字符
                const preview = html.substring(0, 1000);
                return {
                    content: [
                        {
                            type: "text",
                            text: "✅ HTML 代码生成成功！\n\n📄 HTML 代码预览 (前1000字符):\n" + preview + "...\n\n💡 完整代码已生成，使用 generateHTMLFile 工具可以保存到文件",
                        },
                    ],
                };
            }
        } catch (error) {
            return {
                content: [
                    {
                        type: "text",
                        text: "❌ 转换失败: " + error.message,
                    },
                ],
            };
        }
    }
);

server.tool(
    "generateHTMLFile",
    "生成完整的 HTML 文件（自动加载 JSON 并转换）",
    {
        jsonFilePath: z.string().describe("Sketch JSON 文件路径"),
        htmlFilePath: z.string().describe("输出的 HTML 文件路径"),
    },
    async ({ jsonFilePath, htmlFilePath }) => {
        try {
            // 加载 JSON
            await sketchJSONConverter.loadJSON(jsonFilePath);

            // 生成 HTML
            const html = sketchJSONConverter.generateHTML();

            // 保存文件
            await fs.writeFile(htmlFilePath, html, 'utf8');

            return {
                content: [
                    {
                        type: "text",
                        text: "✅ HTML 文件生成成功！\n\n📂 源文件: " + jsonFilePath + "\n📄 输出文件: " + htmlFilePath + "\n\n🎨 特性:\n- 使用行内样式，无需额外 CSS 文件\n- 智能布局系统（Flexbox/Grid）\n- 保持原设计的视觉一致性\n\n💡 直接在浏览器中打开 HTML 文件即可查看效果",
                    },
                ],
            };
        } catch (error) {
            return {
                content: [
                    {
                        type: "text",
                        text: "❌ 生成失败: " + error.message + "\n\n💡 请检查:\n1. JSON 文件路径是否正确\n2. JSON 格式是否有效\n3. 是否有文件写入权限",
                    },
                ],
            };
        }
    }
);

server.tool(
    "transformJSON",
    "将简化的 Sketch JSON 转换为低代码格式 JSON",
    {
        inputPath: z.string().describe("源 Sketch JSON 文件路径"),
        outputPath: z.string().optional().describe("可选的输出文件路径，如果不提供则返回 JSON 对象"),
    },
    async ({ inputPath, outputPath }) => {
        try {
            // 加载源 JSON
            const fileContent = await fs.readFile(inputPath, 'utf8');
            const sourceData = JSON.parse(fileContent);

            // 转换为低代码格式
            const lowCodeData = jsonTransformer.transform(sourceData);

            // 如果指定了输出路径，保存文件
            if (outputPath) {
                await fs.writeFile(outputPath, JSON.stringify(lowCodeData, null, 2), 'utf8');
                return {
                    content: [
                        {
                            type: "text",
                            text: "✅ JSON 转换成功！\n\n📂 源文件: " + inputPath + "\n📄 输出文件: " + outputPath + "\n\n🎨 转换特性:\n- 生成 props.style 完整样式对象\n- 自动计算 marginTop/marginLeft 相对边距\n- 基于位置关系重组元素层级\n- 生成 componentName 和 className\n\n💡 转换后的 JSON 可用于低代码平台或进一步处理",
                        },
                    ],
                };
            } else {
                // 返回 JSON 预览
                const preview = JSON.stringify(lowCodeData, null, 2).substring(0, 2000);
                return {
                    content: [
                        {
                            type: "text",
                            text: "✅ JSON 转换成功！\n\n📄 低代码格式 JSON 预览 (前2000字符):\n" + preview + "...\n\n💡 使用 outputPath 参数可以保存到文件",
                        },
                    ],
                };
            }
        } catch (error) {
            return {
                content: [
                    {
                        type: "text",
                        text: "❌ 转换失败: " + error.message + "\n\n💡 请检查:\n1. 源 JSON 文件路径是否正确\n2. JSON 格式是否有效",
                    },
                ],
            };
        }
    }
);

// ================== 启动入口 ==================
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);

    console.log("🟢 MCP Sketch Parser Server 正在运行 (HTML 生成优化版)");
    console.log("\n📌 核心工具 (用于 HTML 生成):");
    console.log("  1. loadSketchFile - 加载 Sketch 文件");
    console.log("  2. getDesignTokens - 提取设计规范 (颜色/字体/间距)");
    console.log("  3. getPageForHTML - 获取页面完整 UI 结构");
    console.log("  4. getArtboardForHTML - 获取指定画板详情");
    console.log("  5. listImages - 列出所有图片资源");
    console.log("  6. getImageBase64 - 获取图片 base64 数据");
    console.log("  7. generateCSSVariables - 生成 CSS 变量");
    console.log("  8. searchElementsByType - 按类型搜索元素");
    console.log("\n📌 Sketch JSON 转换工具:");
    console.log("  9. loadSketchJSON - 加载 Sketch JSON 文件");
    console.log(" 10. convertJSONToHTML - 将 JSON 转换为 HTML");
    console.log(" 11. generateHTMLFile - 一键生成 HTML 文件");
    console.log(" 12. transformJSON - 将 JSON 转换为低代码格式");
    console.log("\n📌 使用流程:");
    console.log('  [Sketch 文件] loadSketchFile() → getDesignTokens() → getPageForHTML()');
    console.log('  [Sketch JSON] loadSketchJSON() → convertJSONToHTML() 或 generateHTMLFile()');
    console.log('  [JSON 清洗] transformJSON() → 生成低代码格式 JSON');
}

main().catch((error) => {
    console.error("🚨 严重错误:", error);
    process.exit(1);
});
