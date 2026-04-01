import { Vector } from "./Vector"

// Lưu trữ tham số Canvas
export class CanvasTool {
    canvas: HTMLCanvasElement      // Canvas
    ctx: CanvasRenderingContext2D  // Context của Canvas
    logicSize: Vector              // Kích thước logic
    displaySize: Vector            // Kích thước hiển thị

    // Hàm tạo
    constructor(canvas: HTMLCanvasElement, logicSize: Vector, displaySize: Vector, superdpr: number = 1) {
        this.canvas = canvas
        this.ctx = canvas.getContext('2d') as CanvasRenderingContext2D
        this.logicSize = logicSize
        this.displaySize = displaySize
        this.setCanvasSize(superdpr)
    }

    // Thiết lập kích thước Canvas
    setCanvasSize(superdpr: number = 1) {
        const canvas = this.canvas
        const dpr = Math.max(2, window.devicePixelRatio) * superdpr
        canvas.width = this.logicSize.x * dpr
        canvas.height = this.logicSize.y * dpr
        canvas.style.width = this.displaySize.x + 'px'
        canvas.style.height = this.displaySize.y + 'px'
        this.ctx.scale(dpr, dpr)
    }

    // Xóa Canvas
    clear() {
        this.ctx.clearRect(0, 0, this.logicSize.x, this.logicSize.y)
    }

    // Kiểm tra Canvas có hiển thị không
    isVisible() {
        return this.canvas.offsetParent !== null
    }
}

// Tạo Canvas tạm thời
export function tempCanvas(logicSize: Vector, displaySize: Vector, superdpr: number = 1) {
    const canvasElement = document.createElement('canvas') as HTMLCanvasElement
    return new CanvasTool(canvasElement, logicSize, displaySize, superdpr)
}