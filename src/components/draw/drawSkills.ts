import { Config } from "../config/config"
import { Card, Skill } from "../maker/card"
import { Vector } from '../entity/Vector'
import { Rect } from '../entity/Rect'
import { transColor } from "../util/transcolor"
import { Miscellaneous } from "./miscellaneous"
import { applyText } from "./textstyle"
import * as df from "../fonts/dynamicFont"
import { CanvasTool, tempCanvas } from "../entity/CanvasTool"
import { parseRichText, normalizeRichTextInput } from "./draw"

// Vẽ một dòng kỹ năng
function drawLine(cf: Config, cvt: CanvasTool, card: Card, line: string, fontSize: number, isItalic: boolean, lastLine: boolean, drawRatio = 0, y: number, xoff: number) {
    let font = fontSize + "px " + card.skillTextFont
    font = isItalic ? 'italic ' + font : font

    // Phân tích text giàu màu sắc [#RRGGBB]văn bản[#]
    const segments = parseRichText(line, cf.skText.textStyle.fillStyle as string || 'black')

    // Tính tổng chiều rộng
    let w1 = 0
    cvt.ctx.font = font
    for (const seg of segments) {
        w1 += cvt.ctx.measureText(seg.text).width
    }

    const size = new Vector(w1, fontSize * 2)
    const tempCvs = tempCanvas(size, size, 1.5)
    tempCvs.ctx.font = font
    tempCvs.ctx.textBaseline = 'middle'

    // Vẽ từng đoạn
    let currentX = 0
    for (const seg of segments) {
        let fill = seg.color
        if (/^[0-9a-fA-F]{3,6}$/.test(fill)) {
            fill = '#' + fill
        } else if (!fill.startsWith('#')) {
            // giữ nguyên nếu là tên màu hoặc rgb()
            fill = fill
        }
        tempCvs.ctx.fillStyle = fill

        // Vẽ đoạn text này
        tempCvs.ctx.fillText(seg.text, currentX, size.y / 2)

        currentX += tempCvs.ctx.measureText(seg.text).width
    }

    // Xác định chiều rộng
    let w2 = cf.skText.w - xoff  // Chiều rộng vẽ
    w2 = lastLine ? w1 : w2
    w2 = lastLine && drawRatio ? w1 * drawRatio : w2
    const d = {
        x: cf.skText.x1 + xoff,
        y: y - size.y / 2,
        w: w2,
        h: size.y
    }

    // 绘制
    cvt.ctx.drawImage(tempCvs.canvas, d.x, d.y, d.w, d.h)

    return w2 / w1
}

