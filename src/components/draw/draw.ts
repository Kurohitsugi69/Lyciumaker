import { Miscellaneous } from "./miscellaneous";
import { LazyImage } from './lazyimage'

import { sets } from '../fonts/sets'
import * as df from '../fonts/dynamicFont'
import { translate } from "../fonts/trainslate";

import { Card } from "../maker/card";
import { Power, DualFrame } from "../maker/card";

import { refChars } from '../puzzle/chars'
import { Fragments } from "../puzzle/fragment";
import { Vector } from "../entity/Vector";

import { Config } from '../config/config'
import { applyText } from './textstyle'
import { CanvasTool } from "../entity/CanvasTool";

// Khung viền
class OutFrame {
    frameName: string[] = []
    frame: LazyImage[] = []

    // Map tên khung đôi → LazyImage
    dualFrameMap: { [key: string]: LazyImage } = {}

    constructor() {
        // Khung đơn (cũ)
        for (let key in Power) {
            for (let isLord of [false, true]) {
                const name = `old1_${Power[key]}${isLord ? '_zhu' : ''}`
                const url = `/png/${name}.png`
                this.frameName.push(name)
                this.frame.push(new LazyImage(url))
            }
        }
        // Khung đôi (2 thế lực)
        for (let key in DualFrame) {
            const file = DualFrame[key].file
            const url = `/png/${file}.png`
            this.dualFrameMap[key] = new LazyImage(url)
        }
    }

    // Lấy khung viền đơn, trong đó power là tên thế lực trong tệp tài nguyên
    get(power: string, isLord: boolean) {
        if (power == 'shen') {
            isLord = false
        }
        const name = `old1_${power}${isLord ? '_zhu' : ''}`
        for (let i = 0; i < this.frameName.length; i++) {
            if (this.frameName[i] == name) {
                return this.frame[i].get()
            }
        }
        throw Error(`[draw.ts/OutFrame] Không tìm thấy khung viền ${name}`)
    }

    // Lấy khung viền đôi theo tên hiển thị
    getDual(dualName: string) {
        if (this.dualFrameMap[dualName]) {
            return this.dualFrameMap[dualName].get()
        }
        return null
    }
}
export const outFrame = new OutFrame()

// Xóa Canvas
export function clearCanvas(cvt: CanvasTool) {
    cvt.ctx.clearRect(0, 0, cvt.logicSize.x, cvt.logicSize.y)
}

// Vẽ ảnh minh họa
export function drawIllatration(canvas: CanvasTool, card: Card) {
    if (card.illastration.isLoad) {
        const dx = canvas.logicSize.x / 2 + card.x - card.w / 2
        const dy = canvas.logicSize.y / 2 + card.y - card.h / 2
        canvas.ctx.drawImage(card.illastration.img, dx, dy, card.w, card.h)
    }
}

// Vẽ khung viền
export function drawOutFrame(cvt: CanvasTool, card: Card, outFrame: OutFrame) {
    let img = null
    if (card.dualFrame && card.dualFrame !== '') {
        img = outFrame.getDual(card.dualFrame)
    } else {
        img = outFrame.get(card.power, card.isLord)
    }
    if (img) {
        cvt.ctx.drawImage(img, 0, 0, cvt.logicSize.x, cvt.logicSize.y)
    }
}

// Vẽ sinh lực và giới hạn sinh lực
export function drawHeartLimit(cf: Config, cvt: CanvasTool, card: Card, miscellanous: Miscellaneous) {
    // 基本参数
    const heart = card.heart
    const heartLimit = card.isHreatLimit ? card.heartLimit : card.heart
    let xoff = cf.heart.xoff
    if (heartLimit >= cf.heart.nmax) {
        xoff = xoff * (cf.heart.nmax - 1) / (heartLimit - 1)
    }

    // 图片素材
    const effectivePower = miscellanous.getEffectivePower(card)
    const s1 = miscellanous.getHeart(effectivePower, false, card.isLord)
    const s2 = miscellanous.getHeart(effectivePower, true, card.isLord)
    const img = miscellanous.getImg()

    // 绘制
    if (img) {
        for (let i = 0; i < Math.max(heart, heartLimit); i++) {
            const s = i < heart ? s1 : s2
            const d = [cf.heart.dx + xoff * i, cf.heart.dy, cf.heart.w, cf.heart.h]
            cvt.ctx.drawImage(img, s[0], s[1], s[2], s[3], d[0], d[1], d[2], d[3])
        }
    }
}

