# 🎮 Geinch Games

Plataforma web de juegos con visión artificial. La IA corre 100% en el navegador.

## Juegos disponibles

| Juego | Tecnología | Descripción |
|---|---|---|
| 🖐️ Detector de Poses de Mano | MediaPipe Hands | Controla el juego con gestos |
| 😄 Detector de Estado de Ánimo | Face API | Muestra emociones con tu rostro |
| 👁️ Detector de Mirada | MediaPipe Face Mesh | Control por movimiento ocular |

## Setup local

```bash
# 1. Instalar dependencias
npm install

# 2. Correr en desarrollo
npm run dev

# 3. Abrir http://localhost:5173
```

## Build para producción

```bash
npm run build
```

## Deploy en Vercel

1. Sube el proyecto a GitHub
2. Conecta el repo en vercel.com
3. Framework preset: **Vite**
4. Build command: `npm run build`
5. Output dir: `dist`
6. ¡Deploy!

## Arquitectura

```
geinch-games/
├── src/
│   ├── pages/
│   │   ├── Home.tsx          # Landing con las 3 game cards
│   │   └── GameDetail.tsx    # Detalle de cada juego
│   ├── games/
│   │   ├── HandPose/         # MediaPipe Hands
│   │   ├── MoodDetector/     # Face API
│   │   └── GazeTracker/      # MediaPipe Face Mesh
│   ├── components/
│   │   └── layout/Navbar.tsx
│   ├── index.css             # Estilos cyberpunk
│   └── App.tsx               # Router
├── vercel.json               # SPA rewrites
└── vite.config.ts
```

## Privacidad

⚠️ Toda la IA corre localmente en el navegador. **Ningún frame de video se envía a servidores.**
# GEINCH-GAMES
