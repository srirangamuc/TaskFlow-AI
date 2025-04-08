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
    <div className="absolute top-4 right-6 bg-white shadow-xl rounded-xl p-4 w-96 border border-gray-300 z-40">
      <h3 className="text-lg font-bold text-center mb-2">🍅 Pomodoro Timer</h3>
      
      {/* Current Mode Display */}
      <div className={`text-center text-sm mb-1 font-medium ${isWorkMode ? 'text-red-600' : 'text-green-600'}`}>
        {isWorkMode ? '🖥️ WORK MODE' : '☕ BREAK MODE'} 
        {cycles > 0 && ` - Cycles Completed: ${cycles}`}
      </div>
      
      {/* Timer Display */}
      <div className={`text-2xl font-mono text-center mb-3 p-2 rounded-lg border-2 ${
        isWorkMode ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'
      }`}>
        {formatTime()}
      </div>
      
      {/* Work Timer Settings */}
      <div className="mb-4">
        <h4 className="font-medium text-red-600 mb-1 text-center text-sm">Work Timer</h4>
        <div className="grid grid-cols-4 gap-1 mb-2 text-sm">
          <div>
            <label className="block text-xs">Hours</label>
            <input
              type="number"
              value={workHours}
              onChange={(e) => setWorkHours(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-full border px-2 py-1 rounded text-sm"
              min="0"
              disabled={isRunning}
            />
          </div>
          <div>
            <label className="block text-xs">Minutes</label>
            <input
              type="number"
              value={workMinutes}
              onChange={(e) => setWorkMinutes(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-full border px-2 py-1 rounded text-sm"
              min="0"
              disabled={isRunning}
            />
          </div>
          <div>
            <label className="block text-xs">Seconds</label>
            <input
              type="number"
              value={workSeconds}
              onChange={(e) => setWorkSeconds(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-full border px-2 py-1 rounded text-sm"
              min="0"
              disabled={isRunning}
            />
          </div>
          <div>
            <label className="block text-xs">Ms</label>
            <input
              type="number"
              value={workMilliseconds}
              onChange={(e) => setWorkMilliseconds(Math.max(0, Math.min(999, parseInt(e.target.value) || 0)))}
              className="w-full border px-2 py-1 rounded text-sm"
              min="0"
              max="999"
              disabled={isRunning}
            />
          </div>
        </div>
        <button
          onClick={setWorkTimer}
          className="w-full bg-red-500 hover:bg-red-600 text-white text-xs py-1 rounded"
          disabled={isRunning}
        >
          Set Work Timer
        </button>
      </div>
      
      {/* Break Timer Settings */}
      <div className="mb-4">
        <h4 className="font-medium text-green-600 mb-1 text-center text-sm">Break Timer</h4>
        <div className="grid grid-cols-4 gap-1 mb-2 text-sm">
          <div>
            <label className="block text-xs">Hours</label>
            <input
              type="number"
              value={breakHours}
              onChange={(e) => setBreakHours(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-full border px-2 py-1 rounded text-sm"
              min="0"
              disabled={isRunning}
            />
          </div>
          <div>
            <label className="block text-xs">Minutes</label>
            <input
              type="number"
              value={breakMinutes}
              onChange={(e) => setBreakMinutes(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-full border px-2 py-1 rounded text-sm"
              min="0"
              disabled={isRunning}
            />
          </div>
          <div>
            <label className="block text-xs">Seconds</label>
            <input
              type="number"
              value={breakSeconds}
              onChange={(e) => setBreakSeconds(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-full border px-2 py-1 rounded text-sm"
              min="0"
              disabled={isRunning}
            />
          </div>
          <div>
            <label className="block text-xs">Ms</label>
            <input
              type="number"
              value={breakMilliseconds}
              onChange={(e) => setBreakMilliseconds(Math.max(0, Math.min(999, parseInt(e.target.value) || 0)))}
              className="w-full border px-2 py-1 rounded text-sm"
              min="0"
              max="999"
              disabled={isRunning}
            />
          </div>
        </div>
        <button
          onClick={setBreakTimer}
          className="w-full bg-green-500 hover:bg-green-600 text-white text-xs py-1 rounded"
          disabled={isRunning}
        >
          Set Break Timer
        </button>
      </div>
      
      {/* Control Buttons */}
      <div className="grid grid-cols-2 gap-2 mb-2">
        <button
          onClick={startTimer}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          disabled={isRunning || !hasTimeLeft()}
        >
          Start
        </button>
        <button
          onClick={pauseTimer}
          className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded"
          disabled={!isRunning}
        >
          Pause
        </button>
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={resetCurrentTimer}
          className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
        >
          Reset Current
        </button>
        <button
          onClick={resetAll}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
        >
          Reset All
        </button>
      </div>
      
      {/* Toast Notification */}
      {toast.show && (
        <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 py-2 px-4 rounded-lg z-50 shadow-lg 
          ${toast.type === 'work' ? 'bg-red-500 text-white' : 
            toast.type === 'break' ? 'bg-green-500 text-white' : 
            'bg-blue-500 text-white'}`}
        >
          {toast.message}
        </div>
      )}
      
      {/* Audio for beep sound */}
      {/*<audio ref={beepRef} src="/beep.mp3" preload="auto" />*/}
    </div>
  )
}