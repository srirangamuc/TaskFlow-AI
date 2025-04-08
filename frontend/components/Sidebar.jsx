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
        // Manually redirect after successful logout
        window.location.href = '/';  // or use your router: navigate('/')
      } else {
        console.error('Logout failed');
      }
    } catch (error) {
      console.error('Logout failed', error);
    }
  };
  

  return (
    <div className="w-[20%] h-screen p-6 bg-gray-800 text-white shadow-md">
      <div className="flex flex-col justify-between h-full">
        <div>
          <h1 className="text-xl font-bold mb-6 text-center">Dashboard</h1>

          {user ? (
            <div className="flex flex-col items-center space-y-3 mb-6">
              <img
                src={user.picture}
                alt="User"
                className="w-16 h-16 rounded-full shadow"
                referrerPolicy="no-referrer"
              />
              <div className="text-center">
                <p className="text-lg font-semibold">{user.name}</p>
                <p className="text-sm text-gray-300">{user.email}</p>
              </div>
            </div>
          ) : (
            <button onClick={handleLogin} className="bg-blue-500 px-4 py-2 rounded w-full">
              Sign in with Google
            </button>
          )}
        </div>

        {user && (
          <button
            onClick={handleLogout}
            className="bg-red-500 px-4 py-2 rounded w-full mt-6"
          >
            Logout
          </button>
        )}
      </div>
    </div>
  )
}
