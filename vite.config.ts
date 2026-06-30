import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/Venue-Catchment-Model-UI/',
  plugins: [react()],
  server: {
    port: 5173,
  },
})
