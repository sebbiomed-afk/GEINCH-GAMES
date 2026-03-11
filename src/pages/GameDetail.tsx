import { useParams, useNavigate } from 'react-router'
import Navbar from '../components/layout/Navbar'
import { Hand, Smile, Eye, ArrowLeft, Cpu, Zap, Trophy } from 'lucide-react'

const gameData: Record<string, {
  title: string
  description: string
  longDesc: string
  icon: React.ElementType
  color: string
  badge: string
  route: string
  tech: string[]
  howToPlay: string[]
}> = {
  'hand-pose': {
    title: 'Detector de Poses de Mano',
    description: 'Controla el juego con gestos de tu mano en tiempo real.',
    longDesc: 'Usando MediaPipe Hands, la IA detecta 21 puntos clave de tu mano y los rastrea a 30fps. Realiza poses específicas para interactuar con el juego sin tocar nada.',
    icon: Hand,
    color: '#00FFC2',
    badge: 'MediaPipe Hands',
    route: '/play/hand-pose',
    tech: ['MediaPipe Hands', 'WebGL', 'Canvas API'],
    howToPlay: [
      'Permite el acceso a tu cámara',
      'Coloca tu mano frente a la cámara',
      'Realiza las poses indicadas en pantalla',
      'Gana puntos por cada pose correcta',
    ],
  },
  'mood-detector': {
    title: 'Detector de Estado de Ánimo',
    description: 'Expresa la emoción correcta para ganar puntos.',
    longDesc: 'Face API analiza tu expresión facial en tiempo real detectando 7 emociones: feliz, triste, sorprendido, enojado, temeroso, disgustado y neutral.',
    icon: Smile,
    color: '#FF2D78',
    badge: 'Face API',
    route: '/play/mood-detector',
    tech: ['Face API', 'TensorFlow.js', 'WebRTC'],
    howToPlay: [
      'Permite el acceso a tu cámara',
      'Mira de frente a la cámara',
      'Muestra la emoción que aparece en pantalla',
      'Mantén la expresión para sumar puntos',
    ],
  },
  'gaze-tracker': {
    title: 'Detector de Mirada',
    description: 'Controla el juego solo con tus ojos.',
    longDesc: 'MediaPipe Face Mesh rastrea los 468 puntos del rostro, incluyendo el iris, para estimar con precisión hacia dónde estás mirando.',
    icon: Eye,
    color: '#7B2FFF',
    badge: 'Face Mesh',
    route: '/play/gaze-tracker',
    tech: ['MediaPipe Face Mesh', 'Iris Tracking', 'WebGL'],
    howToPlay: [
      'Permite el acceso a tu cámara',
      'Mantén la cabeza relativamente quieta',
      'Mira el objetivo que aparece en pantalla',
      'Mantén la mirada fija para seleccionar',
    ],
  },
}

export default function GameDetail() {
  const { gameId } = useParams<{ gameId: string }>()
  const navigate = useNavigate()
  const game = gameId ? gameData[gameId] : null

  if (!game) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="text-center">
          <p className="font-orbitron text-neon-cyan text-2xl mb-4">404</p>
          <p className="font-mono text-gray-400 mb-8">Juego no encontrado</p>
          <button onClick={() => navigate('/')} className="btn-neon">Volver al inicio</button>
        </div>
      </div>
    )
  }

  const Icon = game.icon

  return (
    <div className="min-h-screen bg-dark-900 grid-bg">
      <Navbar />

      <div className="max-w-5xl mx-auto px-8 pt-32 pb-20">
        {/* Back button */}
        <button onClick={() => navigate('/')}
          className="flex items-center gap-2 font-mono text-xs text-gray-500 hover:text-neon-cyan transition-colors mb-12 uppercase tracking-wider">
          <ArrowLeft size={14} />
          Volver
        </button>

        <div className="grid md:grid-cols-2 gap-16 items-start">
          {/* Left: Info */}
          <div>
            {/* Icon */}
            <div className="w-20 h-20 flex items-center justify-center mb-8 relative"
              style={{ background: `${game.color}15`, border: `1px solid ${game.color}40` }}>
              <Icon size={40} style={{ color: game.color, filter: `drop-shadow(0 0 12px ${game.color})` }} />
              <div className="hud-corner hud-corner-tl" style={{ borderColor: game.color }} />
              <div className="hud-corner hud-corner-br" style={{ borderColor: game.color }} />
            </div>

            <span className="status-badge mb-4" style={{ color: game.color, borderColor: `${game.color}40` }}>
              {game.badge}
            </span>

            <h1 className="font-orbitron text-3xl font-bold text-white mt-4 mb-6 leading-tight">
              {game.title}
            </h1>

            <p className="font-exo text-gray-400 leading-relaxed mb-8">
              {game.longDesc}
            </p>

            {/* Tech stack */}
            <div className="mb-8">
              <p className="font-mono text-xs text-gray-600 uppercase tracking-wider mb-3">// Stack tecnológico</p>
              <div className="flex flex-wrap gap-2">
                {game.tech.map((t) => (
                  <span key={t} className="font-mono text-xs px-3 py-1 border border-white border-opacity-10 text-gray-400">
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* Fake stats */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { icon: Trophy, label: 'Récord', value: '—' },
                { icon: Zap, label: 'Jugadas', value: '0' },
                { icon: Cpu, label: 'FPS', value: '30' },
              ].map(({ icon: I, label, value }) => (
                <div key={label} className="card-cyber p-4 text-center">
                  <I size={16} className="mx-auto mb-2" style={{ color: game.color }} />
                  <p className="font-orbitron text-lg font-bold text-white">{value}</p>
                  <p className="font-mono text-xs text-gray-600">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Preview + how to play */}
          <div className="flex flex-col gap-8">
            {/* Camera preview mockup */}
            <div className="relative aspect-video card-cyber overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <Icon size={48} className="mx-auto mb-4 opacity-20" style={{ color: game.color }} />
                  <p className="font-mono text-xs text-gray-600">Cámara inactiva</p>
                  <p className="font-mono text-xs text-gray-700">Inicia el juego para activarla</p>
                </div>
              </div>
              {/* HUD overlay */}
              <div className="hud-corner hud-corner-tl" style={{ borderColor: game.color, width: 30, height: 30 }} />
              <div className="hud-corner hud-corner-tr" style={{ borderColor: game.color, width: 30, height: 30 }} />
              <div className="hud-corner hud-corner-bl" style={{ borderColor: game.color, width: 30, height: 30 }} />
              <div className="hud-corner hud-corner-br" style={{ borderColor: game.color, width: 30, height: 30 }} />
              {/* Scan line */}
              <div className="scan-beam opacity-30" style={{ background: `linear-gradient(90deg, transparent, ${game.color}, transparent)` }} />
            </div>

            {/* How to play */}
            <div className="card-cyber p-6">
              <p className="font-mono text-xs text-gray-600 uppercase tracking-wider mb-4">// Cómo jugar</p>
              <ol className="space-y-3">
                {game.howToPlay.map((step, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="font-orbitron text-xs font-bold mt-0.5 shrink-0" style={{ color: game.color }}>
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="font-exo text-sm text-gray-400">{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Play button */}
            <button onClick={() => navigate(game.route)} className="btn-neon w-full text-center text-base py-4"
              style={{ background: game.color }}>
              ▶ Iniciar juego
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
