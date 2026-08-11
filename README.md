# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

---

## Deploy (Stand 11.08.2026)

Der Bericht liegt als statisches Bundle auf dem ils-sport-Server und wird von
nginx unter `https://sport-alpha.philiplentz.de/report/` ausgeliefert. Die
Report-API laeuft daneben im eigenen Stack (`/report/api/` → 127.0.0.1:8003).

```bash
npm run build
rsync -a --delete dist/ root@178.104.86.80:/var/www/lightmap/
```

Mehr braucht es nicht — `base` und `VITE_API_URL` stehen seit dem 11.08. richtig
in `vite.config.ts` und `.env.production`. Davor waren beide noch auf den alten
GitHub-Pages-Stand gesetzt (`/lightmap-report/`, `https://api.philiplentz.de`)
und der ausgerollte Stand musste von Hand mit Zusatzflags gebaut werden. Wer das
vergass, bekam eine weisse Seite (falscher Bundle-Pfad) oder "Fehler beim Laden"
(falsche API-Adresse).

**Zielverzeichnis ist `/var/www/lightmap/`**, nicht `/root/lightmap/web/` — das
ist eine alte Kopie und wird von nginx nicht gelesen.

Vor dem Ausrollen eine Sicherung anlegen; ein Rollback ist ein `rsync` zurueck:

```bash
ssh root@178.104.86.80 "cp -a /var/www/lightmap /root/rollback/varwww_lightmap_$(date +%Y%m%d_%H%M%S)"
```

Die Instanz ist **eine fuer alles**: Berichte aus Produktiv und aus der Sandbox
werden von demselben Bundle gerendert.
