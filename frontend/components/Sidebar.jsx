import React from 'react'

export default function Sidebar() {
  const handleLogin = () => {
    window.location.href = 'http://localhost:8000/auth/login'
  }

  return (
    <div className="w-[20%] h-screen p-6 bg-gray-800 text-white shadow-md">
      <div className="flex flex-col justify-center items-center h-full w-full">
        <h1 className="text-xl font-bold mb-4">Dashboard</h1>
        <button onClick={handleLogin} className="bg-blue-500 px-4 py-2 rounded">
          Sign in with Google
        </button>
      </div>
    </div>
  )
}
