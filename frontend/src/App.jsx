import React from 'react'
import { Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import PlannerPage from './pages/PlannerPage'
import ResultPage from './pages/ResultPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/plan" element={<PlannerPage />} />
      <Route path="/result" element={<ResultPage />} />
    </Routes>
  )
}
