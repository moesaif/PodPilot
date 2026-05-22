import React from 'react'

interface LogoProps {
  size?: number
  className?: string
}

export function Logo({ size = 32, className }: LogoProps): React.ReactElement {
  const id = `logo-grad-${size}`
  const id2 = `logo-shine-${size}`

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id={id} x1="4" y1="4" x2="60" y2="60" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#60a5fa" />
          <stop offset="50%" stopColor="#818cf8" />
          <stop offset="100%" stopColor="#c084fc" />
        </linearGradient>
        <linearGradient id={id2} x1="8" y1="4" x2="32" y2="36" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="white" stopOpacity="0.22" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </linearGradient>
        <filter id={`logo-shadow-${size}`} x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="1" stdDeviation="2" floodColor="#3b82f6" floodOpacity="0.35" />
        </filter>
      </defs>

      {/* Hexagon body */}
      <path
        d="M32 3L60 19V45L32 61L4 45V19L32 3Z"
        fill={`url(#${id})`}
        filter={`url(#logo-shadow-${size})`}
      />

      {/* Inner shine */}
      <path
        d="M32 3L60 19V45L32 61L4 45V19L32 3Z"
        fill={`url(#${id2})`}
      />

      {/* Subtle hexagon border */}
      <path
        d="M32 3L60 19V45L32 61L4 45V19L32 3Z"
        stroke="white"
        strokeOpacity="0.12"
        strokeWidth="1"
        fill="none"
      />

      {/* Connection lines */}
      <line x1="32" y1="21" x2="19" y2="42" stroke="white" strokeWidth="2" strokeOpacity="0.35" strokeLinecap="round" />
      <line x1="32" y1="21" x2="45" y2="42" stroke="white" strokeWidth="2" strokeOpacity="0.35" strokeLinecap="round" />
      <line x1="19" y1="42" x2="45" y2="42" stroke="white" strokeWidth="2" strokeOpacity="0.35" strokeLinecap="round" />

      {/* Pod shadows (depth) */}
      <circle cx="32" cy="21" r="8" fill="black" fillOpacity="0.15" />
      <circle cx="19" cy="42" r="8" fill="black" fillOpacity="0.15" />
      <circle cx="45" cy="42" r="8" fill="black" fillOpacity="0.15" />

      {/* Pod circles */}
      <circle cx="32" cy="21" r="7.5" fill="white" fillOpacity="0.96" />
      <circle cx="19" cy="42" r="7.5" fill="white" fillOpacity="0.96" />
      <circle cx="45" cy="42" r="7.5" fill="white" fillOpacity="0.96" />

      {/* Pod cores — colored gradient dots */}
      <circle cx="32" cy="21" r="3.2" fill="#3b82f6" />
      <circle cx="19" cy="42" r="3.2" fill="#818cf8" />
      <circle cx="45" cy="42" r="3.2" fill="#a855f7" />

      {/* Pod core highlights */}
      <circle cx="30.8" cy="19.8" r="1.2" fill="white" fillOpacity="0.6" />
      <circle cx="17.8" cy="40.8" r="1.2" fill="white" fillOpacity="0.6" />
      <circle cx="43.8" cy="40.8" r="1.2" fill="white" fillOpacity="0.6" />
    </svg>
  )
}
