import { sum } from "./util"

// Làm tròn số thập phân trong mảng
function listToFixed(list: number[], fractionDigits: number = 2) {
    return list.map(x => x.toFixed(fractionDigits))
}

export class StopWatch {
    private startTime: number = 0
    private avgLapTime: number[] = []
    private avgTime: number = 0
    private lapTime: number[] = []
    private ratio: number = 0.99  // Tỷ lệ trung bình động

    str: string = ''

    // Bắt đầu vòng tính giờ mới
    restart() {
        this.startTime = Date.now()
        if (this.avgLapTime.length > this.lapTime.length) {
            this.avgLapTime = []
        }
        while (this.avgLapTime.length < this.lapTime.length) {
            this.avgLapTime.push(this.lapTime[this.avgLapTime.length])
        }
        for (let i = 0; i < this.lapTime.length; i++) {
            this.avgLapTime[i] = this.avgLapTime[i] * this.ratio + this.lapTime[i] * (1 - this.ratio)
        }
        this.lapTime = []
        this.lap()
    }

    // Thực hiện một lần tính giờ (lap)
    lap() {
        const time = Date.now() - this.startTime
        this.lapTime.push(time)
    }

    // Chuyển đổi sang chuỗi
    toString(isAvgOnly: boolean = true) {
        if (this.avgTime === 0) {
            this.avgTime = sum(this.avgLapTime)
        } else {
            this.avgTime = this.avgTime * this.ratio + sum(this.avgLapTime) * (1 - this.ratio)
        }

        const avg = `(${this.avgTime.toFixed(2)}ms)${listToFixed(this.avgLapTime)}`
        const lap = `(${sum(this.lapTime).toFixed(2)}ms)${listToFixed(this.lapTime)}`
        if (isAvgOnly) {
            this.str = avg
        } else {
            this.str = `avg:${avg}\nlap:${lap}`
        }
        return this.str
    }

    // In kết quả tính giờ
    print(isAvgOnly: boolean = true) {
        console.log(this.toString(isAvgOnly))
    }

    // Lấy thời gian trung bình
    getAvgTime() {
        return this.avgTime
    }

}