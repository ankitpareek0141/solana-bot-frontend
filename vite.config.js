import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // server: {
  //   proxy: {
  //     '/api': {
  //       target: 'https://quote-api.jup.ag',
  //       changeOrigin: true,
  //       rewrite: path => path.replace(/^\/api/, ''),
  //     }
  //   }
  // }
})