// Vẽ và lấy chiều cao của kỹ năng
function skillHeight(cf: Config, cvt: CanvasTool, card: Card, skill: Skill, isDraw: boolean = false, y: number, fontSize: number) {
    let height = 0
    const rawText = normalizeRichTextInput(skill.text)
    const lines: { text: string, xoff: number }[] = []
    const yoff = fontSize * (1 + cf.skText.rowSpacing)

    applyText(cvt.ctx, cf.skText.textStyle)
    cvt.ctx.font = fontSize + "px " + card.skillTextFont

    // Tách văn bản thành đoạn (dựa vào newline), sau đó ngắt dòng theo độ rộng
    const paragraphs = rawText.split(/\r?\n/)
    let currentLine = ''
    let isFirstLine = true

    const getTextWidth = (t: string) => {
        const cleanText = t.replace(/\[#([0-9a-fA-F]+)\]/g, '').replace(/\[#\]/g, '')
        return cvt.ctx.measureText(cleanText).width
    }

    const flushCurrentLine = () => {
        if (currentLine !== '') {
            lines.push({ text: currentLine, xoff: isFirstLine ? cf.skText.indent * fontSize : 0 })
            currentLine = ''
            isFirstLine = false
        }
    }

    for (let pi = 0; pi < paragraphs.length; pi++) {
        const paragraph = paragraphs[pi]
        if (paragraph.trim() === '') {
            flushCurrentLine()
            // giữ 1 dòng trống
            lines.push({ text: '', xoff: 0 })
            continue
        }

        const words = paragraph.split(' ')
        for (let i = 0; i < words.length; i++) {
            const xoff = isFirstLine ? cf.skText.indent * fontSize : 0
            const testLine = currentLine === '' ? words[i] : currentLine + ' ' + words[i]
            const textWidth = getTextWidth(testLine)

            if (textWidth + cf.skText.epsilon * fontSize >= cf.skText.w - xoff && currentLine !== '') {
                lines.push({ text: currentLine, xoff })
                currentLine = words[i]
                isFirstLine = false
            } else {
                currentLine = testLine
            }
        }
        flushCurrentLine()

        // Nếu còn đoạn tiếp, thêm dòng trống giữa đoạn
        if (pi < paragraphs.length - 1) {
            lines.push({ text: '', xoff: 0 })
        }
    }

    if (lines.length === 0) {
        return 0
    }

    height = lines.length * yoff

    if (isDraw) {
        for (let li = 0; li < lines.length; li++) {
            const lineInfo = lines[li]
            const lastLine = li === lines.length - 1
            if (lineInfo.text !== '') {
                drawLine(cf, cvt, card, lineInfo.text, fontSize, skill.isItalic, lastLine, 0, y + li * yoff, lineInfo.xoff)
            }
        }
    }

    return height
}

// Lấy chiều cao nhóm kỹ năng
function skillsHeight(cf: Config, cvt: CanvasTool, card: Card, y1: number, fontSize: number, isDraw: boolean) {
    let heights = 0
    const skillsy: number[] = []  // Tọa độ y bắt đầu của mỗi kỹ năng
    for (let skill of card.skills) {
        const spacing = heights > 0 ? cf.skText.spacing * fontSize : 0
        skillsy.push(y1 + heights + spacing + fontSize / 2)
        const height = skillHeight(cf, cvt, card, skill, isDraw, y1 + heights + spacing + fontSize / 2, fontSize)
        heights = heights + spacing + height
    }
    return {
        height: heights,
        skillsy: skillsy
    }
}

// Vẽ hình chữ nhật vát góc
function drawCornerRect(cvt: CanvasTool, rect: Rect, corner: number, isFill = false) {
    // Xác định tọa độ
    const line = rect.getCornerOutline(corner)

    // Vẽ
    cvt.ctx.beginPath()
    cvt.ctx.lineTo(line[0].x, line[0].y)
    for (let c of line.slice(1, line.length)) {
        cvt.ctx.lineTo(c.x, c.y)
    }
    isFill ? cvt.ctx.fill() : cvt.ctx.stroke()
    cvt.ctx.closePath()
}

// Vẽ nền kỹ năng
function drawSkillBackground(cf: Config, cvt: CanvasTool, card: Card, miscellaneous: Miscellaneous, y1: number) {
    const alpha = transColor(cf.skBg.alpha)  // Độ trong suốt
    const effectivePower = miscellaneous.getEffectivePower(card)
    const color = miscellaneous.getColor(effectivePower) + alpha  // Màu sắc

    // Tọa độ 4 góc
    const height = cf.skText.y2 - y1
    let rect = new Rect(cf.skText.x1, y1, cf.skText.w, height)
    rect = rect.scaleWidth(cf.skBg.wScale).scaleHeight(cf.skBg.hScale)

    // Kiểu dáng vẽ
    cvt.ctx.fillStyle = color
    cvt.ctx.lineWidth = cf.skBg.lineWidth
    cvt.ctx.strokeStyle = color

    // Vẽ
    drawCornerRect(cvt, rect, cf.skBg.corner, false)
    drawCornerRect(cvt, rect.scale(-cf.skBg.margin), cf.skBg.corner, true)
}

// Vẽ khung tên kỹ năng
function drawSkillNameFrames(cf: Config, cvt: CanvasTool, card: Card, misellaneous: Miscellaneous, skillsy: number[]) {
    const effectivePower = misellaneous.getEffectivePower(card)
    const s = misellaneous.getSkillbox(effectivePower)
    const img = misellaneous.getImg()
    if (img) {
        for (let dy of skillsy) {
            const d = {
                x: cf.skText.x1 + cf.skFrame.xoff,
                y: dy + cf.skFrame.yoff,
                w: cf.skFrame.w,
                h: cf.skFrame.h
            }
            cvt.ctx.drawImage(img, s.x, s.y, s.w, s.h, d.x, d.y, d.w, d.h)
        }
    }
}

// Vẽ tên kỹ năng
function drawSkillNames(cf: Config, cvt: CanvasTool, card: Card, skillsy: number[]) {
    // Thiết lập kiểu văn bản
    const textStyle = card.power === 'shen' ? cf.skName.shenTextStyle : cf.skName.textStyle
    applyText(cvt.ctx, textStyle)

    // Vẽ tên kỹ năng
    for (let i = 0; i < card.skills.length; i++) {
        const dy = skillsy[i]
        let text = card.skills[i].name
        const fontName = card.skillNameFont

        cvt.ctx.font = card.skillNameFontSize + "px " + fontName
        const d = {
            x: cf.skText.x1 + cf.skName.xoff,
            y: dy + cf.skName.yoff
        }
        cvt.ctx.fillText(text, d.x, d.y)
    }
}

// Vẽ kỹ năng
export function drawSkills(cf: Config, cvt: CanvasTool, card: Card, miscellaneous: Miscellaneous) {
    const maxHeight = (cf.skText.y2 - cf.skText.maxy1) * cf.skText.maxHeight
    let y1 = cf.skText.maxy1          // Tọa độ y đỉnh nhóm kỹ năng
    let fontSize = card.skillTextFontSize  // Kích thước font nhóm kỹ năng

    // 1. Xác định tọa độ y đỉnh nhóm kỹ năng và kích thước font nhóm kỹ năng
    let sh = skillsHeight(cf, cvt, card, y1, fontSize, false)
    while (fontSize >= 2 && sh.height > maxHeight) {
        fontSize--
        sh = skillsHeight(cf, cvt, card, y1, fontSize, false)
    }
    y1 = Math.min(cf.skText.y2 - sh.height, cf.skText.maxy1)

    // 2. Vẽ nền nhóm kỹ năng
    drawSkillBackground(cf, cvt, card, miscellaneous, y1)

    // 3. Vẽ văn bản kỹ năng
    sh = skillsHeight(cf, cvt, card, y1, fontSize, true)

    // 4. Vẽ khung tên kỹ năng
    drawSkillNameFrames(cf, cvt, card, miscellaneous, sh.skillsy)

    // 5. Vẽ tên kỹ năng
    drawSkillNames(cf, cvt, card, sh.skillsy)

    return { topy: y1 }
}