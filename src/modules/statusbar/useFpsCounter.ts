import { useState, useEffect, useRef } from 'react'

export function useFpsCounter() {
  const [fps, setFps] = useState(0)
  const framesRef = useRef(0)
  const lastTimeRef = useRef(performance.now())
  const rafRef = useRef<number>(0)

  useEffect(() => {
    const loop = () => {
      framesRef.current++
      const now = performance.now()
      const delta = now - lastTimeRef.current
      if (delta >= 1000) {
        setFps(Math.round((framesRef.current * 1000) / delta))
        framesRef.current = 0
        lastTimeRef.current = now
      }
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  return fps
}
