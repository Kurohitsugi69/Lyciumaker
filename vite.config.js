import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    host: true, // Lắng nghe trên tất cả interfaces (cần thiết cho ngrok)
    port: 5173,
  }
})
