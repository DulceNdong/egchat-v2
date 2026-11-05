import React from 'react';
import Svg, { Circle, Path, Text as SvgText } from 'react-native-svg';

export function CemacLogo({ size = 80 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Circle cx="50" cy="50" r="48" fill="#F5C518" stroke="#fff" strokeWidth="2" />
      <Circle cx="50" cy="50" r="44" fill="#E8B400" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8" />
      <Path
        d="M44 18C40 18 36 20 34 24C32 28 33 32 31 35C29 38 26 39 25 43C24 47 26 51 25 55C24 59 21 62 22 66C23 70 27 72 30 75C33 78 35 82 39 84C43 86 47 85 50 83C53 81 55 78 58 76C61 74 65 74 67 71C69 68 68 64 69 60C70 56 73 53 73 49C73 45 70 42 70 38C70 34 72 30 70 27C68 24 64 23 61 22C58 21 55 19 52 18C49 17 47 18 44 18Z"
        fill="#2d6a2d"
        stroke="#1a4a1a"
        strokeWidth="0.8"
      />
      <Path d="M50 36L52 45L61 43L54 49L61 55L52 53L50 62L48 53L39 55L46 49L39 43L48 45Z" fill="#fff" />
      <SvgText x="50" y="90" textAnchor="middle" fontSize="9" fontWeight="900" fill="#003d22" letterSpacing="2">
        CEMAC
      </SvgText>
    </Svg>
  );
}
