import { CanvasTool } from "../entity/CanvasTool"
import { Mouse } from "../controller/Mouse"
import { Rect } from "../entity/Rect"
import { Card } from "../maker/card"
import { getTitleRect, getNameRect } from './draw'

// Kéo thả ảnh minh họa và vị trí text
export class IllDrager {
    cvt: CanvasTool
    card: Card
    mouse: Mouse

    startX: number = 0
    startY: number = 0
    startRect: Rect = new Rect(0, 0, 0, 0)
    startTitlePos = { x: 0, y: 0 }
    startNamePos = { x: 0, y: 0 }
    dragMode: 'image' | 'title' | 'name' | null = null
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
        const titleRect = getTitleRect(this.cvt, this.card)
        const nameRect = getNameRect(this.cvt, this.card)

        if (this.mouse.isInRect(titleRect)) {
            this.dragMode = 'title'
            this.startTitlePos = { x: this.card.titleX, y: this.card.titleY }
        } else if (this.mouse.isInRect(nameRect)) {
            this.dragMode = 'name'
            this.startNamePos = { x: this.card.nameX, y: this.card.nameY }
        } else {
            this.dragMode = 'image'
        }
    }

    // Kết thúc kéo thả
    end() {
        this.isDragging = false
        this.dragMode = null
    }

    // Di chuyển ảnh minh họa
    drag() {
        if (!this.isDragging && this.mouse.isDown()) {
            this.start()
        } else if (this.isDragging && !this.mouse.isDown()) {
            this.end()
        }

        if (this.isDragging) {
            this.mouse.visible()
            const deltaX = this.mouse.getPos().x - this.startX
            const deltaY = this.mouse.getPos().y - this.startY

            if (this.dragMode === 'title') {
                this.card.titleX = this.startTitlePos.x + deltaX
                this.card.titleY = this.startTitlePos.y + deltaY
            } else if (this.dragMode === 'name') {
                this.card.nameX = this.startNamePos.x + deltaX
                this.card.nameY = this.startNamePos.y + deltaY
            } else {
                const newRect = this.startRect.move(deltaX, deltaY)
                this.card.x = newRect.x
                this.card.y = newRect.y
                this.card.w = newRect.w
                this.card.h = newRect.h
            }
        }
    }
}