import { useRef, useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router'
import { ArrowLeft, Trophy, Timer, Eye } from 'lucide-react'

type Target = { x: number; y: number; id: number }

export default function GazeGame() {
  const navigate = useNavigate()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gazeCanvasRef = useRef<HTMLCanvasElement>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'playing' | 'error'>('loading')
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(45)
  const [target, setTarget] = useState<Target | null>(null)
  const [gazePos, setGazePos] = useState<{ x: number; y: number } | null>(null)
  const [gazeTime, setGazeTime] = useState(0)
  const hitTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const faceMeshRef = useRef<unknown>(null)

  const spawnTarget = useCallback(() => {
    const margin = 80
    const area = gazeCanvasRef.current
    if (!area) return
    const x = margin + Math.random() * (area.offsetWidth - margin * 2)
    const y = margin + Math.random() * (area.offsetHeight - margin * 2)
    setTarget({ x, y, id: Date.now() })
    setGazeTime(0)
  }, [])

  useEffect(() => {
    const load = async () => {
      try {
        const script = document.createElement('script')
        script.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4.1633559619/face_mesh.js'
        script.crossOrigin = 'anonymous'
        document.head.appendChild(script)
        await new Promise((res, rej) => { script.onload = res; script.onerror = rej })

        const script2 = document.createElement('script')
        script2.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils@0.3.1675466862/camera_utils.js'
        script2.crossOrigin = 'anonymous'
        document.head.appendChild(script2)
        await new Promise((res, rej) => { script2.onload = res; script2.onerror = rej })

        setStatus('ready')
      } catch {
        setStatus('error')
      }
    }
    load()
  }, [])

  const startGame = useCallback(async () => {
    if (!videoRef.current) return
    setStatus('loading')

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } })
      videoRef.current.srcObject = stream
      await videoRef.current.play()

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const win = window as any
      const faceMesh = new win.FaceMesh({
        locateFile: (f: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4.1633559619/${f}`
      })
      faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      })

      faceMesh.onResults((results: { multiFaceLandmarks?: { x: number; y: number; z: number }[][] }) => {
        const canvas = canvasRef.current
        const video = videoRef.current
        if (!canvas || !video) return

        const ctx = canvas.getContext('2d')!
        canvas.width = video.videoWidth || 640
        canvas.height = video.videoHeight || 480
        ctx.save()
        ctx.scale(-1, 1)
        ctx.translate(-canvas.width, 0)
        ctx.drawImage(video, 0, 0)
        ctx.restore()

        if (results.multiFaceLandmarks?.length) {
          const lm = results.multiFaceLandmarks[0]

          // Iris landmarks: left iris center ~473, right iris center ~468
          // Use average of both irises for gaze estimation
          const leftIris = lm[473]
          const rightIris = lm[468]

          if (leftIris && rightIris) {
            const avgX = (leftIris.x + rightIris.x) / 2
            const avgY = (leftIris.y + rightIris.y) / 2

            // Map to gaze canvas
            const gc = gazeCanvasRef.current
            if (gc) {
              // Flip X because camera is mirrored
              const gx = (1 - avgX) * gc.offsetWidth
              const gy = avgY * gc.offsetHeight
              setGazePos({ x: gx, y: gy })
            }

            // Draw iris points on video canvas
            ctx.save()
            ctx.scale(-1, 1)
            ctx.translate(-canvas.width, 0)
            ctx.fillStyle = '#7B2FFF'
            ctx.beginPath()
            ctx.arc(leftIris.x * canvas.width, leftIris.y * canvas.height, 6, 0, Math.PI * 2)
            ctx.fill()
            ctx.beginPath()
            ctx.arc(rightIris.x * canvas.width, rightIris.y * canvas.height, 6, 0, Math.PI * 2)
            ctx.fill()
            ctx.restore()
          }
        }
      })

      faceMeshRef.current = faceMesh
      const camera = new win.Camera(videoRef.current, {
        onFrame: async () => {
          if (videoRef.current && faceMeshRef.current) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (faceMeshRef.current as any).send({ image: videoRef.current })
          }
        },
        width: 640, height: 480
      })
      camera.start()

      setStatus('playing')
      setScore(0)
      setTimeLeft(45)
      setTimeout(() => spawnTarget(), 500)
    } catch {
      setStatus('error')
    }
  }, [spawnTarget])

  // Check gaze hits target
  useEffect(() => {
    if (status !== 'playing' || !gazePos || !target) return
    const dx = gazePos.x - target.x
    const dy = gazePos.y - target.y
    const dist = Math.sqrt(dx * dx + dy * dy)

    if (dist < 50) {
      setGazeTime(t => {
        const newT = t + 1
        if (newT >= 10 && !hitTimeoutRef.current) {
          hitTimeoutRef.current = setTimeout(() => {
            setScore(s => s + 15)
            spawnTarget()
            hitTimeoutRef.current = null
          }, 0)
        }
        return newT
      })
    } else {
      setGazeTime(0)
    }
  }, [gazePos, target, status, spawnTarget])

  // Timer
  useEffect(() => {
    if (status !== 'playing') return
    const interval = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(interval); setStatus('ready'); return 0 }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [status])

  useEffect(() => {
    return () => {
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
        tracks.forEach(t => t.stop())
      }
    }
  }, [])

  const PURPLE = '#7B2FFF'

  return (
    <div className="min-h-screen bg-dark-900 grid-bg flex flex-col">
      <div className="flex items-center justify-between px-6 py-4 border-b border-white border-opacity-5">
        <button onClick={() => navigate('/game/gaze-tracker')}
          className="flex items-center gap-2 font-mono text-xs text-gray-500 hover:text-purple-400 transition-colors uppercase tracking-wider">
          <ArrowLeft size={14} />
          Salir
        </button>
        <div className="flex items-center gap-2">
          <Eye size={16} style={{ color: PURPLE }} />
          <span className="font-orbitron text-sm font-bold text-white">GAZE TRACKER</span>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Trophy size={14} style={{ color: PURPLE }} />
            <span className="font-orbitron text-sm text-white">{score}</span>
          </div>
          <div className="flex items-center gap-2">
            <Timer size={14} className={timeLeft < 10 ? 'text-red-400' : 'text-gray-400'} />
            <span className={`font-orbitron text-sm ${timeLeft < 10 ? 'text-red-400' : 'text-white'}`}>{timeLeft}s</span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-6 p-6">
        {/* Gaze canvas (game area) */}
        <div className="flex-1 relative card-cyber overflow-hidden" style={{ minHeight: 400 }}
          ref={gazeCanvasRef as React.RefObject<HTMLDivElement>}>
          <canvas ref={gazeCanvasRef as unknown as React.RefObject<HTMLCanvasElement>}
            className="absolute inset-0 w-full h-full" />

          {/* Target */}
          {status === 'playing' && target && (
            <div className="absolute transition-all duration-300 pointer-events-none"
              style={{ left: target.x - 30, top: target.y - 30, width: 60, height: 60 }}>
              {/* Outer ring */}
              <div className="absolute inset-0 rounded-full border-2 animate-ping opacity-30"
                style={{ borderColor: PURPLE }} />
              {/* Progress ring */}
              <div className="absolute inset-2 rounded-full border-2"
                style={{ borderColor: PURPLE, opacity: 0.6 }} />
              {/* Center */}
              <div className="absolute inset-4 rounded-full flex items-center justify-center"
                style={{ background: `${PURPLE}40`, borderColor: PURPLE, border: '1px solid' }}>
                <Eye size={12} style={{ color: PURPLE }} />
              </div>
              {/* Gaze progress */}
              {gazeTime > 0 && (
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-16 h-1 bg-dark-700 rounded-full">
                  <div className="h-full rounded-full transition-all"
                    style={{ width: `${(gazeTime / 10) * 100}%`, background: PURPLE }} />
                </div>
              )}
            </div>
          )}

          {/* Gaze cursor */}
          {status === 'playing' && gazePos && (
            <div className="absolute pointer-events-none transition-all duration-100"
              style={{ left: gazePos.x - 8, top: gazePos.y - 8, width: 16, height: 16 }}>
              <div className="w-full h-full rounded-full border-2 border-neon-cyan opacity-80"
                style={{ boxShadow: '0 0 8px #00FFC2' }} />
            </div>
          )}

          {['tl','tr','bl','br'].map(p => (
            <div key={p} className={`hud-corner hud-corner-${p}`}
              style={{ width: 30, height: 30, borderColor: PURPLE }} />
          ))}

          {status === 'loading' && (
            <div className="absolute inset-0 flex items-center justify-center bg-dark-900 bg-opacity-90">
              <div className="text-center">
                <div className="w-12 h-12 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-4"
                  style={{ borderColor: PURPLE, borderTopColor: 'transparent' }} />
                <p className="font-mono text-sm" style={{ color: PURPLE }}>Cargando Face Mesh...</p>
              </div>
            </div>
          )}

          {status === 'ready' && (
            <div className="absolute inset-0 flex items-center justify-center bg-dark-900 bg-opacity-90">
              <div className="text-center">
                <Eye size={56} className="mx-auto mb-6" style={{ color: PURPLE, filter: `drop-shadow(0 0 20px ${PURPLE})` }} />
                <p className="font-orbitron text-2xl font-bold text-white mb-2">
                  {timeLeft === 0 ? `Puntuación: ${score}` : 'Control ocular'}
                </p>
                <p className="font-mono text-sm text-gray-400 mb-8">Mira el objetivo y mantenlo por 1 segundo</p>
                <button onClick={startGame} className="btn-neon" style={{ background: PURPLE }}>
                  {timeLeft === 0 ? 'Jugar de nuevo' : 'Iniciar juego'}
                </button>
              </div>
            </div>
          )}

          {status === 'playing' && (
            <div className="scan-beam" style={{ background: `linear-gradient(90deg, transparent, ${PURPLE}, transparent)` }} />
          )}
        </div>

        {/* Side panel with camera */}
        <div className="w-full lg:w-72 flex flex-col gap-4">
          {/* Small camera view */}
          <div className="relative aspect-video card-cyber overflow-hidden">
            <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover opacity-0" autoPlay playsInline muted />
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-cover"
              style={{ transform: 'scaleX(-1)' }} />
            <div className="absolute top-2 left-2">
              <span className="font-mono text-xs px-2 py-0.5" style={{ color: PURPLE, border: `1px solid ${PURPLE}40` }}>
                IRIS CAM
              </span>
            </div>
          </div>

          <div className="card-cyber p-4">
            <p className="font-mono text-xs text-gray-600 uppercase tracking-wider mb-2">// Posición de mirada</p>
            {gazePos ? (
              <div className="space-y-1">
                <p className="font-mono text-sm text-white">X: <span style={{ color: PURPLE }}>{Math.round(gazePos.x)}</span></p>
                <p className="font-mono text-sm text-white">Y: <span style={{ color: PURPLE }}>{Math.round(gazePos.y)}</span></p>
              </div>
            ) : (
              <p className="font-mono text-sm text-gray-500">Sin detección</p>
            )}
          </div>

          <div className="card-cyber p-4 flex-1">
            <p className="font-mono text-xs text-gray-600 uppercase tracking-wider mb-3">// Instrucciones</p>
            <ol className="space-y-3">
              {[
                'Mantén la cabeza quieta',
                'Mira el círculo objetivo',
                'Sostenla mirada 1 segundo',
                'Aparecerá un nuevo objetivo',
              ].map((s, i) => (
                <li key={i} className="flex gap-3">
                  <span className="font-orbitron text-xs font-bold shrink-0 mt-0.5" style={{ color: PURPLE }}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="font-exo text-xs text-gray-400">{s}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}
