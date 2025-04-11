import React,{ useEffect, useState } from "react"
import PomodoroTimer from "../components/PomodoroTimer"
import { useAuth } from "../hooks/useAuth"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts"
import axios from "axios"

export default function Home() {
  const { isLoggedIn, loading, authToken } = useAuth()
  const [weeklyData, setWeeklyData] = useState([])
  const [syncing, setSyncing] = useState(false)
  const [syncStatus, setSyncStatus] = useState("")

  // Fetch weekly activity data from the backend
  useEffect(() => {
    const fetchWeeklyData = async () => {
      try {
        const res = await axios.get("http://localhost:8000/dashboard/weekly-activity", {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
          withCredentials: true,
        })
        const data = Array.isArray(res.data?.weekly_activity) ? res.data.weekly_activity : []
        setWeeklyData(data)
      } catch (err) {
        console.error("Failed to fetch weekly activity:", err)
        setWeeklyData([])
      }
    }

    if (isLoggedIn && authToken) {
      fetchWeeklyData()
    }
  }, [isLoggedIn, authToken])

  const handleSync = async () => {
    setSyncing(true)
    setSyncStatus("Syncing...")
    try {
      const res = await axios.post(
        "http://localhost:8000/dashboard/sync-events",
        {},
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
          withCredentials: true,
        },
      )
      if (res.data?.message === "Calendar events synced.") {
        setSyncStatus("Sync successful!")
        // Re-fetch the weekly data after syncing
        const fetchWeeklyData = async () => {
          try {
            const res = await axios.get("http://localhost:8000/dashboard/weekly-activity", {
              headers: {
                Authorization: `Bearer ${authToken}`,
              },
              withCredentials: true,
            })
            const data = Array.isArray(res.data?.weekly_activity) ? res.data.weekly_activity : []
            setWeeklyData(data)
          } catch (err) {
            console.error("Failed to fetch weekly activity:", err)
          }
        }
        fetchWeeklyData()
      } else {
        setSyncStatus("Sync failed.")
      }
    } catch (err) {
      console.error("Error syncing events:", err)
      setSyncStatus("Sync failed.")
    } finally {
      setSyncing(false)
    }
  }

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        <div className="p-6 text-lime-400 text-xl font-medium animate-pulse">Loading...</div>
      </div>
    )

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black relative overflow-hidden">
      {/* Blurry gradient background elements */}
      <div className="absolute -top-40 -left-40 w-80 h-80 bg-lime-500/20 rounded-full blur-3xl"></div>
      <div className="absolute top-1/2 -right-40 w-80 h-80 bg-lime-500/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 left-1/3 w-60 h-60 bg-lime-500/15 rounded-full blur-3xl"></div>

      <div className="relative z-10 p-6 min-h-screen space-y-6 max-w-7xl mx-auto">
        {isLoggedIn ? (
          <>
            {/* Sync Button */}
            <div className="flex items-center space-x-4 mb-6">
              <button
                onClick={handleSync}
                disabled={syncing}
                className={`px-4 py-2 bg-gradient-to-r from-lime-500 to-lime-600 hover:from-lime-600 hover:to-lime-700 text-gray-900 font-medium rounded-lg transition-all ${syncing ? "cursor-not-allowed opacity-50" : ""} shadow-lg shadow-lime-500/20`}
              >
                {syncing ? "Syncing..." : "Sync Calendar Events"}
              </button>
              <p
                className={`text-sm ${syncStatus === "Sync successful!" ? "text-lime-400" : syncStatus === "Sync failed." ? "text-red-400" : "text-gray-400"}`}
              >
                {syncStatus}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Pomodoro Timer Component */}
              <div className="bg-gray-800/60 backdrop-blur-sm rounded-xl border border-gray-700/50 shadow-xl relative">
                <PomodoroTimer />
              </div>

              {/* Weekly Activity Bar Chart */}
              <div>
                <h3 className="text-xl font-semibold mb-4 text-white">Hours Spent per Day <span className="text-lime-400">(Past Week)</span></h3>
                <div className="w-full h-96 bg-gray-800/60 backdrop-blur-sm rounded-xl border border-gray-700/50 shadow-xl p-6 relative overflow-hidden">
                  {/* Blurry gradient elements for chart background */}
                  <div className="absolute -top-20 -right-20 w-40 h-40 bg-lime-500/10 rounded-full blur-3xl"></div>
                  <div className="absolute bottom-10 left-10 w-40 h-40 bg-lime-500/5 rounded-full blur-3xl"></div>
                  
                  <div className="relative z-10 h-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={weeklyData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="date" stroke="#9CA3AF" />
                        <YAxis unit="h" stroke="#9CA3AF" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#1F2937",
                            borderColor: "#374151",
                            color: "#E5E7EB",
                          }}
                          itemStyle={{ color: "#E5E7EB" }}
                          labelStyle={{ color: "#E5E7EB" }}
                        />
                        <Bar dataKey="hours" fill="#4ade80" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Recent Sessions Section */}
            <div className="mt-8">
              <h3 className="text-xl font-semibold mb-4 text-white">Recent <span className="text-lime-400">Sessions</span></h3>
              <div className="bg-gray-800/60 backdrop-blur-sm rounded-xl border border-gray-700/50 shadow-xl p-6 relative overflow-hidden">
                {/* Blurry gradient elements */}
                <div className="absolute -top-20 -left-20 w-40 h-40 bg-lime-500/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-10 right-10 w-40 h-40 bg-lime-500/5 rounded-full blur-3xl"></div>
                
                <div className="relative z-10">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[1, 2, 3].map((item) => (
                      <div key={item} className="bg-gray-900/50 rounded-lg p-4 border border-gray-700/50">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium text-white">Work Session #{item}</h4>
                            <p className="text-sm text-gray-400">Today, 2:30 PM</p>
                          </div>
                          <span className="text-lime-400 font-medium">25m</span>
                        </div>
                        <div className="mt-3 text-sm text-gray-300">
                          <p>Completed 5 work cycles</p>
                          <div className="w-full bg-gray-700 rounded-full h-1.5 mt-2">
                            <div className="bg-lime-500 h-1.5 rounded-full" style={{ width: '70%' }}></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <button className="mt-4 text-sm text-lime-400 hover:text-lime-300 flex items-center transition-colors">
                    View all sessions
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-screen w-full">
          <div className="flex items-center justify-center h-96 backdrop-blur-md bg-transperant rounded-lg z-20  w-full max-w-lg mx-4">
            <div className="bg-transperant p-8 rounded-xl max-w-md text-center">
              <h3 className="text-xl font-semibold text-white mb-2">Welcome to TaskFlow<span className="text-lime-400">AI</span></h3>
              <p className="text-gray-300">Your personal productivity companion</p>
            </div>
          </div>
        </div>
        )}
      </div>
    </div>
  )
}