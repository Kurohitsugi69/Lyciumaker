import { Fragment } from "./fragment";
import { Box } from "./move";
import * as df from "../fonts/dynamicFont"
import { CanvasTool, tempCanvas } from "../entity/CanvasTool";
import { Vector } from "../entity/Vector";

// Vẽ đường đứt nét
function drawDashedLine(ctx: CanvasRenderingContext2D, c1: number[], c2: number[]) {
    ctx.strokeStyle = "gray"
    ctx.lineWidth = 1.5
    ctx.setLineDash([4, 4])
    ctx.beginPath();
    ctx.moveTo(c1[0], c1[1]);
    ctx.lineTo(c2[0], c2[1]);
    ctx.stroke();
    ctx.closePath();
}

// Vẽ khung hình chữ nhật đứt nét
function drawDashRect(ctx: CanvasRenderingContext2D, c1: number[], c2: number[]) {
    const c3 = [c2[0], c1[1]]
    const c4 = [c1[0], c2[1]]

    drawDashedLine(ctx, c1, c3);
    drawDashedLine(ctx, c3, c2);
    drawDashedLine(ctx, c2, c4);
    drawDashedLine(ctx, c4, c1);
}

// Vẽ đường phụ trợ
export function drawAuxiliaryLines(ctx: CanvasRenderingContext2D, width: number, margin: number) {
    const wm = width + margin
    const w2m = width / 2 + margin
    drawDashedLine(ctx, [w2m, margin], [w2m, wm])
    drawDashedLine(ctx, [margin, w2m], [wm, w2m])
    drawDashRect(ctx, [margin, margin], [wm, wm])
}

// Vẽ chữ
export function drawText(ctx: CanvasRenderingContext2D, fg: Fragment, width: number, isMouseDown: boolean, margin: number) {
    // Thông tin cơ bản
    let text: string = fg.text[0][0]
    text = typeof (text) == 'undefined' ? '' : text[0]
    const size: number[] = fg.size
    const mask: number[] = fg.mask

    // Canvas tạm thời
    const logicSize = new Vector(width, width)
    const tcvt = tempCanvas(logicSize, logicSize)

    // Tham số vẽ
    const dx = (Number(width) - Number(size[2])) / 2 + size[0]
    const dy = (Number(width) - Number(size[3])) / 2 + size[1]
    const sx = (mask[0] - dx) / size[2] * width
    const sy = (mask[1] - dy) / size[3] * width
    const sw = (mask[2] - mask[0]) / size[2] * width
    const sh = (mask[3] - mask[1]) / size[3] * width
    tcvt.ctx.textAlign = "center"
    tcvt.ctx.textBaseline = "middle"

    // Lấy font chữ
    df.fontsTexts.jinmeiTexts = df.contrastAddFont(df.fontsTexts.jinmeiTexts, text)
    tcvt.ctx.font = width + "px JinMeiMaoCaoXing-" + text


    // Vẽ toàn bộ chữ khi nhấn chuột
    if (isMouseDown && fg.isSelect()) {
        tcvt.ctx.fillStyle = "#00000022"
        tcvt.ctx.fillText(text, width / 2, width / 2)
    }

    // Vẽ mặt nạ (mask)
    tcvt.ctx.rect(sx, sy, sw, sh);
    tcvt.ctx.clip();

    // Vẽ chữ
    tcvt.ctx.fillStyle = fg.isSelect() ? 'blue' : 'black'
    tcvt.ctx.fillText(text, width / 2, width / 2)

    // Vẽ Canvas tạm thời lên Canvas chính
    ctx.drawImage(tcvt.canvas, dx + Number(margin), dy + Number(margin), size[2], size[3])
}
