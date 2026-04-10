import { CanvasTool } from "../entity/CanvasTool"

// Kỹ năng
export class Skill {
    name: string
    text: string
    isBold = false
    isItalic = false
    constructor(name: string, text: string) {
        this.name = name
        this.text = text
    }
}

// Ảnh minh họa
class Illastration {
    img: HTMLImageElement
    width: number = 0
    height: number = 0
    isLoad: boolean = false

    constructor() {
        this.img = new Image();
    }

    // Nhập ảnh minh họa
    import(url: string, cvt: CanvasTool, card: Card) {
        this.img.src = url
        this.img.onload = () => {
            this.isLoad = true

            let w = cvt.logicSize.x
            let h = w * (this.img.height / this.img.width)
            if (h < cvt.logicSize.y) {
                h = cvt.logicSize.y
                w = h * (this.img.width / this.img.height)
            }

            this.width = w
            this.height = h
            card.w = w
            card.h = h
            card.scale = 100
        }
    }
}

// Thế lực
export const Power: { [key: string]: string } = {
    'Ngụy': 'wei',
    'Thục': 'shu',
    'Ngô': 'wu',
    'Quần': 'qun',
    'Thần': 'shen',
    'Tấn': 'jin',
    'Dã': 'ye'
}

// Khung 2 thế lực: key = tên hiển thị, value = { file: tên file ảnh, primaryPower: thế lực ưu tiên lấy màu }
export const DualFrame: { [key: string]: { file: string, primaryPower: string } } = {
    'Ngô - Ngụy': { file: 'Ngô - Ngụy', primaryPower: 'wu' },
    'Ngô - Quần': { file: 'Ngô - Quần', primaryPower: 'wu' },
    'Ngô - Thục': { file: 'Ngô - Thục', primaryPower: 'wu' },
    'Ngụy - Ngô': { file: 'Ngụy - Ngô', primaryPower: 'wei' },
    'Ngụy - Quần': { file: 'Ngụy - Quần', primaryPower: 'wei' },
    'Ngụy - Thục': { file: 'Ngụy - Thục', primaryPower: 'wei' },
    'Quần - Ngô': { file: 'Quần - Ngô', primaryPower: 'qun' },
    'Quần - Ngụy': { file: 'Quần - Ngụy', primaryPower: 'qun' },
    'Quần - Thục': { file: 'Quần - Thục', primaryPower: 'qun' },
    'Thục - Ngô': { file: 'Thục - Ngô', primaryPower: 'shu' },
    'Thục - Ngụy': { file: 'Thục - Ngụy', primaryPower: 'shu' },
    'Thục - Quần': { file: 'Thục - Quần', primaryPower: 'shu' },
}

// Danh sách font có sẵn
export const FONTS: { [key: string]: string } = {
    'FuzzyBubbles': 'NV_TenTuong',
    'MsMadi': 'NV_DanhHieu',
    'SedgwickAve': 'NV_TenKyNang',
    'Oswald': 'NV_MoTaKyNang',
    'Hurricane': 'NV_PhePhai'
}

// Thẻ bài
export class Card {
    illastration: Illastration = new Illastration() // Ảnh minh họa
    x: number = 0
    y: number = 0
    w: number = 0
    h: number = 0
    scale: number = 100

    isProducer: boolean = false    // Có vẽ nhà sản xuất không
    isIllustrator: boolean = false // Có vẽ họa sĩ không
    isCardNum: boolean = false     // Có vẽ số hiệu không
    producer: string = 'Bản quyền chưa rõ' // Nhà sản xuất
    illastrator: string = 'Họa sĩ chưa rõ' // Họa sĩ
    cardNum: string = 'DIY 001'         // Số hiệu

    isTranslate: boolean = true    // Tự động chuyển Giản-Phồn
    title: string = 'Danh hiệu chưa rõ' // Danh hiệu
    name: string = 'Lưu Bị'          // Tên võ tướng

    // Vị trí linh hoạt của danh hiệu và tên võ tướng
    titleX: number = 59
    titleY: number = 110
    nameX: number = 340
    nameY: number = 226

    // Font và cỡ chữ tùy chỉnh
    titleFont: string = 'NV_DanhHieu'
    titleFontSize: number = 24
    isTitleBold: boolean = false
    nameFont: string = 'NV_TenTuong'
    nameFontSize: number = 45
    nameColor: string = 'white'
    skillNameFont: string = 'NV_TenKyNang'
    skillNameFontSize: number = 20
    skillTextFont: string = 'NV_MoTaKyNang'
    skillTextFontSize: number = 10
    comboFont: string = 'NV_TenKyNang'
    comboFontSize: number = 14
    comboColor: string = '#ffe7b4'

    power: string = Power['Thục']      // Thế lực
    isLord: boolean = false        // Có phải chúa công không
    dualFrame: string = ''         // Khung 2 thế lực (rỗng = không dùng)
    heart: number = 4              // Sinh lực
    isHreatLimit: boolean = false  // Có vẽ giới hạn sinh lực không
    heartLimit: number = 4         // Giới hạn sinh lực

    numSkill: number = 0; // Số lượng kỹ năng
    skills: Skill[] = []  // Kỹ năng
    comboText: string = '' // Nội dung hợp kỹ

    constructor() {
        this.numSkill = 2
        this.skills.push(new Skill('Nhân Đức', 'Trong giai đoạn ra bài, mỗi lượt của mỗi nhân vật, bạn có thể đưa bất kỳ số lượng quân bài trên tay mình cho một nhân vật khác. Khi bạn đưa ra quân bài thứ hai theo cách này trong giai đoạn này, bạn có thể xem như đã sử dụng một quân bài cơ bản.'))
        this.skills.push(new Skill('Kích Tướng', 'Kỹ năng Chúa công. Khi bạn cần sử dụng hoặc đánh ra một lá [Sát], bạn có thể yêu cầu các nhân vật khác thuộc thế lực Thục đánh ra một lá [Sát] (xem như do bạn sử dụng hoặc đánh ra).'))
    }

    // Thêm kỹ năng trống
    addSkill() {
        this.skills.push(new Skill('', ''))
    }

    // Xóa kỹ năng, mặc định là kỹ năng cuối cùng
    rmSkill(i: number = -1) {
        if (i > 0) {
            this.skills.splice(i, 1)
        } else {
            this.skills.splice(this.skills.length - 1, 1)
        }

    }

    // Nhập ảnh minh họa
    importIllastration(url: string, cvt: CanvasTool) {
        this.illastration.import(url, cvt, this)
    }
}