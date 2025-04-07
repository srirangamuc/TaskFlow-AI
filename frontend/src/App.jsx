import React from 'react'
import Sidebar from '../components/Sidebar'
import Home from '../pages/Home'

export default function App() {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar: fixed height, no scroll */}
      <Sidebar />

      {/* Main: takes remaining space, scrollable */}
      <main className="flex-1 overflow-y-auto p-6">
        <Home />
      </main>
    </div>
  )
}
