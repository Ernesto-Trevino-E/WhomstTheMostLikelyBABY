import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rolldownOptions: {
      output: {
        // Firebase in its own chunk: it changes less often than the app, so it stays cached.
        codeSplitting: {
          groups: [{ name: 'firebase', test: /node_modules[\\/](@firebase|firebase)[\\/]/ }],
        },
      },
    },
  },
})
