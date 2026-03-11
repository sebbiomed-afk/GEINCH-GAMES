import { Link, useLocation } from 'react-router'
import { Eye } from 'lucide-react'

export default function Navbar() {
  const location = useLocation()
  const isGame = location.pathname.startsWith('/play/')

  if (isGame) return null

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-4"
      style={{ background: 'linear-gradient(to bottom, rgba(5,10,14,0.98), rgba(5,10,14,0))', backdropFilter: 'blur(8px)' }}>
      {/* Logo */}
      <Link to="/" className="flex items-center gap-3 group">
        <div className="relative">
          <Eye size={28} className="text-neon-cyan" style={{ filter: 'drop-shadow(0 0 8px #00FFC2)' }} />
          <div className="absolute inset-0 animate-ping opacity-20">
            <Eye size={28} className="text-neon-cyan" />
          </div>
        </div>
        <span className="font-orbitron text-xl font-black tracking-widest text-white glitch-text">
          GEINCH<span className="text-neon-cyan"> GAMES</span>
        </span>
      </Link>

      {/* Nav links */}
      <div className="hidden md:flex items-center gap-8">
        {['Inicio', 'Juegos', 'Rankings'].map((item) => (
          <a key={item} href="#"
            className="font-mono text-xs tracking-widest uppercase text-gray-400 hover:text-neon-cyan transition-colors duration-300">
            {item}
          </a>
        ))}
      </div>

      {/* CTA */}
      <button className="btn-outline-neon text-xs">
        Iniciar Sesión
      </button>
    </nav>
  )
}
