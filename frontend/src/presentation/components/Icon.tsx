import { ICONS, type IconPart } from '../../infrastructure/icons'

interface Props {
  name: string
  size?: number
  color?: string
  strokeWidth?: number
}

// Render icon từ ICONS map — tái tạo đúng hàm render icon của prototype.
export default function Icon({ name, size = 18, color = 'currentColor', strokeWidth = 2 }: Props) {
  const parts = ICONS[name]
  if (!parts) return null
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {parts.map((p: IconPart, i) => {
        if (typeof p === 'string') return <path key={i} d={p} />
        const [kind, ...n] = p
        if (kind === 'l') return <line key={i} x1={n[0]} y1={n[1]} x2={n[2]} y2={n[3]} />
        if (kind === 'r')
          return <rect key={i} x={n[0]} y={n[1]} width={n[2]} height={n[3]} rx={n[4] as number} />
        if (kind === 'c') return <circle key={i} cx={n[0]} cy={n[1]} r={n[2]} />
        return null
      })}
    </svg>
  )
}
