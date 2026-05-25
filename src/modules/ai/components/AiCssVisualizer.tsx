export function AiCssVisualizer({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className="relative flex-shrink-0 overflow-hidden border-b border-white/[0.07]"
      style={{
        height: compact ? 80 : 120,
        background: 'radial-gradient(ellipse at center, rgba(108,124,255,0.08) 0%, rgba(255,106,0,0.05) 60%, transparent 100%)',
      }}
    >
      <div className="absolute inset-0 overflow-hidden">
        {[
          { t: '20%', l: '15%', d: '3.5s', y: '0s', c: '#ff6a00' },
          { t: '60%', l: '75%', d: '4.2s', y: '0.5s', c: '#6c7cff' },
          { t: '40%', l: '30%', d: '5s', y: '1s', c: '#ffd080' },
          { t: '70%', l: '50%', d: '3.8s', y: '1.5s', c: '#3b82f6' },
          { t: '25%', l: '65%', d: '4.5s', y: '0.8s', c: '#ff9f45' },
          { t: '80%', l: '20%', d: '3.2s', y: '0.3s', c: '#6c7cff' },
          { t: '10%', l: '85%', d: '5.5s', y: '2s', c: '#ff9f45' },
          { t: '50%', l: '90%', d: '4s', y: '0.2s', c: '#ffd080' },
        ].map((p, i) => (
          <span
            key={i}
            className="absolute rounded-full"
            style={{
              top: p.t,
              left: p.l,
              width: 2,
              height: 2,
              background: p.c,
              opacity: 0.5,
              animation: `cssParticleFloat ${p.d} ease-in-out infinite`,
              animationDelay: p.y,
            }}
          />
        ))}
      </div>

      <div
        className="absolute"
        style={{
          width: compact ? 44 : 64,
          height: compact ? 44 : 64,
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          borderRadius: '50%',
          background: 'conic-gradient(from 0deg, #ff6a00, #6c7cff, #ff9f45, #ff6a00)',
          boxShadow: '0 0 30px rgba(255,106,0,0.4), 0 0 60px rgba(108,124,255,0.2)',
          animation: 'cssSphereSpin 6s linear infinite, cssSpherePulse 3s ease-in-out infinite',
          zIndex: 2,
        }}
      />

      <div
        className="absolute bottom-1.5 left-1/2 flex -translate-x-1/2 items-center gap-1.5 whitespace-nowrap text-[9px] uppercase tracking-widest text-[#22c55e]"
      >
        <span
          className="h-1 w-1 rounded-full bg-[#22c55e]"
          style={{ boxShadow: '0 0 6px #22c55e', animation: 'cssPulse 2s infinite' }}
        />
        AI READY
      </div>
    </div>
  )
}
