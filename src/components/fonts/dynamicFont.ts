export const fontsTexts = {
    jinmeiTexts: '',     // Danh sách font chữ Kim Mai đã lấy
    fangzhengTexts: '',  // Danh sách font chữ Lệ Thư đã lấy
    newchuanTexts: ''        // Danh sách font chữ Tân Triện đã lấy
}

// Nội dung văn bản CSS khi thêm font chữ mới
function fontFaceStr(name: string, fontName: string, fontPath: string) {
    return `@font-face {font-family: "${fontName}-${name[0]}";src: url("${fontPath}-${name[0]}.woff") format('woff');font-display: swap;}`
}

// Thêm font chữ mới
function addFontFace(name: string, fontName: string, fontPath: string) {
    const style = document.createElement('style');
    style.innerText = fontFaceStr(name, fontName, fontPath);
    document.documentElement.appendChild(style)
}

// Nếu có ký tự mới xuất hiện, thêm font chữ mới tương ứng
export function contrastAddFont(texts: string, text: string, fontName = 'JinMeiMaoCaoXing', fontPath = '/fonts/JinMeiMaoCaoXing/JinMeiMaoCaoXing') {
    const allSet = new Set(texts)
    const difSet = new Set(text.split('').filter(x => !allSet.has(x)))
    texts += [...difSet].join('')
    for (let text of difSet) {
        addFontFace(text, fontName, fontPath)
    }

    return texts
}