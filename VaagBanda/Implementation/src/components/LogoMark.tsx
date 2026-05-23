import React from 'react'
import Svg, { Path, Rect, Circle, G, Defs, LinearGradient, Stop } from 'react-native-svg'

const CRIMSON = '#DC143C'
const BLUE = '#2E5A88'
const WHITE = '#FFFFFF'

interface Props { size?: number }

export default function LogoMark({ size = 80 }: Props) {
  const stroke = Math.max(2, size * 0.025)
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        <LinearGradient id="frameGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <Stop offset="0%" stopColor={CRIMSON} />
          <Stop offset="100%" stopColor={BLUE} />
        </LinearGradient>
      </Defs>
      <G stroke={CRIMSON} strokeWidth={stroke} fill="none" strokeLinecap="round">
        <Path d="M 8 16 L 8 8 L 16 8" />
        <Path d="M 84 8 L 92 8 L 92 16" />
      </G>
      <G stroke={BLUE} strokeWidth={stroke} fill="none" strokeLinecap="round">
        <Path d="M 8 84 L 8 92 L 16 92" />
        <Path d="M 84 92 L 92 92 L 92 84" />
      </G>
      <Rect x="18" y="18" width="64" height="64" rx="10" fill="none" stroke="url(#frameGrad)" strokeWidth={stroke * 0.85} />
      <G fill={CRIMSON}>
        <Rect x="24" y="24" width="13" height="13" rx="2" />
        <Rect x="27" y="27" width="7" height="7" rx="1" fill={WHITE} />
        <Rect x="29" y="29" width="3" height="3" fill={CRIMSON} />
      </G>
      <G fill={BLUE}>
        <Rect x="63" y="24" width="13" height="13" rx="2" />
        <Rect x="66" y="27" width="7" height="7" rx="1" fill={WHITE} />
        <Rect x="68" y="29" width="3" height="3" fill={BLUE} />
      </G>
      <G fill={BLUE}>
        <Rect x="24" y="63" width="13" height="13" rx="2" />
        <Rect x="27" y="66" width="7" height="7" rx="1" fill={WHITE} />
        <Rect x="29" y="68" width="3" height="3" fill={BLUE} />
      </G>
      <Circle cx="44" cy="26" r="1.2" fill={CRIMSON} />
      <Circle cx="48" cy="26" r="1.2" fill={CRIMSON} />
      <Circle cx="54" cy="26" r="1.2" fill={BLUE} />
      <Circle cx="58" cy="26" r="1.2" fill={BLUE} />
      <Circle cx="44" cy="74" r="1.2" fill={CRIMSON} />
      <Circle cx="48" cy="74" r="1.2" fill={BLUE} />
      <Circle cx="54" cy="74" r="1.2" fill={BLUE} />
      <Circle cx="58" cy="74" r="1.2" fill={BLUE} />
      <Path d="M 35 42 L 41 42 L 50 64 L 50 70 L 47 70 L 44 64 L 38 50 Z" fill={CRIMSON} />
      <Path d="M 50 64 L 50 70 L 53 70 L 53 64 L 51 60 Z" fill={CRIMSON} opacity="0.9" />
      <Path d="M 56 42 L 60 42 L 70 51 L 60 51 L 60 53 L 71 65 L 60 65 L 56 65 Z" fill={BLUE} />
    </Svg>
  )
}
