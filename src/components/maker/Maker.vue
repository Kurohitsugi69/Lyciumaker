<script setup lang="ts">

import { onMounted, Ref, ref, watch, nextTick } from 'vue';
import { miscellaneous } from '../draw/miscellaneous';
import * as dw from '../draw/draw'
import { drawSkills } from '../draw/drawSkills'
import { IllDrager } from '../draw/dragill'
import { Vector } from '../entity/Vector';
import { Card, Power, FONTS, DualFrame } from './card'
import { translate } from '../fonts/trainslate'
import { computed } from '@vue/reactivity';
import { refChars } from '../puzzle/chars';
import { sets } from '../fonts/sets';

import { Config } from '../config/config'
import { oldConfig } from '../config/old'

import { Mouse } from '../controller/Mouse';
import { CanvasTool } from '../entity/CanvasTool';

import { StopWatch } from '../util/StopWatch'

import { serializeCard, deserializeCard, validateProject } from './projectSerializer'
import { downloadJson } from '../puzzle/util'

const props = defineProps(['version'])

const logicWidth = 400
const ratio = 89 / 64
const logicSize = new Vector(logicWidth, logicWidth * ratio)
const styleSize = new Vector().like(logicSize)

var rcvt: Ref<CanvasTool>                     // Các tham số liên quan đến CanvasTool
const rcard: Ref<Card> = ref(new Card())  // Các tham số liên quan đến thẻ bài
let isCardChanged: boolean = false      // Tham số thẻ bài có thay đổi không
const config: Config = oldConfig          // Tệp cấu hình

// Các tham số liên quan đến chuột
var mouse: Mouse
var illDrager: IllDrager

// // 动态改变卡牌宽度
// window.onresize = setCnavseSize

// 根据窗口大小改变卡牌大小
function setCnavseSize() {
    const width = Math.min(window.innerWidth - 10, rcvt.value.logicSize.x)
    if (width != rcvt.value.displaySize.x) {
        rcvt.value.displaySize = new Vector(width, width * ratio)
        rcvt.value.setCanvasSize(2)
    }
}

// 更改插画
function changeIllastration(event: any) {
    const url: string = URL.createObjectURL(event.target.files[0])
    rcard.value.importIllastration(url, rcvt.value)
}

// 缩放插画
watch(() => { return rcard.value.scale }, (n, o) => {
    rcard.value.scale = Math.max(rcard.value.scale, 1)
    const ratio = typeof (n / 100) === 'number' ? n / 100 : 1
    const f2 = (e: number) => Number(e.toFixed(2))
    rcard.value.w = f2(rcard.value.illastration.width * ratio)
    rcard.value.h = f2(rcard.value.illastration.height * ratio)
})

// 保存卡牌
function exportCard() {
    function download() {
        const downloadLink = document.createElement('a');
        const fileName = rcard.value.name + '.png'
        downloadLink.setAttribute('download', fileName);
        rcvt.value.canvas.toBlob((blob) => {
            if (blob) {
                const url = URL.createObjectURL(blob);
                downloadLink.setAttribute('href', url);
                downloadLink.click();
            }
        })
    }
    download();
}