// Vẽ danh hiệu theo từng chữ
function drawTitleChar(cvt: CanvasTool, card: Card, miscellaneous: Miscellaneous, x: number, y: number, fontSize: number, char: string) {
    cvt.ctx.fillStyle = 'black'
    cvt.ctx.textAlign = 'center'
    cvt.ctx.textBaseline = 'middle'

    cvt.ctx.strokeStyle = "rgb(0, 0, 0)";
    cvt.ctx.lineWidth = 2.5;
    cvt.ctx.fillStyle = miscellaneous.getTitleColor(card.power, card.isLord)
    cvt.ctx.font = (card.isTitleBold ? 'bold ' : '') + fontSize + "px " + card.titleFont
    cvt.ctx.strokeText(char, x, y)
    cvt.ctx.fillText(char, x, y)
}

// Vẽ danh hiệu võ tướng (bên trái, mỗi TỪ một dòng)
function drawTitle(cf: Config, cvt: CanvasTool, card: Card, miscellaneous: Miscellaneous, y1: number, y2: number) {
    const x1 = card.power === 'shen' ? cf.titleName.shenx1 : cf.titleName.x1
    const text = card.isTranslate ? translate(card.title) : card.title
    const words = text.split(' ').filter((w: string) => w.length > 0)
    if (words.length === 0) return

    const fontSize = card.titleFontSize
    // Khoảng cách dòng: ưu tiên vừa khít vùng, nhưng không lớn hơn 1.4 * fontSize
    const availableSpace = y2 - y1
    let yoff = Math.min(availableSpace / words.length, fontSize * 1.4)
    let ytop = (availableSpace - yoff * (words.length - 1)) / 2

    for (let i = 0; i < words.length; i++) {
        const yi = y1 + ytop + yoff * i
        drawTitleChar(cvt, card, miscellaneous, x1, yi, fontSize, words[i])
    }
}

