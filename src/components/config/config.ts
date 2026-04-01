import { TextStyle } from '../draw/textstyle'

// Cấu hình sinh lực và giới hạn sinh lực
interface Heart {
    w: number
    h: number
    dx: number
    dy: number
    xoff: number
    nmax: number
}

// Cấu hình văn bản kỹ năng
interface SkText {
    x1: number          // Tọa độ x của đỉnh
    y2: number,         // Tọa độ y của đáy
    maxy1: number,      // Tọa độ y tối đa của đỉnh
    w: number,          // Chiều rộng
    maxHeight: number,  // Chiều cao tối đa, miny1 = (y2 - maxy1) * minHeight

    indent: number,     // Độ thụt lề dòng đầu
    epsilon: number,    // Độ giãn cách lệch, giá trị này càng lớn chữ càng rộng
    spacing: number,    // Khoảng cách đoạn, khoảng cách thực tế là spacing * yoff
    rowSpacing: number, // Khoảng cách dòng, khoảng cách thực tế là rowSpacing * yoff
    maxFont: number,    // Kích thước font tối đa

    textStyle: TextStyle,  // Kiểu chữ kỹ năng
}

// Cấu hình khung nền kỹ năng
interface SkBg {
    alpha: number,      // Độ trong suốt
    corner: number,     // Khoảng cách góc khung ngoài
    margin: number,     // Khoảng cách giữa khung trong và ngoài
    lineWidth: number,  // Độ dày đường kẻ
    wScale: number,     // Tỷ lệ mở rộng chiều rộng
    hScale: number      // Tỷ lệ mở rộng chiều cao
}

// Khung tên kỹ năng
interface SkFrame {
    w: number,
    h: number,
    xoff: number,
    yoff: number
}


// Tên kỹ năng
interface SkName {
    xoff: number,
    yoff: number,
    fontSize: number,
    textStyle: TextStyle,
    shenTextStyle: TextStyle
}

// Danh hiệu và tên võ tướng
interface TitleName {
    x1: number,        // Tọa độ x danh hiệu (bên trái)
    x2: number,        // Tọa độ x tên tướng (bên phải)
    shenx1: number,
    y1: number,
    y3off: number,     // Khoảng cách giữa đáy tên võ tướng và đỉnh khung kỹ năng
    ratio: number,     // Tỷ lệ độ dài danh hiệu võ tướng
    maxTitle: number,  // Kích thước font danh hiệu tối đa
    maxName2: number   // Kích thước font tên võ tướng tối đa (dưới 2 từ)
    maxName3: number   // Kích thước font tên võ tướng tối đa (trên 3 từ)
}

// Thông tin phía dưới
interface Bottom {
    font: string,
    x1: number,
    shenx1: number,
    x2: number,
    shenx2: number,
    y1: number,
    textStyle: TextStyle,
    shenTextStyle: TextStyle
}

// Thông tin phiên bản
interface Version {
    font: string,
    x: number,
    y: number,
    textStyle: TextStyle
}

// Khung hợp kỹ
interface ComboBox {
    font: string,
    fontSize: number,
    y: number,          // Tọa độ y (phía trên khung kỹ năng)
    padding: number,    // Padding bên trong
    cornerRadius: number,
    alpha: number,      // Độ trong suốt nền
    textStyle: TextStyle
}

// Cấu hình
export interface Config {
    game: string
    template: string
    heart: Heart
    skText: SkText
    skBg: SkBg
    skFrame: SkFrame
    skName: SkName
    titleName: TitleName
    bottom: Bottom
    version: Version
    comboBox: ComboBox
}