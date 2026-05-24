export function FlameLogo({ size = 6 }: { size?: number }) {
  return (
    <div
      className={`w-${size} h-${size} bg-gradient-to-tr from-orange-500 to-indigo-600 rounded-lg rotate-45 shadow-[0_0_15px_rgba(249,115,22,0.4)]`}
    />
  )
}
