import { Mouse } from "../controller/Mouse"

// Biến liên quan đến khung biến dạng
export type Box = {
    anchorWidth: number,
    moving: number,
    startC: number[],
    startSize: number[],
    mvAnchors: number[][],
    mkAnchors: number[][]
}

// Chuyển đổi tọa độ x1, y1, x2, y2 <=> x, y, w, h
function coordTrans(size: number[], toCenter: boolean, width: number) {
    if (toCenter) {
        return [(size[2] + size[0] - width) / 2, (size[3] + size[1] - width) / 2, size[2] - size[0], size[3] - size[1]]
    } else {
        return [(width - size[2]) / 2 + size[0], (width - size[3]) / 2 + size[1], (width + size[2]) / 2 + size[0], (width + size[3]) / 2 + size[1]]
    }
}

// Cộng vector
function addVec(a: number[], b: number[], isround = false) {
    let res: number[] = []
    for (let i = 0; i < a.length; i++) {
        let added = Number(a[i]) + Number(b[i])
        added = isround ? Math.round(added) : added
        res.push(added)
    }
    return res
}

// Khoảng cách Euclid
function euclideanDistance(c1: number[], c2: number[]) {
    return Math.abs(Number(c1[0]) - Number(c2[0])) + Math.abs(Number(c1[1]) - Number(c2[1]))
}

// Kiểm tra x có nằm giữa a và b không
function isBetween(x: number, a: number, b: number) {
    return (x >= a && x <= b) || (x <= a && x >= b)
}

// Di chuyển khung biến dạng
export function moveTransBox(box: Box, _size: number[], mouse: Mouse, isMv: boolean, width: number, keepRatio = true) {
    // Kiểm tra xem có di chuyển không
    const anchors = isMv ? box.mvAnchors : box.mkAnchors
    const size = isMv ? _size : coordTrans(_size, true, width)
    let res: number[]

    // console.log(`[moveTransBox] isMouseDown: ${isMouseDown}, moving: ${box.moving}`)

    if (mouse.isDown() && box.moving == -1) {
        if (isBetween(mouse.getPos().x, anchors[0][0], anchors[2][0]) && isBetween(mouse.getPos().y, anchors[0][1], anchors[6][1])) {
            box.moving = 8;
            box.startC = [mouse.getPos().x, mouse.getPos().y];
            box.startSize = [size[0], size[1], size[2], size[3]]
        }

        for (let i = 0; i < anchors.length; i++) {
            if (euclideanDistance([mouse.getPos().x, mouse.getPos().y], anchors[i]) <= box.anchorWidth * 4) {
                box.moving = i;
                box.startC = [mouse.getPos().x, mouse.getPos().y];
                box.startSize = [size[0], size[1], size[2], size[3]]
                break;
            }
        }
    } else if (!mouse.isDown() && box.moving != -1) {

        box.moving = -1;
        box.startC = [0, 0];
    }

    // Di chuyển
    if (box.moving != -1) {
        const speedX = mouse.getPos().x - box.startC[0];
        const speedY = mouse.getPos().y - box.startC[1];

        const deltas = [[speedX / 2, speedY / 2, -speedX, -speedY],
        [0, speedY / 2, 0, -speedY],
        [speedX / 2, speedY / 2, speedX, -speedY],
        [speedX / 2, 0, speedX, 0],
        [speedX / 2, speedY / 2, speedX, speedY],
        [0, speedY / 2, 0, speedY],
        [speedX / 2, speedY / 2, -speedX, speedY],
        [speedX / 2, 0, -speedX, 0],
        [speedX, speedY, 0, 0]];

        let added = addVec(box.startSize, deltas[box.moving], true)
        added = [added[0], added[1], Math.abs(added[2]), Math.abs(added[3])]

        // Đảm bảo tỷ lệ khung hình không đổi
        if (keepRatio) {
            const aspectRatio = box.startSize[2] / box.startSize[3]
            if ([0, 2, 4, 6].indexOf(box.moving) != -1) {
                const newW = added[2]
                const newH = newW / aspectRatio
                added = [box.startSize[0], box.startSize[1], newW, newH]
            }
        }

        res = added;
    } else {
        res = size
    }

    return isMv ? res : coordTrans(res, false, width)
}

// Vẽ khung neo hình vuông
export function drawTransBox(ctx: CanvasRenderingContext2D, _size: number[], width: number, margin: number, anchorWidth: number, trans: boolean, color = 'blue', points = true) {
    ctx.strokeStyle = color;
    ctx.setLineDash([]);

    const size = trans ? _size : coordTrans(_size, true, width)

    const c = size.slice(0, 2)
    const wh = size.slice(2, 4)

    const x1 = (Number(width) - Number(wh[0])) / 2 + Number(c[0]);
    const y1 = (Number(width) - Number(wh[1])) / 2 + Number(c[1]);
    const x2 = x1 + Number(wh[0]);
    const y2 = y1 + Number(wh[1]);

    ctx.strokeRect(x1 + margin, y1 + margin, x2 - x1, y2 - y1);

    function fillCursorRect(x: number, y: number) {
        ctx.fillStyle = color;
        ctx.fillRect(x - anchorWidth, y - anchorWidth, anchorWidth * 2, anchorWidth * 2);
    }

    const anchors = [[x1, y1], [(x1 + x2) / 2, y1],
    [x2, y1], [x2, (y1 + y2) / 2],
    [x2, y2], [(x1 + x2) / 2, y2],
    [x1, y2], [x1, (y1 + y2) / 2]]

    if (points) {
        for (let i = 0; i < anchors.length; i++) {
            fillCursorRect(anchors[i][0] + margin, anchors[i][1] + margin)
        }
    }

    return anchors
}