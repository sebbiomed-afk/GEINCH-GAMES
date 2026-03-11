import { BrowserRouter, Routes, Route } from 'react-router'
import Home from './pages/Home'
import GameDetail from './pages/GameDetail'
import HandPoseGame from './games/HandPose/HandPoseGame'
import MoodGame from './games/MoodDetector/MoodGame'
import GazeGame from './games/GazeTracker/GazeGame'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/game/:gameId" element={<GameDetail />} />
        <Route path="/play/hand-pose" element={<HandPoseGame />} />
        <Route path="/play/mood-detector" element={<MoodGame />} />
        <Route path="/play/gaze-tracker" element={<GazeGame />} />
      </Routes>
    </BrowserRouter>
  )
}
