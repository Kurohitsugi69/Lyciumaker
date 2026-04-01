<script setup lang="ts">

import { onMounted, Ref, ref} from 'vue'
import { Fragments } from './fragment'
import EditCard from './EditCard.vue'

// Đầu vào của component
const props = defineProps<{
  fragments: Fragments
}>()

let refAddOn: Ref<boolean> = ref(false)    // Chuột có đang lơ lửng trên nút Add không
let refAddDown: Ref<boolean> = ref(false)  // Chuột có đang nhấn vào nút Add không
const fragments: Fragments = props.fragments  // Tất cả các khối ký tự

// Chọn một thẻ và hủy chọn các thẻ khác
function Select(msg: string) {
  const editor = Number(msg.split('-')[0])
  const option = Number(msg.split('-')[1])

  fragments.select(editor, option)
}

// Khởi tạo các tham số khi mount
onMounted(() => {
  // Thêm thẻ đầu tiên
  fragments.add()
})

</script>

<template>

  <div v-for="(fg, i) in fragments.flist" :id="`e${i}`">
    <EditCard :ref-text="fg.text" :ref-size="fg.size" :ref-mask="fg.mask"
      :ref-select="fg.selected" v-on:mvts-click="Select(`${i}-0`)" v-on:mask-click="Select(`${i}-1`)"
      v-on:del-click="fragments.remove(i)" v-on:cp-click="fragments.copy(i)"></EditCard>
  </div>

  <div id="addEditCard" v-bind:class="{ preSelect: refAddOn, select: refAddDown }" @mouseenter="refAddOn = true"
    @mouseleave="refAddOn = false; refAddDown = false" @mousedown="refAddDown = true; fragments.add()"
    @mouseup="refAddDown = false">
    <div id="addChar">＋</div>
  </div>

</template>

<style scoped>
#addEditCard {
  margin: 5px;
  border: 0;
  padding: 0;

  border-radius: 5px;
  box-shadow: 0px 0px 7px 0px rgb(167, 161, 161);
}

#addChar {
  position: relative;
  top: 50%;
  left: 50%;
  transform: translateX(-50%) translateY(-50%);
  user-select: none;

  font-size: 100px;
  color: rgb(255, 255, 255);
  text-shadow: rgb(167, 161, 161) 0 0 7px;
}

.preSelect {
  background-image: linear-gradient(to bottom right, #d5fbff78, #6cceff78);
  border-radius: 5px;
}

.select {
  background-image: linear-gradient(to bottom right, #d5fbff, #6cceff);
  border-radius: 5px;
}


</style>
