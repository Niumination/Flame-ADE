import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Float, MeshDistortMaterial, Sphere } from '@react-three/drei'
import * as THREE from 'three'
import { useChatStore } from '../store/chatStore'

export function FlameCore() {
  const meshRef = useRef<THREE.Mesh>(null)
  const isStreaming = useChatStore((s) => s.isStreaming)
  const sessions = useChatStore((s) => s.sessions)
  const activeSessionId = useChatStore((s) => s.activeSessionId)
  const activeSession = sessions.find((s) => s.id === activeSessionId)
  const hasMessages = (activeSession?.messages.length ?? 0) > 0

  const status = isStreaming ? 'streaming' : hasMessages ? 'thinking' : 'idle'

  useFrame((state) => {
    const t = state.clock.getElapsedTime()
    if (meshRef.current) {
      meshRef.current.rotation.x = t * 0.2
      meshRef.current.rotation.y = t * 0.3
      const scaleBase = status === 'streaming' ? 1.15 : 1.0
      const pulseSpeed = status === 'streaming' ? 10 : status === 'thinking' ? 4 : 2
      const pulse = scaleBase + Math.sin(t * pulseSpeed) * 0.04
      meshRef.current.scale.set(pulse, pulse, pulse)
    }
  })

  const color = useMemo(() => {
    if (status === 'streaming') return '#6366f1'
    if (status === 'thinking') return '#f97316'
    return '#4ade80'
  }, [status])

  return (
    <Float speed={4} rotationIntensity={1} floatIntensity={2}>
      <Sphere ref={meshRef} args={[1, 64, 64]}>
        <MeshDistortMaterial
          color={color}
          speed={status === 'streaming' ? 5 : 2}
          distort={0.4}
          radius={1}
          emissive={color}
          emissiveIntensity={status === 'streaming' ? 0.8 : 0.5}
          roughness={0.2}
          metalness={0.8}
        />
      </Sphere>
    </Float>
  )
}
