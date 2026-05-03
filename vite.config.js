import { defineConfig } from 'vite'
    import react from '@vitejs/plugin-react'
    import { VitePWA } from 'vite-plugin-pwa'

    export default defineConfig({
      plugins: [
        react(),
        VitePWA({ 
          registerType: 'autoUpdate',
          manifest: {
            name: 'Brandon Budget',
            short_name: 'Budget',
            theme_color: '#ffffff',
            display: 'standalone', // This hides the browser UI
            icons: [
              {
                src: 'pwa-192x192.png',
                sizes: '192x192',
                type: 'image/png'
              }
            ]
          }
        })
      ]
    })
    ```
3.  **Deploy the changes**: Push this to GitHub. Once Vercel redeploys, when you "Add to Home screen" again, it will open as a full-screen app.

Do you have an icon file ready to use for the app, or should we set up a basic one for now?
