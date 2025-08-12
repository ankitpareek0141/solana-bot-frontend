import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  preview: {
    host: '0.0.0.0',
    port: 4173, // or 80 if you want direct access
    strictPort: true,
    allowedHosts: [
      'streamalert.site',
      'www.streamalert.site',
      'srv951924.hstgr.cloud',
      'localhost:3001'
    ]
  },
})
