<script setup lang="ts">

import { onMounted, Ref, ref, watch } from 'vue'
import { Fragments } from './fragment'
import { drawAuxiliaryLines, drawText } from './draw'

import EditCards from './EditCards.vue'
import { downloadJson } from './util'
import { refChars } from './chars'
import { translate } from '../fonts/trainslate'
import { Mouse } from '../controller/Mouse'
import { CanvasTool } from '../entity/CanvasTool'
import { Vector } from '../entity/Vector'
import { AnchorBox } from '../entity/AnchorBox'
import { Rect } from '../entity/Rect'

// Tham số component
const props = defineProps<{
    fragments: Fragments
}>()

// Tự động nhập Phồn thể
const refIsTranslate = ref(true)


// Các hằng số liên quan đến Canvas
const displayw: number = 400 // Chiều rộng hiển thị
const width: number = 512  // Chiều rộng logic
const margin: number = displayw * 0.05; // Lề cơ bản

// Các biến liên quan đến Canvas
let cvt: CanvasTool

// Tất cả các đoạn ký tự
const fragments: Fragments = props.fragments

// Các biến liên quan đến chuột
let mouse: Mouse

// Các biến liên quan đến khung neo
let anchorBox: AnchorBox

// Vòng lặp hoạt ảnh
function loop() {
    // Xóa Canvas
    cvt.clear()

    // Vẽ đường phụ trợ
    drawAuxiliaryLines(cvt.ctx, width, margin)

    // Vẽ văn bản
    for (let i = 0; i < fragments.flist.length; i++) {
        const fgs = fragments
        const fg = fgs.flist[i]
        drawText(cvt.ctx, fg, width, mouse.isDown(), margin)
    }

    // Vẽ khung neo
    for (let fg of fragments.flist) {
        const state = fg.selectState()
        if (state != 'none') {
            const size = fg.getSize()
            const mask = fg.getMask()
            anchorBox.resize(Rect.fromCenterCoord(size.x + width / 2, size.y + width / 2, size.w, size.h), Rect.fromQuadCoord(mask.x1, mask.y1, mask.x2, mask.y2))
            const res = anchorBox.move(state)
            fg.size = [res.size.x + res.size.w / 2 - width / 2, res.size.y + res.size.h / 2 - width / 2, res.size.w, res.size.h]
            fg.mask = [res.mask.x, res.mask.y, res.mask.x + res.mask.w, res.mask.y + res.mask.h]
            anchorBox.draw(state)
        }
    }

    // Hoạt ảnh chuột
    mouse.visible()

    // Khung hình tiếp theo
    window.requestAnimationFrame(loop);
}

// Khởi tạo Canvas và bắt đầu vòng lặp hoạt ảnh
function oninitCanvas() {
    const canvas = document.getElementById('drawBoard') as HTMLCanvasElement;
    const logicSize =  new Vector(width + margin * 2, width + margin * 2) 
    const displaySize = new Vector(displayw, displayw)
    cvt = new CanvasTool(canvas, logicSize, displaySize)
    mouse = new Mouse(cvt)
    anchorBox = new AnchorBox(cvt, mouse, margin)
    window.requestAnimationFrame(loop)
}

// Khởi tạo Canvas khi mount
onMounted(() => {
    oninitCanvas()
})

// Kiểm tra xem đã nhập Hán tự Giản thể và Phồn thể chưa
function titleGuard(sc: string, tc: string) {
    if (sc.length > 0 && tc.length > 0) {
        return true
    } else if (sc.length < 1 && tc.length < 1) {
        alert('Vui lòng nhập Hán tự Giản thể và Phồn thể')
    } else if (sc.length < 1) {
        alert('Vui lòng nhập Hán tự Giản thể')
    } else if (tc.length < 1) {
        alert('Vui lòng nhập Hán tự Phồn thể')
    } 
    return false
}

// Áp dụng
function apply() {
    if (titleGuard(fragments.sch, fragments.zch)) {
        refChars.value.add(fragments)
    }
}

// Xuất Json
function exportJson() {
    if (titleGuard(fragments.sch, fragments.zch)) {
        apply()
        const sp = fragments.sch[0]
        const td =  fragments.zch[0]
        downloadJson(`${sp}-${td}.json`, fragments.tojson())
    }
}

// Nhấp để nhập Json
function importJsonClick() {
    const fileElement = document.getElementById('import-json')
    fileElement?.click()
}

// Nhập Json
function importJson(event: any) {
    const file = event.target.files[0]
    const reader = new FileReader()
    reader.readAsText(file)
    reader.onload = () => {
        const fgs = new Fragments
        try {
            fgs.fromjson(reader.result as string)
            refChars.value.add(fgs)
        } catch (err) {
            alert('Phân tích JSON thất bại! Thông tin lỗi: ' + err)
        }

    }
}

watch(() => {return fragments.sch}, (n, o) => {
    console.log(o, n)
    if (refIsTranslate.value) {
        fragments.zch = translate(n)
    }
})

</script>

<template>
    <div class="board">
        <!-- Trình chỉnh sửa chính -->
        <div class="card">
            <canvas id="drawBoard"></canvas>
        </div>
        <!-- Nút xuất -->
        <div class="card export">
            <div class="text exportLine">Hán tự Giản thể*</div>
            <div class="exportLine">
                <input class="textInput" v-model="fragments.sch">
            </div>
            <div class="row-flex-center">
                <div class="exportLine">Phồn thể*</div>
                <input type="checkbox" v-model="refIsTranslate">
                <div>Tự động</div>
            </div>
            <div class="exportLine">
                <input class="textInput" v-model="fragments.zch" :disabled="refIsTranslate">
            </div>
            <div class="exportLine">Mô tả (tùy chọn)</div>
            <div class="exportLine">
                <input class="textInput" v-model="fragments.describe">
            </div>
            <div class="exportLine">
                <button @click="apply">Áp dụng</button>
            </div>
            <div class="exportLine">
                <button @click="exportJson">Xuất JSON</button>
            </div>
            <div class="exportLine" style="visibility:hidden">
                <button>Tải lên máy chủ</button>
            </div>
            <div class="exportLine" style="visibility:hidden">
                <button>？ ？？？</button>
            </div>
            <div class="exportLine">
                <button @click="importJsonClick()">Nhập JSON</button>
            </div>

            <div class="row-flex-center" style="display: none;">
                <input id='import-json' type="file" accept=".json" @change="importJson($event)">
            </div>

        </div>
        <!-- Trình chỉnh sửa tham số -->
        <EditCards :fragments='fragments'></EditCards>
    </div>

</template>

<style scoped>

.card {
    border-radius: 5px;
    box-shadow: 0px 0px 7px 0px rgb(167, 161, 161);
    padding: 5px;
    margin: 5px;
    width: fit-content;
}

.board {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
}

.export {
    font-family: "PingFang SC", SimHei, Monaco, Consolas, monospace;
    color: gray;
    font-weight: 600;
    font-size: 10px;
}

.exportLine {
    margin: 5px;
}

.textInput {
    border-style: none;
    border-radius: 5px;
    padding: 3px 5px;
    width: 60px;
    background-color: rgb(237, 237, 237);
}

button {
    border-color: #fff;
    border-style: solid;
    border-radius: 10px;
    height: 25px;
    background-color: #fff;
    box-shadow: rgb(60 64 67 / 30%) 0 1px 3px 0;
}

button:hover {
    background-color: rgb(216, 216, 216);
    border-color: rgb(216, 216, 216);
}

button:active {
    border-color: rgb(41, 41, 41);
}

.row-flex-center {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    place-items: center;
    padding: 1px;
}
</style>
