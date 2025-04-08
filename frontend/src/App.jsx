import React from 'react'
import Sidebar from '../components/Sidebar'
import Home from '../pages/Home'
import PomodoroTimer from '../components/PomodoroTimer'
export default function App() {
  return (
    <div className="flex h-screen overflow-hidden relative">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-6 relative">
        <Home />
        <PomodoroTimer />
      </main>
    </div>
  )
}