async function downloadProject() {
    try {
        const projectData = await serializeCard(rcard.value)
        const projectName = rcard.value.name || 'card-project'
        downloadJson(`${projectName}.json`, JSON.stringify(projectData, null, 2))
    } catch (error) {
        console.error('Failed to save project:', error)
        alert('Lỗi lưu dự án: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }
}


async function saveProject() {
    try {
        const projectData = await serializeCard(rcard.value)
        const projectName = rcard.value.name || 'card-project'
        const jsonContent = JSON.stringify(projectData, null, 2)
        
        if ('showSaveFilePicker' in window) {
            try {
                const handle = await (window as any).showSaveFilePicker({
                    suggestedName: `${projectName}.json`,
                    types: [
                        {
                            description: 'JSON Files',
                            accept: { 'application/json': ['.json'] },
                        },
                    ],
                })
                
                const writable = await handle.createWritable()
                await writable.write(jsonContent)
                await writable.close()
                alert('Save successful!')
            } catch (err: any) {
                if (err.name !== 'AbortError') {
                    console.error('Save error:', err)
                    alert('Lỗi lưu dự án: ' + (err instanceof Error ? err.message : 'Unknown error'))
                }
            }
        } else {
            // Fallback: use traditional download if browser doesn't support File System API
            downloadProject()
        }
    } catch (error) {
        console.error('Failed to save project:', error)
        alert('Lỗi lưu dự án: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }
}

function openLoadProject() {
    const fileInput = document.getElementById('load-project-file') as HTMLInputElement
    fileInput?.click()
}

async function loadProject(event: Event) {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]
    
    if (!file) return
    
    try {
        const text = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = (e) => {
                const content = e.target?.result as string
                resolve(content)
            }
            reader.onerror = () => reject(new Error('Failed to read file'))
            reader.readAsText(file)
        })
        
        const projectJson = JSON.parse(text)
        
        if (!validateProject(projectJson)) {
            alert('File không hợp lệ. Vui lòng kiểm tra định dạng file.')
            return
        }
        
        await deserializeCard(projectJson, rcard.value, rcvt.value)
        isCardChanged = true
        alert('Load successful!')
    } catch (error) {
        console.error('Failed to load project:', error)
        alert('Lỗi tải dự án: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
        // Reset file input so same file can be loaded again
        input.value = ''
    }
}

// 导入插画
function importIll() {
    const file = document.getElementById('import-ill')
    file?.click()
}

// 修改渲染间隔
function changeRenderInterval(intv: number, time: number) {
    const minTime = 30
    const maxTime = 240
    const stride = 3
    const expected = 1.5
    const tolerance = 0.1
    if (time <= expected * (1 - tolerance)) {
        intv -= stride
        intv = Math.max(intv, minTime)
    } else if (time >= expected * (1 + tolerance)) {
        intv += stride
        intv = Math.min(intv, maxTime)
    }
    return intv
}

// Vòng lặp hoạt ảnh
const rstopWatch = ref(new StopWatch())  // Bộ đếm thời gian hiệu năng
let stopWatch = rstopWatch.value
var loopcnt = 0 // Số lần lặp hiển thị
const renderIntv = ref(30)  // Khoảng thời gian hiển thị động
function loop() {
    stopWatch.restart()
    // Chỉ hiển thị lại khi nội dung cần vẽ thay đổi
    if (isCardChanged || loopcnt % renderIntv.value == 0 || illDrager.isDragging) {
        // 清空画布
        dw.clearCanvas(rcvt.value)
        // 绘制插画
        dw.drawIllatration(rcvt.value, rcard.value)
        // 绘制外框
        dw.drawOutFrame(rcvt.value, rcard.value, dw.outFrame)
        // 绘制体力
        dw.drawHeartLimit(config, rcvt.value, rcard.value, miscellaneous)
        // Vẽ kỹ năng
        stopWatch.lap()
        const bottomy = drawSkills(config, rcvt.value, rcard.value, miscellaneous).topy
        // Vẽ khung hợp kỹ
        dw.drawComboBox(config, rcvt.value, rcard.value, miscellaneous, bottomy)
        // Vẽ danh hiệu và tên võ tướng
        stopWatch.lap()
        dw.drawTitleName(config, rcvt.value, rcard.value, miscellaneous)
        // 绘制底部信息
        stopWatch.lap()
        dw.drawBottom(config, rcvt.value, rcard.value)
        // 绘制版本信息
        stopWatch.lap()
        dw.drawVersion(config, rcvt.value, props.version)
        // Thiết lập lại cờ vẽ
    isCardChanged = false
    }

    // Kéo thả ảnh minh họa
    stopWatch.lap()
    illDrager.drag()
    stopWatch.lap()
    stopWatch.toString()

    // Cập nhật lại khoảng thời gian hiển thị
    if (loopcnt > 300) {
        renderIntv.value = changeRenderInterval(renderIntv.value, stopWatch.getAvgTime())
    }

    // Khung hình tiếp theo
    loopcnt += 1
    window.requestAnimationFrame(loop);
}

// 修改技能数量
function changeNumSkill() {
    rcard.value.numSkill = Math.max(0, rcard.value.numSkill)
    if (rcard.value.numSkill >= 100) {
        alert('Số lượng kỹ năng quá nhiều! Vui lòng không vượt quá 100 kỹ năng!')
        rcard.value.numSkill = rcard.value.skills.length
    } else {
        while (rcard.value.skills.length < rcard.value.numSkill) {
            rcard.value.addSkill()
        }
        while (rcard.value.skills.length > rcard.value.numSkill) {
            rcard.value.rmSkill()
        }
    }
}

function copyToClip(text: string) {
    const el = document.createElement('textarea');
    el.value = text;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
}

function copyColorTag(event: Event) {
    const color = (event.target as HTMLInputElement).value;
    const tag = `[#${color}]văn bản[#]`;
    copyToClip(tag);
    alert('Đã copy thẻ màu: ' + tag + '\nHãy dán vào phần văn bản!');
}

const selectedColor = ref('#000000')

function getSelectedSkillText() {
    const textareas = document.querySelectorAll('.skill-text') as NodeListOf<HTMLTextAreaElement>;
    for (let i = 0; i < textareas.length; i++) {
        const ta = textareas[i];
        if (ta.selectionStart !== ta.selectionEnd) {
            return {
                skillIndex: i,
                textarea: ta,
                start: ta.selectionStart,
                end: ta.selectionEnd,
            }
        }
    }
    return null
}

function applyColorTagToSelection() {
    const colorHex = selectedColor.value.replace('#', '')
    const selected = getSelectedSkillText()
    if (!selected) {
        alert('Vui lòng bôi đen đoạn văn bản cần đổi màu!')
        return
    }

    const skill = rcard.value.skills[selected.skillIndex]
    const selectedText = skill.text.slice(selected.start, selected.end)
    const styledText = `[#${colorHex}]${selectedText}[#]`

    skill.text = skill.text.slice(0, selected.start) + styledText + skill.text.slice(selected.end)
    selected.textarea.selectionStart = selected.start
    selected.textarea.selectionEnd = selected.start + styledText.length
    selected.textarea.focus()
    isCardChanged = true
}

function applyColorTag(event: Event) {
    selectedColor.value = (event.target as HTMLInputElement).value
    applyColorTagToSelection()
}



// Đảm bảo giá trị sinh lực luôn lớn hơn hoặc bằng 0
watch(() => { return rcard.value.heart }, (n, o) => {
    rcard.value.heart = Math.max(0, rcard.value.heart)
    rcard.value.heartLimit = Math.max(rcard.value.heart, rcard.value.heartLimit)
})

// Đảm bảo giới hạn sinh lực lớn hơn hoặc bằng giá trị sinh lực
watch(() => { return rcard.value.heartLimit }, (n, o) => {
    rcard.value.heartLimit = Math.max(rcard.value.heart, rcard.value.heartLimit)
})

// Theo dõi sự thay đổi tham số thẻ bài
watch(() => { return rcard.value }, (n, o) => {
    isCardChanged = true
}, { deep: true })

// Kiểm tra chữ bị thiếu
const missing = computed(() => {
    let text = rcard.value.name
    if (rcard.value.isTranslate) {
        text = translate(rcard.value.name)
    }
    let res = ''
    for (let char of text) {
        if (!(sets.jinmei.has(char) || refChars.value.zchs.indexOf(char) >= 0)) {
            res = res + char
        }
    }
    return res
})

// Khởi tạo Canvas
function initCanvas() {
    const canvas = document.getElementById('card-preview') as HTMLCanvasElement
    rcvt = ref(new CanvasTool(canvas, logicSize, styleSize))
}

// Khởi tạo Canvas khi mount
onMounted(() => {
    initCanvas()
    mouse = new Mouse(rcvt.value)
    illDrager = new IllDrager(rcvt.value, rcard.value, mouse)
    window.requestAnimationFrame(loop);
    rcard.value.importIllastration('/png/刘备-六星耀帝.png', rcvt.value);
})

</script>

<template>

    <div id="maker" class="row-flex">
        <div>
            <canvas id="card-preview"></canvas>
            <!-- <div style="font-size:12px; padding-left:10px; padding-bottom:5px; color:lightslategray; line-height: 100%; font-family:monospace, 'Courier New', Courier;">{{renderIntv}}-{{stopWatch.str}}</div> -->
        </div>
        

        <div id="editor" class="card">
            <div class="row-flex-center">
                <div class="btn greenBtn" @click="exportCard()">Lưu thẻ</div>
            </div>

            <div class="row-flex-center">
                <div class="btn" @click="saveProject()" title="Lưu dự án dưới dạng file JSON">💾 Save As</div>
                <!-- <div class="btn" @click="downloadProject()" title="Tải xuống dự án dưới dạng file JSON">⬇️ Tải xuống</div> -->
                <div class="btn" @click="openLoadProject()" title="Tải dự án từ file JSON">📂 Load Project</div>
            </div>

            <input id="load-project-file" type="file" accept=".json" @change="loadProject($event)" style="display: none;">

            <hr class="cardHr">
            <div class="row-flex-center">
                <div class="btn wideBtn" @click="importIll()">Nhập ảnh minh họa</div>
            </div>

            <div class="row-flex-center" style="display: none;">
                <input id='import-ill' type="file" accept="image/jpeg, image/png, image/webp, image/jpg"
                    @change="changeIllastration($event)">
            </div>

            <div class="row-flex-center">
                <div class="x2 mona">X:</div>
                <input class="textInput" type="number" v-model="rcard.x">
                <div class="x2 mona">Y:</div>
                <input class="textInput" type="number" v-model="rcard.y">
            </div>
            <div class="row-flex-center">
                <div class="x2 mona">W:</div>
                <input class="textInput" type="number" v-model="rcard.w" disabled="true">
                <div class="x2 mona">H:</div>
                <input class="textInput" type="number" v-model="rcard.h" disabled="true">
            </div>
            <div class="row-flex-center">
                <div class="x2">Thu phóng</div>
                <input class="textInput" type="number" v-model="rcard.scale">
                <div class="btn" @click="rcard.scale = Number((rcard.scale * 0.97833).toFixed(2))">-</div>
                <div class="btn" @click="rcard.scale = Number((rcard.scale * 1.02215).toFixed(2))">+</div>
                <div class="btn" @click="rcard.scale = 100">Đặt lại</div>
            </div>

            <hr class="cardHr">
            <!--
            <div class="row-flex-center">
                <div class="row-flex-center x4">
                    <input type="checkbox" v-model="rcard.isProducer">
                    <div>Bản quyền</div>
                </div>
                <input class="textInput" :class="{ hidden: !rcard.isProducer }" v-model="rcard.producer">
            </div>
            <div class="row-flex-center">
                <div class="row-flex-center x4">
                    <input type="checkbox" v-model="rcard.isIllustrator">
                    <div>Họa sĩ</div>
                </div>
                <input class="textInput" :class="{ hidden: !rcard.isIllustrator }" v-model="rcard.illastrator">
            </div>
            <div class="row-flex-center">
                <div class="row-flex-center x4">
                    <input type="checkbox" v-model="rcard.isCardNum">
                    <div>Số hiệu</div>
                </div>
                <input class="textInput" :class="{ hidden: !rcard.isCardNum }" v-model="rcard.cardNum">
            </div>
            -->

            <hr class="cardHr">
            <div class="row-flex-center">
                <input type="checkbox" v-model="rcard.isTranslate">
                <div>Chuyển Giản - Phồn</div>
            </div>
            <div class="row-flex-center">
                <div class="x4">Danh hiệu</div>
                <input class="textInput" v-model="rcard.title">
                <div class="translated" v-show="rcard.isTranslate">{{ translate(rcard.title) }}</div>
            </div>
            <div class="row-flex-center">
                <div class="x4">Vị trí</div>
                X: <input class="textInput" type="number" v-model="rcard.titleX">
                Y: <input class="textInput" type="number" v-model="rcard.titleY">
            </div>
            <div class="row-flex-center">
                <select class="fontSelect" v-model="rcard.titleFont">
                    <option v-for="(val, name) in FONTS" :value="val">{{ name }}</option>
                </select>
                <input class="sizeInput" type="number" v-model="rcard.titleFontSize" min="8" max="60">
                <span class="sizeLabel">px</span>
                <input type="checkbox" v-model="rcard.isTitleBold">
                <div class="sizeLabel">Đậm</div>
            </div>
            <div class="row-flex-center">
                <div class="x4">Võ tướng</div>
                <input class="textInput" v-model="rcard.name">
                <div class="translated" v-show="rcard.isTranslate">{{ translate(rcard.name) }}</div>
            </div>
            <div class="row-flex-center">
                <div class="x4">Vị trí</div>
                X: <input class="textInput" type="number" v-model="rcard.nameX">
                Y: <input class="textInput" type="number" v-model="rcard.nameY">
            </div>
            <div class="row-flex-center">
                <select class="fontSelect" v-model="rcard.nameFont">
                    <option v-for="(val, name) in FONTS" :value="val">{{ name }}</option>
                </select>
                <input class="sizeInput" type="number" v-model="rcard.nameFontSize" min="8" max="80">
                <span class="sizeLabel">px</span>
                <input type="color" v-model="rcard.nameColor" title="Chọn màu tên võ tướng">
            </div>
            <!--
            <div class="row-flex-center">
                <div v-show="missing.length > 0" class="tip">Phát hiện thiếu chữ ({{ missing }}), khuyên dùng tính năng ghép chữ</div>
            </div>
            -->
            <div class="row-flex-center">
                <div class="x4">Hợp Kỹ</div>
                <input class="textInput" v-model="rcard.comboText" placeholder="Ví dụ: Khổng Minh | Gia Cát Lượng">
            </div>
            <div class="row-flex-center">
                <select class="fontSelect" v-model="rcard.comboFont">
                    <option v-for="(val, name) in FONTS" :value="val">{{ name }}</option>
                </select>
                <input class="sizeInput" type="number" v-model="rcard.comboFontSize" min="8" max="40">
                <span class="sizeLabel">px</span>
                <input type="color" v-model="rcard.comboColor" title="Chọn màu chữ ComboBox">
            </div>

            <hr class="cardHr">
            <div class="row-flex-center">
                <div class="x4">Thế lực</div>
                <select v-model="rcard.power">
                    <option v-for="(val, name, idx) in Power" :value="val">{{ name }}</option>
                </select>
                <input type="checkbox" v-model="rcard.isLord">
                <div>Chúa công</div>
            </div>
            <div class="row-flex-center">
                <div class="x4">Khung 2 phía</div>
                <select v-model="rcard.dualFrame" class="dualFrameSelect">
                    <option value="">— Không dùng —</option>
                    <option v-for="(val, name) in DualFrame" :value="name">{{ name }}</option>
                </select>
            </div>
            <div class="row-flex-center">
                <div class="x4">Tỉ lệ khung</div>
                <input class="sizeInput" type="number" v-model.number="rcard.outerFrameScale" min="50" max="150">
                <span class="sizeLabel">%</span>
                <input type="range" min="50" max="150" v-model.number="rcard.outerFrameScale" style="flex:1; margin:0 8px;">
            </div>
            <div class="row-flex-center">
                <div class="x4">Sinh lực</div>
                <input class="textInput" type="number" v-model="rcard.heart">
                <div class="btn" @click="rcard.heart--">-</div>
                <div class="btn" @click="rcard.heart++">+</div>
            </div>
            <div class="row-flex-center">
                <input type="checkbox" v-model="rcard.isHreatLimit">
                <div>Sinh lực không bằng giới hạn</div>
            </div>
            <div v-show="rcard.isHreatLimit" class="row-flex-center">
                <div class="x4">Giới hạn</div>
                <input class="textInput" type="number" v-model="rcard.heartLimit">
                <div class="btn" @click="rcard.heartLimit--">-</div>
                <div class="btn" @click="rcard.heartLimit++">+</div>
            </div>

            <hr class="cardHr">
            <div class="row-flex-center">
                <div class="x4">Số kỹ năng</div>
                <input class="textInput" type="number" v-model="rcard.numSkill" @change="changeNumSkill">
                <div class="btn" @click="rcard.numSkill--; changeNumSkill()">-</div>
                <div class="btn" @click="rcard.numSkill++; changeNumSkill()">+</div>
            </div>
        </div>

        <div id="skills" class="row-flex">
            <div class="card" v-for="(skill, i) in rcard.skills">
                <div class="row-flex-center">
                    <div class="x4">Kỹ năng {{ i + 1 }}</div>
                    <input type="checkbox" v-model="skill.isItalic">
                    <div>Nghiêng</div>
                </div>
                <div class="row-flex-center">
                    <div class="x4">Tên</div>
                    <input class="textInput" v-model="skill.name">
                </div>
                <div class="row-flex-center">
                    <select class="fontSelect" v-model="rcard.skillNameFont">
                        <option v-for="(val, name) in FONTS" :value="val">{{ name }}</option>
                    </select>
                    <input class="sizeInput" type="number" v-model="rcard.skillNameFontSize" min="8" max="40">
                    <span class="sizeLabel">px</span>
                </div>

                <hr class="cardHr">
                <div class="row-flex-center">
                    <div class="x4">Mô tả</div>
                </div>
                <div class="row-flex-center">
                    <select class="fontSelect" v-model="rcard.skillTextFont">
                        <option v-for="(val, name) in FONTS" :value="val">{{ name }}</option>
                    </select>
                    <input class="sizeInput" type="number" v-model="rcard.skillTextFontSize" min="6" max="20">
                    <span class="sizeLabel">px</span>
                    <input type="color" v-model="selectedColor" title="Chọn màu" />
                    <button class="btn" @click="applyColorTagToSelection" title="Bôi đen text rồi bấm Apply">Apply</button>
                </div>
                <div class="row-flex-center">
                    <textarea class="skill-text" v-model="skill.text" rows="5" style="width:100%; resize:vertical; white-space: pre-wrap;"></textarea>
                </div>
            </div>
        </div>
    </div>

    <!-- <div>{{rcard}}</div> -->

</template>

<style scoped>

@font-face {
    font-family: "FangZhengZhuYuan";
    src: url("/fonts/MoTaKyNang.ttf") format('truetype');
    font-display: swap;
}

#maker {
    font-family: "PingFang SC", SimHei, monospace, Monaco, Consolas, monospace;
    color: rgb(38, 38, 38);
    font-size: 14px;
}

.mona {
    font-family: Monaco;
    font-size: 13px;
}

.card {
    border-radius: 5px;
    box-shadow: 0px 0px 7px 0px rgb(167 161 161);
    padding: 10px;
    margin: 5px;
}

#card-preview {
    border-radius: 5px;
    box-shadow: 0px 0px 7px 0px rgb(167 161 161);
    margin: 5px;
}

