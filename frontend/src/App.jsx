import React, { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import PlannerPage from './pages/PlannerPage'
import ResultPage from './pages/ResultPage'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function App() {
  useEffect(() => {
    // Keep Render alive by pinging every 10 minutes
    const ping = () => fetch(`${API_URL}/health`).catch(() => {})
    ping() // ping immediately on load
    const interval = setInterval(ping, 10 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/plan" element={<PlannerPage />} />
      <Route path="/result" element={<ResultPage />} />
    </Routes>
  )
}
