<script setup lang="ts">
import { computed, ref } from 'vue'
import { jsPDF } from 'jspdf'

interface UploadedImage {
  id: string
  name: string
  dataUrl: string
  width: number
  height: number
}

type PaperType = 'A4' | 'A3' | 'A2'

type OrientationType = 'portrait' | 'landscape'

const paper = ref<PaperType>('A4')
const orientation = ref<OrientationType>('portrait')
const uploadedImages = ref<UploadedImage[]>([])
const fileInput = ref<HTMLInputElement | null>(null)

const paperSizes: Record<PaperType, { w: number; h: number }> = {
  A4: { w: 210, h: 297 },
  A3: { w: 297, h: 420 },
  A2: { w: 420, h: 594 }
}

const pageSize = computed(() => paperSizes[paper.value])
const pageWidthMm = computed(() => orientation.value === 'portrait' ? pageSize.value.w : pageSize.value.h)
const pageHeightMm = computed(() => orientation.value === 'portrait' ? pageSize.value.h : pageSize.value.w)
const cardWidthMm = 62
const cardHeightMm = 88
const pageMarginMm = 8
const gridGapMm = 3

const availableWidthMm = computed(() => Math.max(0, pageWidthMm.value - pageMarginMm * 2))
const availableHeightMm = computed(() => Math.max(0, pageHeightMm.value - pageMarginMm * 2))
const cols = computed(() => Math.max(1, Math.floor((availableWidthMm.value + gridGapMm) / (cardWidthMm + gridGapMm))))
const rows = computed(() => Math.max(1, Math.floor((availableHeightMm.value + gridGapMm) / (cardHeightMm + gridGapMm))))
const cardsPerPage = computed(() => cols.value * rows.value)
const pageCount = computed(() => Math.ceil(uploadedImages.value.length / cardsPerPage.value))

const previewScale = 2.2
const previewWidthPx = computed(() => pageWidthMm.value * previewScale)
const previewHeightPx = computed(() => pageHeightMm.value * previewScale)
const slotWidthPx = computed(() => cardWidthMm * previewScale)
const slotHeightPx = computed(() => cardHeightMm * previewScale)
const pageMarginPx = computed(() => pageMarginMm * previewScale)
const gridGapPx = computed(() => gridGapMm * previewScale)

const pages = computed(() => Array.from({ length: pageCount.value }, (_, i) => i))

function openFilePicker() {
  fileInput.value?.click()
}

function generateId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

async function handleFiles(event: Event) {
  const input = event.target as HTMLInputElement
  const files = input.files
  if (!files) return

  for (let i = 0; i < files.length; i += 1) {
    const file = files[i]
    if (!file.type.startsWith('image/')) continue
    try {
      const dataUrl = await readFileAsDataUrl(file)
      const image = await loadImage(dataUrl)
      uploadedImages.value.push({
        id: generateId(),
        name: file.name,
        dataUrl,
        width: image.naturalWidth,
        height: image.naturalHeight
      })
    } catch (err) {
      console.warn('Không thể đọc ảnh:', err)
    }
  }
  if (input) {
    input.value = ''
  }
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = dataUrl
  })
}

function moveImageUp(index: number) {
  if (index <= 0) return
  const list = uploadedImages.value
  const temp = list[index - 1]
  list[index - 1] = list[index]
  list[index] = temp
}

function moveImageDown(index: number) {
  const list = uploadedImages.value
  if (index >= list.length - 1) return
  const temp = list[index + 1]
  list[index + 1] = list[index]
  list[index] = temp
}

function removeImage(index: number) {
  uploadedImages.value.splice(index, 1)
}

const totalSlots = computed(() => cardsPerPage.value)
const remainingSlots = computed(() => Math.max(0, cardsPerPage.value - uploadedImages.value.length % cardsPerPage.value))
const pageSummary = computed(() => `${pageCount.value} trang · ${cardsPerPage.value} ô/trang · ${uploadedImages.value.length} ảnh`) 

function exportPdf() {
  if (uploadedImages.value.length === 0) {
    alert('Vui lòng upload ít nhất một ảnh card để xuất PDF.')
    return
  }

  const pdf = new jsPDF({ unit: 'mm', format: paper.value.toLowerCase() as any, orientation: orientation.value })
  let pageIndex = 0
  for (let i = 0; i < uploadedImages.value.length; i += cardsPerPage.value) {
    if (pageIndex > 0) pdf.addPage()
    const pageImages = uploadedImages.value.slice(i, i + cardsPerPage.value)
    pageImages.forEach((item, slotIndex) => {
      const col = slotIndex % cols.value
      const row = Math.floor(slotIndex / cols.value)
      const x = pageMarginMm + col * (cardWidthMm + gridGapMm)
      const y = pageMarginMm + row * (cardHeightMm + gridGapMm)
      pdf.addImage(item.dataUrl, 'PNG', x, y, cardWidthMm, cardHeightMm)
    })
    pageIndex += 1
  }

  pdf.save('print-sheet.pdf')
}

function getResolutionText(image: UploadedImage) {
  const dpiW = Math.round(image.width / (cardWidthMm / 25.4))
  const dpiH = Math.round(image.height / (cardHeightMm / 25.4))
  return `${image.width}×${image.height}px • ${dpiW}×${dpiH} DPI`
}

