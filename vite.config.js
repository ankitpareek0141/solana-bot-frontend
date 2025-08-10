import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  preview: {
    host: '0.0.0.0',
    port: 4173, // or 80 if you want direct access
    strictPort: true,
    allowedHosts: [
      'streamalert.site',
      'www.streamalert.site',
      'srv951924.hstgr.cloud'
    ]
  },
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
