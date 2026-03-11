import { useRef, useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router'
import { ArrowLeft, Trophy, Timer, Hand } from 'lucide-react'

const POSES = [
  { name: 'Puño', emoji: '✊', key: 'fist', description: 'Cierra todos los dedos' },
  { name: 'Victoria', emoji: '✌️', key: 'peace', description: 'Levanta índice y medio' },
  { name: 'Pulgar arriba', emoji: '👍', key: 'thumbs_up', description: 'Solo el pulgar levantado' },
  { name: 'Mano abierta', emoji: '✋', key: 'open', description: 'Extiende todos los dedos' },
  //{ name: 'Pinza', emoji: '🤌', key: 'pinch', description: 'Une pulgar e índice' },
]

// Finger landmark indices from MediaPipe
const FINGER_TIPS = [4, 8, 12, 16, 20]
const FINGER_PIPS = [3, 7, 11, 15, 19]
//const FINGER_MCPS = [2, 6, 10, 14, 18]

type Landmark = { x: number; y: number; z: number }

function detectPose(landmarks: Landmark[]): string {
  if (!landmarks || landmarks.length < 21) return 'none'

  const fingersUp: boolean[] = []

  // Thumb (special case - compare x position)
  fingersUp.push(landmarks[4].x > landmarks[3].x)

  // Other 4 fingers
  for (let i = 1; i < 5; i++) {
    fingersUp.push(landmarks[FINGER_TIPS[i]].y < landmarks[FINGER_PIPS[i]].y)
  }

  const count = fingersUp.filter(Boolean).length

  if (count === 0) return 'fist'
  if (count === 5) return 'open'
  if (fingersUp[0] && !fingersUp[1] && !fingersUp[2] && !fingersUp[3] && !fingersUp[4]) return 'thumbs_up'
  if (!fingersUp[0] && fingersUp[1] && fingersUp[2] && !fingersUp[3] && !fingersUp[4]) return 'peace'
  //if (fingersUp[0] && fingersUp[1] && !fingersUp[2] && !fingersUp[3] && !fingersUp[4]) return 'pinch'

  return 'none'
}

export default function HandPoseGame() {
  const navigate = useNavigate()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'playing' | 'error'>('loading')
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(60)
  const [currentPose, setCurrentPose] = useState(POSES[0])
  const [detectedPose, setDetectedPose] = useState('none')
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null)
  const handsRef = useRef<unknown>(null)
  const rafRef = useRef<number>(0)
  const scoreTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const nextPose = useCallback(() => {
    setCurrentPose(POSES[Math.floor(Math.random() * POSES.length)])
  }, [])

  // Load MediaPipe dynamically
  useEffect(() => {
    const loadMediaPipe = async () => {
      try {
        const script1 = document.createElement('script')
        script1.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/hands.js'
        script1.crossOrigin = 'anonymous'
        document.head.appendChild(script1)

        await new Promise((resolve, reject) => {
          script1.onload = resolve
          script1.onerror = reject
        })

        const script2 = document.createElement('script')
        script2.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils@0.3.1675466862/camera_utils.js'
        script2.crossOrigin = 'anonymous'
        document.head.appendChild(script2)

        await new Promise((resolve, reject) => {
          script2.onload = resolve
          script2.onerror = reject
        })

        setStatus('ready')
      } catch {
        setStatus('error')
      }
    }
    loadMediaPipe()
  }, [])

  const startGame = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return
    setStatus('playing')
    setScore(0)
    setTimeLeft(60)
    nextPose()

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } })
      videoRef.current.srcObject = stream
      await videoRef.current.play()

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const win = window as any
      const hands = new win.Hands({
        locateFile: (file: string) =>
          `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/${file}`,
      })

      hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.7,
      })

      hands.onResults((results: { multiHandLandmarks?: Landmark[][] }) => {
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

        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
          const landmarks = results.multiHandLandmarks[0]
          const pose = detectPose(landmarks)
          setDetectedPose(pose)

          // Draw landmarks
          ctx.save()
          ctx.scale(-1, 1)
          ctx.translate(-canvas.width, 0)

          // Draw connections
          const connections = [
            [0,1],[1,2],[2,3],[3,4],
            [0,5],[5,6],[6,7],[7,8],
            [5,9],[9,10],[10,11],[11,12],
            [9,13],[13,14],[14,15],[15,16],
            [13,17],[17,18],[18,19],[19,20],[0,17]
          ]
          ctx.strokeStyle = 'rgba(0,255,194,0.6)'
          ctx.lineWidth = 2
          for (const [a, b] of connections) {
            ctx.beginPath()
            ctx.moveTo(landmarks[a].x * canvas.width, landmarks[a].y * canvas.height)
            ctx.lineTo(landmarks[b].x * canvas.width, landmarks[b].y * canvas.height)
            ctx.stroke()
          }

          // Draw points
          for (const lm of landmarks) {
            ctx.beginPath()
            ctx.arc(lm.x * canvas.width, lm.y * canvas.height, 4, 0, Math.PI * 2)
            ctx.fillStyle = '#00FFC2'
            ctx.fill()
          }
          ctx.restore()
        } else {
          setDetectedPose('none')
        }
      })

      handsRef.current = hands

      const camera = new win.Camera(videoRef.current, {
        onFrame: async () => {
          if (videoRef.current && handsRef.current) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (handsRef.current as any).send({ image: videoRef.current })
          }
        },
        width: 640,
        height: 480,
      })
      camera.start()
    } catch {
      setStatus('error')
    }
  }, [nextPose])

  // Timer
  useEffect(() => {
    if (status !== 'playing') return
    const interval = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(interval)
          setStatus('ready')
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [status])

  // Check pose match
  useEffect(() => {
    if (status !== 'playing') return
    if (detectedPose === currentPose.key) {
      if (scoreTimeoutRef.current) return
      setFeedback('correct')
      setScore(s => s + 10)
      scoreTimeoutRef.current = setTimeout(() => {
        nextPose()
        setFeedback(null)
        scoreTimeoutRef.current = null
      }, 1000)
    }
  }, [detectedPose, currentPose, status, nextPose])

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
        tracks.forEach(t => t.stop())
      }
    }
  }, [])

  return (
    <div className="min-h-screen bg-dark-900 grid-bg flex flex-col">
      {/* Header HUD */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white border-opacity-5">
        <button onClick={() => navigate('/game/hand-pose')}
          className="flex items-center gap-2 font-mono text-xs text-gray-500 hover:text-neon-cyan transition-colors uppercase tracking-wider">
          <ArrowLeft size={14} />
          Salir
        </button>

        <div className="flex items-center gap-2">
          <Hand size={16} className="text-neon-cyan" />
          <span className="font-orbitron text-sm font-bold text-white">HAND POSE</span>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Trophy size={14} className="text-neon-cyan" />
            <span className="font-orbitron text-sm text-white">{score}</span>
          </div>
          <div className="flex items-center gap-2">
            <Timer size={14} className={timeLeft < 10 ? 'text-red-400' : 'text-gray-400'} />
            <span className={`font-orbitron text-sm ${timeLeft < 10 ? 'text-red-400' : 'text-white'}`}>
              {timeLeft}s
            </span>
          </div>
        </div>
      </div>

      {/* Main area */}
      <div className="flex-1 flex flex-col lg:flex-row gap-6 p-6">
        {/* Camera feed */}
        <div className="flex-1 relative card-cyber overflow-hidden" style={{ minHeight: 400 }}>
          <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover opacity-0" autoPlay playsInline muted />
          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-cover"
            style={{ transform: 'scaleX(-1)' }} />

          {/* HUD corners */}
          {['tl','tr','bl','br'].map(p => (
            <div key={p} className={`hud-corner hud-corner-${p}`} style={{ width: 30, height: 30 }} />
          ))}

          {/* Status overlays */}
          {status === 'loading' && (
            <div className="absolute inset-0 flex items-center justify-center bg-dark-900">
              <div className="text-center">
                <div className="w-12 h-12 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="font-mono text-neon-cyan text-sm">Cargando IA...</p>
              </div>
            </div>
          )}

          {status === 'ready' && (
            <div className="absolute inset-0 flex items-center justify-center bg-dark-900 bg-opacity-90">
              <div className="text-center">
                <Hand size={56} className="text-neon-cyan mx-auto mb-6" style={{ filter: 'drop-shadow(0 0 20px #00FFC2)' }} />
                <p className="font-orbitron text-2xl font-bold text-white mb-2">
                  {timeLeft === 0 ? `Puntuación final: ${score}` : 'Listo para jugar'}
                </p>
                <p className="font-mono text-sm text-gray-400 mb-8">Se necesita acceso a la cámara</p>
                <button onClick={startGame} className="btn-neon">
                  {timeLeft === 0 ? 'Jugar de nuevo' : 'Iniciar juego'}
                </button>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="absolute inset-0 flex items-center justify-center bg-dark-900 bg-opacity-90">
              <div className="text-center">
                <p className="font-orbitron text-neon-pink text-xl mb-4">Error de cámara</p>
                <p className="font-mono text-sm text-gray-400 mb-6">Permite el acceso a la cámara e intenta de nuevo</p>
                <button onClick={() => setStatus('ready')} className="btn-neon">Reintentar</button>
              </div>
            </div>
          )}

          {/* Feedback overlay */}
          {feedback === 'correct' && (
            <div className="absolute inset-0 border-4 border-neon-cyan pointer-events-none animate-pulse" />
          )}

          {/* Scan line when playing */}
          {status === 'playing' && <div className="scan-beam" />}
        </div>

        {/* Right panel */}
        <div className="w-full lg:w-72 flex flex-col gap-4">
          {/* Target pose */}
          <div className="card-cyber p-6 text-center">
            <p className="font-mono text-xs text-gray-600 uppercase tracking-wider mb-3">// Realiza esta pose</p>
            <div className="text-6xl mb-3">{currentPose.emoji}</div>
            <p className="font-orbitron text-base font-bold text-white mb-2">{currentPose.name}</p>
            <p className="font-exo text-xs text-gray-500">{currentPose.description}</p>
          </div>

          {/* Detected pose */}
          <div className="card-cyber p-4">
            <p className="font-mono text-xs text-gray-600 uppercase tracking-wider mb-2">// Detectado</p>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${detectedPose !== 'none' ? 'bg-neon-cyan' : 'bg-gray-600'}`} />
              <span className="font-mono text-sm text-white">
                {detectedPose === 'none' ? 'Sin detección' : POSES.find(p => p.key === detectedPose)?.name ?? detectedPose}
              </span>
            </div>
          </div>

          {/* Pose list */}
          <div className="card-cyber p-4 flex-1">
            <p className="font-mono text-xs text-gray-600 uppercase tracking-wider mb-3">// Poses disponibles</p>
            <div className="space-y-2">
              {POSES.map(p => (
                <div key={p.key} className={`flex items-center gap-3 p-2 transition-all ${
                  currentPose.key === p.key ? 'border border-neon-cyan border-opacity-50 bg-neon-cyan bg-opacity-5' : ''
                }`}>
                  <span className="text-xl">{p.emoji}</span>
                  <div>
                    <p className="font-exo text-xs text-white">{p.name}</p>
                    <p className="font-mono text-xs text-gray-600">{p.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
