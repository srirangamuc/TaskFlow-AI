import React, { useEffect, useRef, useState } from 'react'

export default function PomodoroTimer() {
  // Work timer input values
  const [workHours, setWorkHours] = useState(0)
  const [workMinutes, setWorkMinutes] = useState(25) // Default 25 minutes for work
  const [workSeconds, setWorkSeconds] = useState(0)
  const [workMilliseconds, setWorkMilliseconds] = useState(0)
  
  // Break timer input values
  const [breakHours, setBreakHours] = useState(0)
  const [breakMinutes, setBreakMinutes] = useState(5) // Default 5 minutes for break
  const [breakSeconds, setBreakSeconds] = useState(0)
  const [breakMilliseconds, setBreakMilliseconds] = useState(0)
  
  // Current display time
  const [displayTime, setDisplayTime] = useState({
    hours: 0,
    minutes: 25,
    seconds: 0,
    milliseconds: 0
  })
  
  const [isRunning, setIsRunning] = useState(false)
  const [isWorkMode, setIsWorkMode] = useState(true) // Track if in work or break mode
  const [cycles, setCycles] = useState(0) // Track completed work+break cycles
  const [toast, setToast] = useState({ show: false, message: '', type: '' })
  
  const intervalRef = useRef(null)
  const beepRef = useRef(null)
  const toastTimeoutRef = useRef(null)
  
  // Format time as HH:MM:SS:MS
  const formatTime = () => {
    const { hours, minutes, seconds, milliseconds } = displayTime
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}:${String(Math.floor(milliseconds / 10)).padStart(2, '0')}`
  }
  
  // Start the timer
  const startTimer = () => {
    if (!isRunning && hasTimeLeft()) {
      setIsRunning(true)
    }
  }
  
  // Pause the timer
  const pauseTimer = () => {
    setIsRunning(false)
  }
  
  // Reset current timer to the appropriate values (work or break)
  const resetCurrentTimer = () => {
    setIsRunning(false)
    
    if (isWorkMode) {
      setDisplayTime({
        hours: workHours,
        minutes: workMinutes,
        seconds: workSeconds,
        milliseconds: workMilliseconds
      })
    } else {
      setDisplayTime({
        hours: breakHours,
        minutes: breakMinutes,
        seconds: breakSeconds,
        milliseconds: breakMilliseconds
      })
    }
    
    if (beepRef.current) {
      beepRef.current.pause()
      beepRef.current.currentTime = 0
    }
    
    // Clear any existing toast
    clearTimeout(toastTimeoutRef.current)
    setToast({ show: false, message: '', type: '' })
  }
  
  // Set the work timer values
  const setWorkTimer = () => {
    if (!isRunning) {
      setIsWorkMode(true)
      setDisplayTime({
        hours: workHours,
        minutes: workMinutes,
        seconds: workSeconds,
        milliseconds: workMilliseconds
      })
    }
  }
  
  // Set the break timer values
  const setBreakTimer = () => {
    if (!isRunning) {
      setIsWorkMode(false)
      setDisplayTime({
        hours: breakHours,
        minutes: breakMinutes,
        seconds: breakSeconds,
        milliseconds: breakMilliseconds
      })
    }
  }
  
  // Show toast notification
  const showToast = (message, type) => {
    // Clear any existing toast
    clearTimeout(toastTimeoutRef.current)
    
    // Show new toast
    setToast({ show: true, message, type })
    
    // Auto-hide toast after 3 seconds
    toastTimeoutRef.current = setTimeout(() => {
      setToast({ show: false, message: '', type: '' })
    }, 3000)
  }
  
  // Calculate if timer has any time left
  const hasTimeLeft = () => {
    const { hours, minutes, seconds, milliseconds } = displayTime
    return hours > 0 || minutes > 0 || seconds > 0 || milliseconds > 0
  }
  
  // Reset all timers and counters
  const resetAll = () => {
    setIsRunning(false)
    setIsWorkMode(true)
    setCycles(0)
    setDisplayTime({
      hours: workHours,
      minutes: workMinutes,
      seconds: workSeconds,
      milliseconds: workMilliseconds
    })
    
    if (beepRef.current) {
      beepRef.current.pause()
      beepRef.current.currentTime = 0
    }
    
    // Clear any existing toast
    clearTimeout(toastTimeoutRef.current)
    setToast({ show: false, message: '', type: '' })
  }
  
  // Switch to work mode and auto-start
  const switchToWork = () => {
    setIsWorkMode(true)
    setDisplayTime({
      hours: workHours,
      minutes: workMinutes,
      seconds: workSeconds,
      milliseconds: workMilliseconds
    })
    
    showToast('Work mode started!', 'work')
    
    // Auto-start the timer after a brief delay
    setTimeout(() => {
      setIsRunning(true)
    }, 500)
  }
  
  // Switch to break mode and auto-start
  const switchToBreak = () => {
    setIsWorkMode(false)
    setDisplayTime({
      hours: breakHours,
      minutes: breakMinutes,
      seconds: breakSeconds,
      milliseconds: breakMilliseconds
    })
    
    showToast('Break time! Take a rest.', 'break')
    
    // Auto-start the timer after a brief delay
    setTimeout(() => {
      setIsRunning(true)
    }, 500)
  }
  
  // Timer countdown logic
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setDisplayTime(prev => {
          // Calculate new time values
          let newMilliseconds = prev.milliseconds - 10
          let newSeconds = prev.seconds
          let newMinutes = prev.minutes
          let newHours = prev.hours
          
          // Handle millisecond underflow
          if (newMilliseconds < 0) {
            newMilliseconds = 990
            newSeconds -= 1
          }
          
          // Handle second underflow
          if (newSeconds < 0) {
            newSeconds = 59
            newMinutes -= 1
          }
          
          // Handle minute underflow
          if (newMinutes < 0) {
            newMinutes = 59
            newHours -= 1
          }
          
          // Check if timer reached zero
          if (newHours === 0 && newMinutes === 0 && newSeconds === 0 && newMilliseconds <= 0) {
            clearInterval(intervalRef.current)
            setIsRunning(false)
            
            // Play beep sound
            if (beepRef.current) {
              beepRef.current.play()
              setTimeout(() => {
                beepRef.current.pause()
                beepRef.current.currentTime = 0
              }, 2000)
            }
            
            // Handle timer completion based on mode
            if (isWorkMode) {
              // Work timer finished - show completion toast
              showToast('Work session completed!', 'complete')
              
              // Switch to break after 2 seconds
              setTimeout(() => {
                switchToBreak()
              }, 2000)
            } else {
              // Break timer finished - increment cycle counter
              setCycles(prev => prev + 1)
              
              // Show completion toast
              showToast('Break completed!', 'complete')
              
              // Switch to work after 2 seconds
              setTimeout(() => {
                switchToWork()
              }, 2000)
            }
            
            return { hours: 0, minutes: 0, seconds: 0, milliseconds: 0 }
          }
          
          return {
            hours: newHours,
            minutes: newMinutes,
            seconds: newSeconds,
            milliseconds: newMilliseconds
          }
        })
      }, 10) // Update every 10 milliseconds
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isRunning, isWorkMode, workHours, workMinutes, workSeconds, workMilliseconds, 
      breakHours, breakMinutes, breakSeconds, breakMilliseconds])
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (beepRef.current) {
        beepRef.current.pause()
      }
      clearTimeout(toastTimeoutRef.current)
      clearInterval(intervalRef.current)
    }
  }, [])
  
  return (
    <div className="bg-gray-800/60 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 shadow-xl relative overflow-hidden">
      {/* Blurry gradient elements */}
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-lime-500/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-10 left-10 w-40 h-40 bg-lime-500/5 rounded-full blur-3xl"></div>
      
      <div className="relative z-10">
        <h3 className="text-xl font-bold text-center mb-4 text-white">🍅 <span className="text-lime-400">Pomodoro</span> Timer</h3>
        
        {/* Current Mode Display */}
        <div className={`text-center text-sm mb-3 font-medium ${isWorkMode ? 'text-lime-400' : 'text-lime-400'}`}>
          {isWorkMode ? '🖥️ WORK MODE' : '☕ BREAK MODE'} 
          {cycles > 0 && ` - Cycles Completed: ${cycles}`}
        </div>
        
        {/* Timer Display */}
        <div className={`text-3xl font-mono text-center mb-6 p-4 rounded-lg border ${
          isWorkMode ? 'bg-gray-900/50 border-lime-500/30 text-lime-400' : 'bg-gray-900/50 border-lime-500/30 text-lime-400'
        }`}>
          {formatTime()}
        </div>
        
        {/* Work Timer Settings */}
        <div className="mb-6">
          <h4 className="font-medium text-lime-400 mb-2 text-center text-sm">Work Timer</h4>
          <div className="grid grid-cols-4 gap-2 mb-3">
            <div>
              <label className="block text-xs text-gray-300 mb-1">Hours</label>
              <input
                type="number"
                value={workHours}
                onChange={(e) => setWorkHours(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full bg-gray-900/50 border border-gray-700 text-white px-2 py-1 rounded text-sm focus:border-lime-500/50 focus:outline-none"
                min="0"
                disabled={isRunning}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-300 mb-1">Minutes</label>
              <input
                type="number"
                value={workMinutes}
                onChange={(e) => setWorkMinutes(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full bg-gray-900/50 border border-gray-700 text-white px-2 py-1 rounded text-sm focus:border-lime-500/50 focus:outline-none"
                min="0"
                disabled={isRunning}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-300 mb-1">Seconds</label>
              <input
                type="number"
                value={workSeconds}
                onChange={(e) => setWorkSeconds(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full bg-gray-900/50 border border-gray-700 text-white px-2 py-1 rounded text-sm focus:border-lime-500/50 focus:outline-none"
                min="0"
                disabled={isRunning}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-300 mb-1">Ms</label>
              <input
                type="number"
                value={workMilliseconds}
                onChange={(e) => setWorkMilliseconds(Math.max(0, Math.min(999, parseInt(e.target.value) || 0)))}
                className="w-full bg-gray-900/50 border border-gray-700 text-white px-2 py-1 rounded text-sm focus:border-lime-500/50 focus:outline-none"
                min="0"
                max="999"
                disabled={isRunning}
              />
            </div>
          </div>
          <button
            onClick={setWorkTimer}
            className="w-full bg-lime-500/20 hover:bg-lime-500/30 border border-lime-500/30 text-lime-400 text-sm py-1 rounded transition-all"
            disabled={isRunning}
          >
            Set Work Timer
          </button>
        </div>
        
        {/* Break Timer Settings */}
        <div className="mb-6">
          <h4 className="font-medium text-lime-400 mb-2 text-center text-sm">Break Timer</h4>
          <div className="grid grid-cols-4 gap-2 mb-3">
            <div>
              <label className="block text-xs text-gray-300 mb-1">Hours</label>
              <input
                type="number"
                value={breakHours}
                onChange={(e) => setBreakHours(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full bg-gray-900/50 border border-gray-700 text-white px-2 py-1 rounded text-sm focus:border-lime-500/50 focus:outline-none"
                min="0"
                disabled={isRunning}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-300 mb-1">Minutes</label>
              <input
                type="number"
                value={breakMinutes}
                onChange={(e) => setBreakMinutes(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full bg-gray-900/50 border border-gray-700 text-white px-2 py-1 rounded text-sm focus:border-lime-500/50 focus:outline-none"
                min="0"
                disabled={isRunning}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-300 mb-1">Seconds</label>
              <input
                type="number"
                value={breakSeconds}
                onChange={(e) => setBreakSeconds(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full bg-gray-900/50 border border-gray-700 text-white px-2 py-1 rounded text-sm focus:border-lime-500/50 focus:outline-none"
                min="0"
                disabled={isRunning}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-300 mb-1">Ms</label>
              <input
                type="number"
                value={breakMilliseconds}
                onChange={(e) => setBreakMilliseconds(Math.max(0, Math.min(999, parseInt(e.target.value) || 0)))}
                className="w-full bg-gray-900/50 border border-gray-700 text-white px-2 py-1 rounded text-sm focus:border-lime-500/50 focus:outline-none"
                min="0"
                max="999"
                disabled={isRunning}
              />
            </div>
          </div>
          <button
            onClick={setBreakTimer}
            className="w-full bg-lime-500/20 hover:bg-lime-500/30 border border-lime-500/30 text-lime-400 text-sm py-1 rounded transition-all"
            disabled={isRunning}
          >
            Set Break Timer
          </button>
        </div>
        
        {/* Control Buttons */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <button
            onClick={startTimer}
            className={`bg-gradient-to-r from-lime-500 to-lime-600 hover:from-lime-600 hover:to-lime-700 text-gray-900 font-medium px-4 py-2 rounded-lg transition-all shadow-lg shadow-lime-500/20 ${isRunning || !hasTimeLeft() ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={isRunning || !hasTimeLeft()}
          >
            Start
          </button>
          <button
            onClick={pauseTimer}
            className={`bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-gray-900 font-medium px-4 py-2 rounded-lg transition-all shadow-lg ${!isRunning ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={!isRunning}
          >
            Pause
          </button>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={resetCurrentTimer}
            className="bg-gray-700/60 hover:bg-gray-700/80 text-white px-4 py-2 rounded-lg transition-all border border-gray-600/50"
          >
            Reset Current
          </button>
          <button
            onClick={resetAll}
            className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 px-4 py-2 rounded-lg transition-all"
          >
            Reset All
          </button>
        </div>
      </div>
      
      {/* Toast Notification */}
      {toast.show && (
        <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 py-2 px-4 rounded-lg z-50 shadow-lg backdrop-blur-sm
          ${toast.type === 'work' ? 'bg-lime-500/80 text-white' : 
            toast.type === 'break' ? 'bg-lime-500/80 text-white' : 
            'bg-lime-500/80 text-white'}`}
        >
          {toast.message}
        </div>
      )}
      
      {/* Audio for beep sound */}
      {/*<audio ref={beepRef} src="/beep.mp3" preload="auto" />*/}
    </div>
  )
}