function getImageWarning(image: UploadedImage) {
  const dpiW = image.width / (cardWidthMm / 25.4)
  const dpiH = image.height / (cardHeightMm / 25.4)
  if (dpiW < 300 || dpiH < 300) {
    return 'Ảnh không đủ độ phân giải để in 300 DPI.'
  }
  return ''
}
</script>

<template>
  <div class="print-sheet">
    <div class="panel-row">
      <div class="panel card settings-panel">
        <h3>Print settings</h3>
        <div class="field">
          <label>Giấy</label>
          <select v-model="paper">
            <option value="A4">A4</option>
            <option value="A3">A3</option>
            <option value="A2">A2</option>
          </select>
        </div>
        <div class="field">
          <label>Hướng</label>
          <select v-model="orientation">
            <option value="portrait">Portrait</option>
            <option value="landscape">Landscape</option>
          </select>
        </div>
        <div class="field">
          <label>Card size</label>
          <div>{{ cardWidthMm }} x {{ cardHeightMm }} mm</div>
        </div>
        <div class="field">
          <label>Layout</label>
          <div>{{ cols }} x {{ rows }} = {{ cardsPerPage }} ô / trang</div>
        </div>
        <div class="field">
          <label>Trang</label>
          <div>{{ pageSummary }}</div>
        </div>
        <div class="field">
          <label>Upload card</label>
          <button class="btn" type="button" @click="openFilePicker">Upload ảnh</button>
          <input ref="fileInput" type="file" accept="image/*" multiple @change="handleFiles($event)" style="display: none;">
        </div>
        <div class="field">
          <button class="btn greenBtn" type="button" @click="exportPdf">Export PDF</button>
        </div>
      </div>

      <div class="panel card list-panel">
        <h3>Danh sách ảnh</h3>
        <div v-if="uploadedImages.length === 0" class="empty-state">Chưa có ảnh nào.</div>
        <div v-for="(item, index) in uploadedImages" :key="item.id" class="upload-item card">
          <div class="item-header">
            <div class="item-name">{{ index + 1 }}. {{ item.name }}</div>
            <div class="item-actions">
              <button class="small-btn" type="button" @click="moveImageUp(index)" :disabled="index === 0">↑</button>
              <button class="small-btn" type="button" @click="moveImageDown(index)" :disabled="index === uploadedImages.length - 1">↓</button>
              <button class="small-btn" type="button" @click="removeImage(index)">✕</button>
            </div>
          </div>
          <div class="item-meta">{{ getResolutionText(item) }} <span class="warning" v-if="getImageWarning(item)">- {{ getImageWarning(item) }}</span></div>
        </div>
      </div>
    </div>

    <div class="preview-panel">
      <h3>Preview layout</h3>
      <div class="preview-pages">
        <div v-for="page in pages" :key="page" class="page-card">
          <div class="page-label">Page {{ page + 1 }}</div>
          <div class="page" :style="{ width: previewWidthPx + 'px', height: previewHeightPx + 'px', padding: pageMarginPx + 'px', columnGap: gridGapPx + 'px', rowGap: gridGapPx + 'px', gridTemplateColumns: `repeat(${cols}, ${slotWidthPx}px)`, gridTemplateRows: `repeat(${rows}, ${slotHeightPx}px)` }">
            <div v-for="slotIndex in cardsPerPage" :key="slotIndex" class="slot">
              <img v-if="uploadedImages[page * cardsPerPage + slotIndex - 1]"
                :src="uploadedImages[page * cardsPerPage + slotIndex - 1].dataUrl"
                class="card-preview" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.print-sheet {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 10px;
}
.panel-row {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}
.panel {
  flex: 1;
  min-width: 320px;
}
.settings-panel,
.list-panel {
  padding: 12px;
}
.field {
  margin-bottom: 12px;
}
.field label {
  display: block;
  font-weight: 600;
  margin-bottom: 6px;
}
.btn {
  padding: 6px 12px;
  border: none;
  background-color: #666;
  color: white;
  border-radius: 5px;
  cursor: pointer;
}
.btn:hover {
  background-color: #555;
}
.greenBtn {
  background-color: #28a745;
}
.small-btn {
  padding: 4px 8px;
  margin-left: 4px;
  border: 1px solid #999;
  background: #f9f9f9;
  border-radius: 4px;
  cursor: pointer;
}
.small-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.upload-item {
  padding: 8px;
  margin-bottom: 8px;
}
.item-header {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  align-items: center;
}
.item-name {
  font-size: 13px;
  font-weight: 600;
  overflow-wrap: anywhere;
}
.item-meta {
  font-size: 12px;
  color: #555;
}
.warning {
  color: #a00;
}
.preview-panel {
  padding: 12px;
}
.preview-pages {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}
.page-card {
  border: 1px solid #ccc;
  border-radius: 8px;
  padding: 10px;
  background: white;
}
.page-label {
  margin-bottom: 8px;
  font-weight: 700;
}
.page {
  display: grid;
  gap: 4px;
  background: #ededed;
  padding: 4px;
  border: 1px solid #bbb;
}
.slot {
  background: white;
  border: 1px dashed #bbb;
  width: 100%;
  height: 100%;
  overflow: hidden;
}
.card-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.empty-state {
  padding: 16px;
  color: #777;
}
</style>
