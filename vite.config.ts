import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

function getRandomPort() {
  const min = 10000
  const max = 65535
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export default defineConfig({
  plugins: [react()],
  server: {
    port: getRandomPort()
  }
})