.row-flex {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
}

.row-flex-center {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    place-items: center;
    padding: 1px;
}

.cardHr {
    border: 0;
    height: 1px;
    background-color: rgb(195, 195, 195);
}

.x2 {
    width: 30px;
}

.x4 {
    width: 60px;
}

.textInput {
    width: 80px;
    border-radius: 5px;
    border-style: none;
    height: 15px;
    padding: 3px;
    margin: 3px;
    background-color: rgb(237, 237, 237);
}

.btn {
    padding: 1px 10px;
    margin: 0px 3px;
    border-radius: 10px;
    box-shadow: rgb(60 64 67 / 30%) 0 1px 3px 0;
    user-select: none;
}

.btn:hover {
    background-color: dimgray;
    cursor: pointer;
    background-color: rgb(216, 216, 216);
}

.btn:active {
    background-image: linear-gradient(to bottom right, #81fbb878, #28c76f78);
}

.greenBtn {
    background-image: linear-gradient(to bottom right, #4ff79bc0, #009543d6);
    padding: 4px 10px;
}

.wideBtn {
    width: 100%;
    text-align: center;
}

.hidden {
    visibility: hidden;
}

.tip {
    font-size: 10px;
    color: brown;
}

.skill-text {
    min-height: 100px;
}

.translated {
    color: gray;
    padding: 0px 0px 0px 10px;
    font-size: 10px
}

.fontSelect {
    border-radius: 5px;
    border-style: none;
    height: 22px;
    padding: 2px 4px;
    margin: 3px;
    background-color: rgb(237, 237, 237);
    font-size: 12px;
    max-width: 120px;
}

.dualFrameSelect {
    border-radius: 5px;
    border-style: none;
    height: 22px;
    padding: 2px 4px;
    margin: 3px;
    background-color: rgb(237, 237, 237);
    font-size: 12px;
    max-width: 170px;
}

.sizeInput {
    width: 40px;
    border-radius: 5px;
    border-style: none;
    height: 18px;
    padding: 2px 4px;
    margin: 3px;
    background-color: rgb(237, 237, 237);
    font-size: 12px;
    text-align: center;
}

.sizeLabel {
    font-size: 11px;
    color: #888;
    margin-right: 5px;
}
</style>