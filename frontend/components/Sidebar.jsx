import React, { useEffect, useState } from 'react'
import axios from 'axios'

export default function Sidebar() {
  const [user, setUser] = useState(null)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get('http://localhost:8000/auth/userinfo', {
          withCredentials: true,
        })
        setUser(res.data)
      } catch (err) {
        console.log(`User not logged in. Error: ${err}`)
      }
    }

    fetchUser()
  }, [])

  const handleLogin = () => {
    window.location.href = 'http://localhost:8000/auth/login'
  }

  const handleLogout = async () => {
    try {
      const response = await fetch('http://localhost:8000/auth/logout', {
        method: 'GET',
        credentials: 'include',
      });
      
      if (response.ok) {
        window.location.href = '/';
      } else {
        console.error('Logout failed');
      }
    } catch (error) {
      console.error('Logout failed', error);
    }
  };
  
  return (
    <div className="w-64 h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black relative overflow-hidden">
      {/* Blurry gradient elements */}
      <div className="absolute -top-20 -left-20 w-40 h-40 bg-lime-500/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 -left-10 w-40 h-40 bg-lime-500/10 rounded-full blur-3xl"></div>
      
      {/* Content */}
      <div className="relative z-10 p-6 h-full flex flex-col justify-center items-center space-y-8">
        <div>
          <h1 className="text-2xl font-bold mb-8 text-white flex items-center justify-center">
            TaskFlow<span className="text-lime-400">AI</span>
          </h1>

          {user ? (
            <div className="flex flex-col items-center space-y-4 mb-8">
              <div className="relative">
                <div className="absolute inset-0 bg-lime-400/20 rounded-full blur-sm"></div>
                <img
                  src={user.picture}
                  alt="User"
                  className="w-16 h-16 rounded-full border-2 border-lime-400/50 relative z-10"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold text-white">{user.name}</p>
                <p className="text-sm text-gray-300">{user.email}</p>
              </div>
            </div>
          ) : (
            <button 
              onClick={handleLogin} 
              className="w-full bg-gradient-to-r from-lime-500 to-lime-600 hover:from-lime-600 hover:to-lime-700 text-gray-900 font-medium px-4 py-2 rounded-lg transition-all shadow-lg shadow-lime-500/20"
            >
              Sign in with Google
            </button>
          )}
          
          {/* Menu Items */}
          <div className="mt-8 space-y-2">
            <div className="px-4 py-2 bg-lime-500/10 backdrop-blur-sm rounded-lg border border-lime-500/20 flex items-center text-white hover:bg-lime-500/20 transition cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-lime-400" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
              </svg>
              Dashboard
            </div>
            <div className="px-4 py-2 rounded-lg flex items-center text-gray-300 hover:bg-lime-500/10 transition cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              Timer
            </div>
            <div className="px-4 py-2 rounded-lg flex items-center text-gray-300 hover:bg-lime-500/10 transition cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
              Calendar
            </div>
            <div className="px-4 py-2 rounded-lg flex items-center text-gray-300 hover:bg-lime-500/10 transition cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
              </svg>
              Settings
            </div>
          </div>
        </div>
        
        {user && (
          <button
            onClick={handleLogout}
            className="w-full bg-gray-800/60 backdrop-blur-sm border border-red-500/30 hover:bg-red-500/20 text-red-400 font-medium px-4 py-2 rounded-lg transition-all"
          >
            Logout
          </button>
        )}
      </div>
    </div>
  )
}