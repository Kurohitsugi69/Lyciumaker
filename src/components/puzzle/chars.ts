import { Ref, ref } from 'vue'
import { Fragments } from './fragment'
import { translate } from '../fonts/trainslate'

// Bảng ký tự đã được JSON hóa
class Chars {
    jsons: string[] = []
    schs: string[] = []
    zchs: string[] = []

    // Kiểm tra xem có ký tự trùng lặp không, nếu có thì thay thế
    replace(chs: string[], ch: string, fgs: Fragments) {
        const i = chs.indexOf(ch[0])
        if (i >= 0) {
            this.schs[i] = fgs.sch[0]
            this.zchs[i] = fgs.zch[0]
            this.jsons[i] = fgs.tojson()
            return true
        } else {
            return false
        }
    }

    // Thêm ký tự vào bảng ký tự, nếu đã tồn tại thì thay thế
    add(fgs: Fragments) {
        const res = this.replace(this.schs, fgs.sch, fgs) || this.replace(this.schs, fgs.zch, fgs) || this.replace(this.zchs, fgs.sch, fgs) || this.replace(this.zchs, fgs.zch, fgs)
        if (!res) {
            this.schs.push(fgs.sch[0])
            this.zchs.push(fgs.zch[0])
            this.jsons.push(fgs.tojson())
        }
    }

    // Kiểm tra xem bảng ký tự có chứa ký tự chỉ định không, nếu có trả về JSON, ngược lại trả về null
    hasjson(char: string) {
        function findJson(jsons: string[], chs: string[], char: string) {
            const i = chs.indexOf(char)
            return i >= 0 ? jsons[i] : null
        }
        const res = [
            findJson(this.jsons, this.schs, char),
            findJson(this.jsons, this.zchs, char),
            findJson(this.jsons, this.schs, translate(char)),
            findJson(this.jsons, this.zchs, translate(char))
        ]
        for (let json of res) {
            if (json) {
                return json
            }
        }
        return null
    }
}
export const refChars: Ref<Chars> = ref(new Chars())

// Lấy thông tin từ JSON
export function jsonInfo(json: string) {
    const head = JSON.parse(json).head
    return `${head.zch[0]}`
}