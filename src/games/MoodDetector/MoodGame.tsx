import { useRef, useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router'
import { ArrowLeft, Trophy, Timer, Smile } from 'lucide-react'

const MOODS = [
  { name: 'Feliz', emoji: '😄', key: 'happy', color: '#00FFC2' },
  { name: 'Sorprendido', emoji: '😲', key: 'surprised', color: '#FF2D78' },
  { name: 'Enojado', emoji: '😠', key: 'angry', color: '#FF4444' },
  { name: 'Triste', emoji: '😢', key: 'sad', color: '#7B2FFF' },
  { name: 'Neutral', emoji: '😐', key: 'neutral', color: '#5A7A8A' },
]

export default function MoodGame() {
  const navigate = useNavigate()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'playing' | 'error'>('loading')
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(60)
  const [currentMood, setCurrentMood] = useState(MOODS[0])
  const [detectedMood, setDetectedMood] = useState<{ expression: string; confidence: number } | null>(null)
  const [feedback, setFeedback] = useState<'correct' | null>(null)
  const scoreTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const detectIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const nextMood = useCallback(() => {
    const available = MOODS.filter(m => m.key !== currentMood.key)
    setCurrentMood(available[Math.floor(Math.random() * available.length)])
  }, [currentMood])

  // Load face-api.js
  useEffect(() => {
    const load = async () => {
      try {
        const script = document.createElement('script')
        script.src = 'https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.min.js'
        script.crossOrigin = 'anonymous'
        document.head.appendChild(script)
        await new Promise((res, rej) => { script.onload = res; script.onerror = rej })
        setStatus('ready')
      } catch {
        setStatus('error')
      }
    }
    load()
  }, [])

  const loadModels = async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const faceapi = (window as any).faceapi
    const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.13/model'
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
    ])
  }

  const startGame = useCallback(async () => {
    if (!videoRef.current) return
    setStatus('loading')

    try {
      await loadModels()
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } })
      videoRef.current.srcObject = stream
      await videoRef.current.play()
      setStatus('playing')
      setScore(0)
      setTimeLeft(60)
      nextMood()

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const faceapi = (window as any).faceapi

      detectIntervalRef.current = setInterval(async () => {
        if (!videoRef.current) return
        const result = await faceapi
          .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
          .withFaceExpressions()

        if (result) {
          const exprs = result.expressions
          const top = Object.entries(exprs).sort(([,a],[,b]) => (b as number) - (a as number))[0]
          setDetectedMood({ expression: top[0] as string, confidence: Math.round((top[1] as number) * 100) })

          // Draw on canvas
          const canvas = canvasRef.current
          const video = videoRef.current
          if (canvas && video) {
            const ctx = canvas.getContext('2d')!
            canvas.width = video.videoWidth
            canvas.height = video.videoHeight
            ctx.save()
            ctx.scale(-1, 1)
            ctx.translate(-canvas.width, 0)
            ctx.drawImage(video, 0, 0)
            ctx.restore()

            const box = result.detection.box
            const mirroredX = canvas.width - box.x - box.width
            ctx.strokeStyle = '#00FFC2'
            ctx.lineWidth = 2
            ctx.strokeRect(mirroredX, box.y, box.width, box.height)
          }
        } else {
          setDetectedMood(null)
        }
      }, 300)
    } catch {
      setStatus('error')
    }
  }, [nextMood])

  // Check match
  useEffect(() => {
    if (status !== 'playing' || !detectedMood) return
    const moodMap: Record<string, string> = {
      happy: 'happy',
      surprised: 'surprised',
      angry: 'angry',
      sad: 'sad',
      neutral: 'neutral',
    }
    const mapped = moodMap[detectedMood.expression]
    if (mapped === currentMood.key && detectedMood.confidence > 60) {
      if (scoreTimeoutRef.current) return
      setFeedback('correct')
      setScore(s => s + 10)
      scoreTimeoutRef.current = setTimeout(() => {
        nextMood()
        setFeedback(null)
        scoreTimeoutRef.current = null
      }, 1200)
    }
  }, [detectedMood, currentMood, status, nextMood])

  // Timer
  useEffect(() => {
    if (status !== 'playing') return
    const interval = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(interval)
          if (detectIntervalRef.current) clearInterval(detectIntervalRef.current)
          setStatus('ready')
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [status])

  useEffect(() => {
    return () => {
      if (detectIntervalRef.current) clearInterval(detectIntervalRef.current)
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
        tracks.forEach(t => t.stop())
      }
    }
  }, [])

  return (
    <div className="min-h-screen bg-dark-900 grid-bg flex flex-col">
      <div className="flex items-center justify-between px-6 py-4 border-b border-white border-opacity-5">
        <button onClick={() => navigate('/game/mood-detector')}
          className="flex items-center gap-2 font-mono text-xs text-gray-500 hover:text-neon-pink transition-colors uppercase tracking-wider">
          <ArrowLeft size={14} />
          Salir
        </button>
        <div className="flex items-center gap-2">
          <Smile size={16} style={{ color: '#FF2D78' }} />
          <span className="font-orbitron text-sm font-bold text-white">MOOD DETECTOR</span>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Trophy size={14} style={{ color: '#FF2D78' }} />
            <span className="font-orbitron text-sm text-white">{score}</span>
          </div>
          <div className="flex items-center gap-2">
            <Timer size={14} className={timeLeft < 10 ? 'text-red-400' : 'text-gray-400'} />
            <span className={`font-orbitron text-sm ${timeLeft < 10 ? 'text-red-400' : 'text-white'}`}>{timeLeft}s</span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-6 p-6">
        <div className="flex-1 relative card-cyber overflow-hidden" style={{ minHeight: 400 }}>
          <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover opacity-0" autoPlay playsInline muted />
          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-cover"
            style={{ transform: 'scaleX(-1)' }} />

          {['tl','tr','bl','br'].map(p => (
            <div key={p} className={`hud-corner hud-corner-${p}`}
              style={{ width: 30, height: 30, borderColor: '#FF2D78' }} />
          ))}

          {(status === 'loading') && (
            <div className="absolute inset-0 flex items-center justify-center bg-dark-900 bg-opacity-90">
              <div className="text-center">
                <div className="w-12 h-12 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-4"
                  style={{ borderColor: '#FF2D78', borderTopColor: 'transparent' }} />
                <p className="font-mono text-sm" style={{ color: '#FF2D78' }}>Cargando modelos de IA...</p>
              </div>
            </div>
          )}

          {status === 'ready' && (
            <div className="absolute inset-0 flex items-center justify-center bg-dark-900 bg-opacity-90">
              <div className="text-center">
                <Smile size={56} className="mx-auto mb-6" style={{ color: '#FF2D78', filter: 'drop-shadow(0 0 20px #FF2D78)' }} />
                <p className="font-orbitron text-2xl font-bold text-white mb-2">
                  {timeLeft === 0 ? `Puntuación: ${score}` : 'Listo'}
                </p>
                <p className="font-mono text-sm text-gray-400 mb-8">Muestra tu expresión facial a la cámara</p>
                <button onClick={startGame} className="btn-neon" style={{ background: '#FF2D78' }}>
                  {timeLeft === 0 ? 'Jugar de nuevo' : 'Iniciar juego'}
                </button>
              </div>
            </div>
          )}

          {feedback === 'correct' && (
            <div className="absolute inset-0 border-4 pointer-events-none animate-pulse"
              style={{ borderColor: '#FF2D78' }} />
          )}

          {status === 'playing' && (
            <div className="scan-beam" style={{ background: 'linear-gradient(90deg, transparent, #FF2D78, transparent)' }} />
          )}
        </div>

        <div className="w-full lg:w-72 flex flex-col gap-4">
          <div className="card-cyber p-6 text-center">
            <p className="font-mono text-xs text-gray-600 uppercase tracking-wider mb-3">// Muestra esta emoción</p>
            <div className="text-6xl mb-3">{currentMood.emoji}</div>
            <p className="font-orbitron text-lg font-bold text-white">{currentMood.name}</p>
          </div>

          <div className="card-cyber p-4">
            <p className="font-mono text-xs text-gray-600 uppercase tracking-wider mb-2">// Detectado</p>
            {detectedMood ? (
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full" style={{ background: '#FF2D78' }} />
                  <span className="font-mono text-sm text-white capitalize">{detectedMood.expression}</span>
                </div>
                <div className="w-full bg-dark-700 rounded-full h-1.5 mt-2">
                  <div className="h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${detectedMood.confidence}%`, background: '#FF2D78' }} />
                </div>
                <p className="font-mono text-xs text-gray-600 mt-1">{detectedMood.confidence}% confianza</p>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-gray-600" />
                <span className="font-mono text-sm text-gray-500">Sin detección</span>
              </div>
            )}
          </div>

          <div className="card-cyber p-4 flex-1">
            <p className="font-mono text-xs text-gray-600 uppercase tracking-wider mb-3">// Emociones</p>
            <div className="space-y-2">
              {MOODS.map(m => (
                <div key={m.key} className={`flex items-center gap-3 p-2 transition-all ${
                  currentMood.key === m.key ? 'border border-opacity-50 bg-opacity-5' : ''
                }`} style={currentMood.key === m.key ? { borderColor: '#FF2D78', backgroundColor: 'rgba(255,45,120,0.05)' } : {}}>
                  <span className="text-xl">{m.emoji}</span>
                  <span className="font-exo text-sm text-white">{m.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
