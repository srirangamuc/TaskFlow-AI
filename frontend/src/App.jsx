import React from 'react'
import Sidebar from '../components/Sidebar'
import Home from '../pages/Home'

export default function App() {
  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      {/* Blurry gradient background elements */}
      <div className="fixed -top-40 -left-40 w-80 h-80 bg-lime-500/20 rounded-full blur-3xl"></div>
      <div className="fixed top-1/2 right-1/3 w-60 h-60 bg-lime-500/10 rounded-full blur-3xl"></div>
      <div className="fixed bottom-20 left-1/4 w-60 h-60 bg-lime-500/15 rounded-full blur-3xl"></div>
      
      {/* Main content area */}
      <div className="relative z-10 flex w-full">
        <Sidebar />
        <main className="flex-1 overflow-y-auto relative">
          <Home />
        </main>
      </div>
    </div>
  )
}