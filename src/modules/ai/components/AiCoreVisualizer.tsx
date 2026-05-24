import { Canvas } from '@react-three/fiber'
import { PerspectiveCamera, Environment } from '@react-three/drei'
import { FlameCore } from './FlameCore'
import { ParticleField } from './ParticleField'

export function AiCoreVisualizer() {
  return (
    <div className="h-48 w-full relative overflow-hidden bg-gradient-to-b from-transparent via-black/20 to-transparent">
      <Canvas>
        <PerspectiveCamera makeDefault position={[0, 0, 3]} />
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        <FlameCore />
        <ParticleField />
        <Environment preset="city" />
      </Canvas>
      <div className="absolute bottom-3 inset-x-0 flex justify-center pointer-events-none">
        <div className="px-3 py-1 bg-black/50 backdrop-blur-md border border-white/10 rounded-full text-[10px] font-bold tracking-widest text-white/70 uppercase">
          AI Neural Core
        </div>
      </div>
    </div>
  )
}
