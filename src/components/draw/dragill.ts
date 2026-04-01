import { CanvasTool } from "../entity/CanvasTool"
import { Mouse } from "../controller/Mouse"
import { Rect } from "../entity/Rect"
import { Card } from "../maker/card"


// Kéo thả ảnh minh họa
export class IllDrager {
    cvt: CanvasTool
    card: Card
    mouse: Mouse

    startX: number = 0
    startY: number = 0
    startRect: Rect = new Rect(0, 0, 0, 0)
    isDragging: boolean = false

    constructor(cvt: CanvasTool, card: Card, mouse: Mouse) {
        this.cvt = cvt
        this.card = card
        this.mouse = mouse
    }


    // Bắt đầu kéo thả
    start() {
        const pos = this.mouse.getPos()
        this.startX = pos.x
        this.startY = pos.y
        this.isDragging = true
        this.startRect = new Rect(this.card.x, this.card.y, this.card.w, this.card.h)
    }

    // Kết thúc kéo thả
    end() {
        this.isDragging = false
    }

    // Di chuyển ảnh minh họa
    drag() {
        if (!this.isDragging && (this.mouse.isDown())) {
            this.start()
        } else if (this.isDragging && !this.mouse.isDown()) {
            this.end()
        }

        if (this.isDragging) {
            this.mouse.visible()
            const newRect = this.startRect.move(this.mouse.getPos().x - this.startX, this.mouse.getPos().y - this.startY)
            this.card.x = newRect.x
            this.card.y = newRect.y
            this.card.w = newRect.w
            this.card.h = newRect.h
        }
    }
}