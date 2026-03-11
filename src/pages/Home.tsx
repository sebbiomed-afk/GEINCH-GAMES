import { useNavigate } from 'react-router'
import Navbar from '../components/layout/Navbar'
import { Hand, Smile, Eye, Cpu, Zap, Shield } from 'lucide-react'

const games = [
  {
    id: 'hand-pose',
    title: 'Detector de\nPoses de Mano',
    description: 'Controla el juego con gestos. La IA rastrea 21 puntos de tu mano en tiempo real.',
    icon: Hand,
    color: '#00FFC2',
    badge: 'MediaPipe Hands',
    route: '/play/hand-pose',
    difficulty: 'Fácil',
  },
  {
    id: 'mood-detector',
    title: 'Detector de\nEstado de Ánimo',
    description: 'Tu expresión facial es el joystick. Muestra la emoción correcta para ganar.',
    icon: Smile,
    color: '#FF2D78',
    badge: 'Face API',
    route: '/play/mood-detector',
    difficulty: 'Medio',
  },
  {
    id: 'gaze-tracker',
    title: 'Detector\nde Mirada',
    description: 'Controla el cursor solo con tus ojos. Precisión milimétrica con IA.',
    icon: Eye,
    color: '#7B2FFF',
    badge: 'Face Mesh',
    route: '/play/gaze-tracker',
    difficulty: 'Difícil',
  },
]

const stats = [
  { icon: Cpu, label: 'Tecnología', value: 'MediaPipe + TF.js' },
  { icon: Zap, label: 'Latencia', value: '< 30ms' },
  { icon: Shield, label: 'Privacidad', value: '100% Local' },
]

export default function Home() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-dark-900 grid-bg relative overflow-hidden">
      <Navbar />

      {/* Ambient glows */}
      <div className="fixed top-1/4 -left-40 w-96 h-96 rounded-full opacity-10 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #00FFC2, transparent 70%)' }} />
      <div className="fixed bottom-1/4 -right-40 w-96 h-96 rounded-full opacity-10 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #7B2FFF, transparent 70%)' }} />

      {/* HERO */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-8 pt-20 scanlines">
        <div className="scan-beam" />

        {/* Eye icon hero */}
        <div className="relative mb-8">
          <div className="w-24 h-24 flex items-center justify-center relative">
            <Eye size={56} className="text-neon-cyan relative z-10" style={{ filter: 'drop-shadow(0 0 20px #00FFC2)' }} />
            <div className="absolute inset-0 rounded-full border border-neon-cyan opacity-30 animate-ping" />
            <div className="absolute inset-2 rounded-full border border-neon-cyan opacity-20 animate-ping"
              style={{ animationDelay: '0.5s' }} />
          </div>
        </div>

        {/* Title */}
        <h1 className="font-orbitron text-5xl md:text-7xl font-black text-center leading-tight mb-6 animate-fade-in">
          <span className="text-white">GEINCH</span>
          <br />
          <span className="text-neon-cyan text-neon-glow">GAMES</span>
        </h1>

        {/* Tagline */}
        <p className="font-mono text-base md:text-lg text-gray-400 text-center mb-4 tracking-widest cursor-blink">
          La IA te observa
        </p>
        <p className="font-exo text-xl text-gray-300 text-center mb-12">
          Tú juegas con tu cuerpo — sin controles, sin mouse.
        </p>

        {/* CTA buttons */}
        <div className="flex gap-4 mb-20">
          <button onClick={() => document.getElementById('games')?.scrollIntoView({ behavior: 'smooth' })}
            className="btn-neon">
            Explorar juegos
          </button>
          <button className="btn-outline-neon">
            ¿Cómo funciona?
          </button>
        </div>

        {/* Stats row */}
        <div className="flex gap-8 flex-wrap justify-center">
          {stats.map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-3 px-6 py-3 card-cyber">
              <Icon size={18} className="text-neon-cyan" />
              <div>
                <p className="font-mono text-xs text-gray-500 uppercase tracking-wider">{label}</p>
                <p className="font-exo text-sm font-semibold text-white">{value}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* GAMES SECTION */}
      <section id="games" className="px-8 py-24 max-w-7xl mx-auto">
        <div className="mb-16 text-center">
          <p className="font-mono text-neon-cyan text-xs tracking-widest mb-3 uppercase">// Módulos activos</p>
          <h2 className="font-orbitron text-3xl md:text-4xl font-bold text-white">
            Elige tu <span className="text-neon-cyan">juego</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {games.map((game, i) => {
            const Icon = game.icon
            return (
              <div key={game.id}
                className="card-cyber p-8 flex flex-col gap-6 group cursor-pointer animate-slide-up"
                style={{ animationDelay: `${i * 0.15}s`, animationFillMode: 'both' }}
                onClick={() => navigate(game.route)}>

                {/* Icon */}
                <div className="w-16 h-16 flex items-center justify-center relative"
                  style={{ background: `${game.color}15`, border: `1px solid ${game.color}40` }}>
                  <Icon size={32} style={{ color: game.color, filter: `drop-shadow(0 0 8px ${game.color})` }} />
                  <div className="hud-corner hud-corner-tl" style={{ borderColor: game.color }} />
                  <div className="hud-corner hud-corner-br" style={{ borderColor: game.color }} />
                </div>

                {/* Title */}
                <h3 className="font-orbitron text-lg font-bold text-white leading-tight whitespace-pre-line">
                  {game.title}
                </h3>

                {/* Description */}
                <p className="font-exo text-sm text-gray-400 leading-relaxed flex-1">
                  {game.description}
                </p>

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-white border-opacity-5">
                  <span className="status-badge text-xs" style={{ color: game.color, borderColor: `${game.color}40` }}>
                    {game.badge}
                  </span>
                  <span className="font-mono text-xs text-gray-500">
                    {game.difficulty}
                  </span>
                </div>

                {/* Play button */}
                <button className="btn-neon w-full text-center" style={{ background: game.color }}>
                  Jugar ahora
                </button>
              </div>
            )
          })}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white border-opacity-5 px-8 py-8 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Eye size={16} className="text-neon-cyan" />
          <span className="font-orbitron text-sm font-bold text-white">GEINCH GAMES</span>
        </div>
        <p className="font-mono text-xs text-gray-600">
          © 2025 — Visión artificial en el navegador
        </p>
      </footer>
    </div>
  )
}
