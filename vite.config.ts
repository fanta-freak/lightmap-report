import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [react(), tailwindcss()],
  // Der Bericht laeuft seit dem Umzug vom GitHub-Pages-Stand unter
  // https://sport-alpha.philiplentz.de/report/ (nginx: alias /var/www/lightmap).
  // Hier stand bis zum 11.08.2026 noch '/lightmap-report/', der Pfad der alten
  // Pages-Adresse. Ein `npm run build` erzeugte damit eine index.html, die ihr
  // Bundle unter /lightmap-report/assets/ sucht — nginx liefert dort die
  // index.html zurueck, und die Seite bleibt weiss. Genau so passiert beim
  // Deploy am 11.08.
  // Ueberschreibbar fuer andere Ziele: `npm run build -- --base=/anderer/pfad/`.
  base: command === 'build' ? '/report/' : '/',
  server: {
    port: 5173,
    host: true,
  },
}))