// Phân tích văn bản có thẻ màu [#RRGGBB]văn bản[#]
export function parseRichText(text: string, defaultColor: string) {
    const result: { text: string, color: string }[] = []
    const regex = /\[#(.*?)\](.*?)\[#\]/g
    let lastIndex = 0
    let match

    while ((match = regex.exec(text)) !== null) {
        if (match.index > lastIndex) {
            result.push({ text: text.substring(lastIndex, match.index), color: defaultColor })
        }
        result.push({ text: match[2], color: match[1] })
        lastIndex = regex.lastIndex
    }

    if (lastIndex < text.length) {
        result.push({ text: text.substring(lastIndex), color: defaultColor })
    }

    return result.length > 0 ? result : [{ text, color: defaultColor }]
}

// Vẽ tên võ tướng theo từng từ
function drawNameWord(cvt: CanvasTool, x: number, y: number, fontSize: number, word: string, fontName: string, color: string) {
    cvt.ctx.textAlign = 'center'
    cvt.ctx.textBaseline = 'middle'

    const line1Width = 0.08;
    const line2Width = 0.07;
    const font = fontSize + "px " + fontName

    // Loại bỏ hoàn toàn các thẻ màu nếu có để tên tướng sạch sẽ
    const displayText = word.replace(/\[#(.*?)\]/g, '').replace(/\[#\]/g, '')

    cvt.ctx.font = font
    // Viền 1
    cvt.ctx.strokeStyle = 'white'
    cvt.ctx.lineWidth = line1Width * fontSize
    cvt.ctx.strokeText(displayText, x, y);
    // Viền 2
    cvt.ctx.strokeStyle = 'black'
    cvt.ctx.lineWidth = line2Width * fontSize
    cvt.ctx.strokeText(displayText, x, y);
    // Đổ màu
    cvt.ctx.fillStyle = color
    cvt.ctx.fillText(displayText, x, y)
}

// Vẽ tên võ tướng (bên phải, mỗi TỪ một dòng)
function drawName(cf: Config, cvt: CanvasTool, card: Card, y2: number, y3: number) {
    const x1 = card.power === 'shen' ? cf.titleName.shenx1 : cf.titleName.x2
    const text = card.isTranslate ? translate(card.name) : card.name
    const words = text.split(' ').filter((w: string) => w.length > 0)
    if (words.length === 0) return

    const fontSize = card.nameFontSize
    const availableSpace = y3 - y2
    // Khoảng cách giữa các dòng: ưu tiên vừa khít vùng
    let yoff = Math.min(availableSpace / words.length, fontSize * 1.2)
    let ytop = (availableSpace - yoff * (words.length - 1)) / 2

    for (let i = 0; i < words.length; i++) {
        const y = y2 + ytop + yoff * i
        drawNameWord(cvt, x1, y, fontSize, words[i], card.nameFont, card.nameColor)
    }
}

// Vẽ danh hiệu và tên võ tướng
export function drawTitleName(cf: Config, cvt: CanvasTool, card: Card, miscellaneous: Miscellaneous, bottomy: number) {
    const y1 = cf.titleName.y1
    const y3 = bottomy + cf.titleName.y3off
    const y2 = y1 + (y3 - y1) * cf.titleName.ratio

    // Vẽ danh hiệu (bên trái)
    drawTitle(cf, cvt, card, miscellaneous, y1, y2)

    // Vẽ tên võ tướng (bên phải)
    drawName(cf, cvt, card, y2, y3)
}

// Vẽ khung hợp kỹ
export function drawComboBox(cf: Config, cvt: CanvasTool, card: Card, miscellaneous: Miscellaneous, skillTopy: number) {
    if (!card.comboText || card.comboText.trim() === '') return

    const text = card.comboText
    const fontSize = card.comboFontSize
    const padding = cf.comboBox.padding

    cvt.ctx.font = fontSize + 'px ' + card.comboFont
    applyText(cvt.ctx, cf.comboBox.textStyle)

    const textWidth = cvt.ctx.measureText(text).width
    const boxWidth = textWidth + padding * 4
    const boxHeight = fontSize + padding * 2
    // Canh phải: cách mép phải 15px
    const rightMargin = 15
    const boxX = cvt.logicSize.x - boxWidth - rightMargin
    const boxY = skillTopy - boxHeight - 4

    // Vẽ nền hộp
    const effectivePower = miscellaneous.getEffectivePower(card)
    const color = miscellaneous.getColor(effectivePower)
    cvt.ctx.fillStyle = color + 'B3'
    cvt.ctx.beginPath()
    const r = cf.comboBox.cornerRadius
    cvt.ctx.moveTo(boxX + r, boxY)
    cvt.ctx.lineTo(boxX + boxWidth - r, boxY)
    cvt.ctx.quadraticCurveTo(boxX + boxWidth, boxY, boxX + boxWidth, boxY + r)
    cvt.ctx.lineTo(boxX + boxWidth, boxY + boxHeight - r)
    cvt.ctx.quadraticCurveTo(boxX + boxWidth, boxY + boxHeight, boxX + boxWidth - r, boxY + boxHeight)
    cvt.ctx.lineTo(boxX + r, boxY + boxHeight)
    cvt.ctx.quadraticCurveTo(boxX, boxY + boxHeight, boxX, boxY + boxHeight - r)
    cvt.ctx.lineTo(boxX, boxY + r)
    cvt.ctx.quadraticCurveTo(boxX, boxY, boxX + r, boxY)
    cvt.ctx.closePath()
    cvt.ctx.fill()

    // Vẽ viền
    cvt.ctx.strokeStyle = 'rgba(255, 220, 150, 0.6)'
    cvt.ctx.lineWidth = 1.5
    cvt.ctx.stroke()

    // Vẽ text (canh giữa trong hộp)
    cvt.ctx.font = fontSize + 'px ' + card.comboFont
    applyText(cvt.ctx, cf.comboBox.textStyle)
    cvt.ctx.fillText(text, boxX + boxWidth / 2, boxY + boxHeight / 2)
}

// Vẽ thông tin phía dưới
export function drawBottom(cf: Config, cvt: CanvasTool, card: Card) {
    // 基本参数
    const isShen = (card.power === 'shen')
    const x1 = isShen ? cf.bottom.shenx1 : cf.bottom.x1
    const x2 = isShen ? cf.bottom.shenx2 : cf.bottom.x2
    const y1 = cf.bottom.y1
    const style = isShen ? cf.bottom.shenTextStyle : cf.bottom.textStyle
    applyText(cvt.ctx, style)
    cvt.ctx.font = cf.bottom.font

    // 文本
    let msg = '';
    msg += card.isProducer ? `™&@ ${card.producer}. ` : ''
    msg += card.isIllustrator ? `illustration: ${card.illastrator}` : ''

    // 绘制
    cvt.ctx.fillText(msg, x1, y1)
    if (card.isCardNum) {
        msg = String(card.cardNum)
        cvt.ctx.textAlign = 'right'
        cvt.ctx.fillText(msg, x2, y1);
    }
}

// Vẽ thông tin phiên bản
export function drawVersion(cf: Config, cvt: CanvasTool, version: string) {
    const text = 'Lycium Card Maker ' + version
    cvt.ctx.font = cf.version.font
    applyText(cvt.ctx, cf.version.textStyle)
    cvt.ctx.fillText(text, cf.version.x, cf.version.y)
}