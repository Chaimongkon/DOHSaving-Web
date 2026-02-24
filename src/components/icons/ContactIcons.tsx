import React from 'react';

interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
}

export const MapPinIcon = ({ size = 48, ...props }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <defs>
      <linearGradient id="pinGrad" x1="12" y1="6" x2="52" y2="48" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FF9F43" />
        <stop offset="1" stopColor="#E8652B" />
      </linearGradient>
      <filter id="pinShadow" x="-10" y="-10" width="84" height="84" filterUnits="userSpaceOnUse">
        <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#E8652B" floodOpacity="0.4" />
      </filter>
    </defs>
    <path d="M32 58C32 58 14 40 14 24C14 14.0589 22.0589 6 32 6C41.9411 6 50 14.0589 50 24C50 40 32 58 32 58Z" fill="url(#pinGrad)" filter="url(#pinShadow)" />
    <circle cx="32" cy="24" r="9" fill="#FFF" opacity="0.9" />
    <path d="M24 16C28 12 34 12 38 14" stroke="white" strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />
  </svg>
);

export const ClockIcon = ({ size = 48, ...props }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <defs>
      <linearGradient id="clockGrad" x1="8" y1="8" x2="56" y2="56" gradientUnits="userSpaceOnUse">
        <stop stopColor="#2ECC71" />
        <stop offset="1" stopColor="#16A34A" />
      </linearGradient>
      <filter id="clockShadow" x="-10" y="-10" width="84" height="84" filterUnits="userSpaceOnUse">
        <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#16A34A" floodOpacity="0.4" />
      </filter>
    </defs>
    <circle cx="32" cy="32" r="24" fill="url(#clockGrad)" filter="url(#clockShadow)" />
    <circle cx="32" cy="32" r="16" fill="white" opacity="0.95" />
    <path d="M32 20V32L40 38" stroke="#16A34A" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="32" cy="32" r="3.5" fill="#16A34A" />
    <path d="M20 18C24 14 30 12 36 13" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
  </svg>
);

export const PhoneIcon = ({ size = 48, ...props }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <defs>
      <linearGradient id="phoneGrad" x1="10" y1="10" x2="54" y2="54" gradientUnits="userSpaceOnUse">
        <stop stopColor="#54A0FF" />
        <stop offset="1" stopColor="#0369A1" />
      </linearGradient>
      <filter id="phoneShadow" x="-10" y="-10" width="84" height="84" filterUnits="userSpaceOnUse">
        <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#0369A1" floodOpacity="0.4" />
      </filter>
    </defs>
    <circle cx="32" cy="32" r="24" fill="url(#phoneGrad)" filter="url(#phoneShadow)" />
    <path d="M42.48 37.04L37.8 35.48C36.6 35.08 35.28 35.44 34.64 36.44L33.08 38.88C28.84 36.64 25.36 33.16 23.12 28.92L25.56 27.36C26.56 26.72 26.92 25.4 26.52 24.2L24.96 19.52C24.44 18.08 22.84 17.28 21.36 17.68L17.84 18.6C16.2 19.04 15 20.6 15 22.36C15 37.6 26.4 50 41.64 50C43.4 50 44.96 48.8 45.4 47.16L46.32 43.64C46.72 42.16 45.92 40.56 44.48 40.04" fill="white" />
    <path d="M20 18C24 14 30 12 36 13" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
  </svg>
);

export const MailIcon = ({ size = 48, ...props }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <defs>
      <linearGradient id="mailGrad" x1="12" y1="16" x2="52" y2="48" gradientUnits="userSpaceOnUse">
        <stop stopColor="#A29BFE" />
        <stop offset="1" stopColor="#7C3AED" />
      </linearGradient>
      <filter id="mailShadow" x="-10" y="-10" width="84" height="84" filterUnits="userSpaceOnUse">
        <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#7C3AED" floodOpacity="0.4" />
      </filter>
    </defs>
    <rect x="10" y="16" width="44" height="32" rx="6" fill="url(#mailGrad)" filter="url(#mailShadow)" />
    <path d="M12 20L32 34L52 20" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />
    <path d="M14 20C18 16 24 16 32 16C40 16 46 16 50 20" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.3" />
  </svg>
);

export const UsersIcon = ({ size = 48, ...props }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <defs>
      <linearGradient id="usersGrad" x1="8" y1="12" x2="56" y2="52" gradientUnits="userSpaceOnUse">
        <stop stopColor="#48DBFB" />
        <stop offset="1" stopColor="#0984E3" />
      </linearGradient>
      <filter id="usersShadow" x="-10" y="-10" width="84" height="84" filterUnits="userSpaceOnUse">
        <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#0984E3" floodOpacity="0.4" />
      </filter>
    </defs>
    <circle cx="32" cy="32" r="24" fill="url(#usersGrad)" filter="url(#usersShadow)" />
    <path d="M32 28C35.3137 28 38 25.3137 38 22C38 18.6863 35.3137 16 32 16C28.6863 16 26 18.6863 26 22C26 25.3137 28.6863 28 32 28Z" fill="white" />
    <path d="M42 44C42 38.4772 37.5228 34 32 34C26.4772 34 22 38.4772 22 44V46H42V44Z" fill="white" />
    <path d="M44 26C46.2091 26 48 24.2091 48 22C48 19.7909 46.2091 18 44 18C41.7909 18 40 19.7909 40 22C40 24.2091 41.7909 26 44 26Z" fill="white" opacity="0.7" />
    <path d="M50 42C50 37.5817 46.4183 34 42 34V46H50V42Z" fill="white" opacity="0.7" />
    <path d="M20 26C22.2091 26 24 24.2091 24 22C24 19.7909 22.2091 18 20 18C17.7909 18 16 19.7909 16 22C16 24.2091 17.7909 26 20 26Z" fill="white" opacity="0.7" />
    <path d="M22 34C17.5817 34 14 37.5817 14 42V46H22V34Z" fill="white" opacity="0.7" />
    <path d="M20 18C24 14 30 12 36 13" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.3" />
  </svg>
);

export const BankIcon = ({ size = 48, ...props }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <defs>
      <linearGradient id="bankGrad" x1="10" y1="12" x2="54" y2="52" gradientUnits="userSpaceOnUse">
        <stop stopColor="#F368E0" />
        <stop offset="1" stopColor="#9B59B6" />
      </linearGradient>
      <filter id="bankShadow" x="-10" y="-10" width="84" height="84" filterUnits="userSpaceOnUse">
        <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#9B59B6" floodOpacity="0.4" />
      </filter>
    </defs>
    <rect x="8" y="12" width="48" height="40" rx="8" fill="url(#bankGrad)" filter="url(#bankShadow)" />
    <path d="M32 18L16 26H48L32 18Z" fill="white" />
    <rect x="20" y="30" width="4" height="12" fill="white" />
    <rect x="30" y="30" width="4" height="12" fill="white" />
    <rect x="40" y="30" width="4" height="12" fill="white" />
    <rect x="16" y="44" width="32" height="4" fill="white" />
    <path d="M16 18C20 14 26 14 32 14C38 14 44 14 48 18" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.3" />
  </svg>
);

export const ComplaintIcon = ({ size = 48, ...props }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <defs>
      <linearGradient id="compGrad" x1="10" y1="10" x2="54" y2="54" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FF7675" />
        <stop offset="1" stopColor="#D63031" />
      </linearGradient>
      <filter id="compShadow" x="-10" y="-10" width="84" height="84" filterUnits="userSpaceOnUse">
        <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#D63031" floodOpacity="0.4" />
      </filter>
    </defs>
    <path d="M32 6C17.64 6 6 16.745 6 30C6 37.89 9.87 44.91 15.86 49.33L14 58L24.16 54.21C26.65 54.73 29.28 55 32 55C46.36 55 58 44.255 58 31C58 17.745 46.36 6 32 6Z" fill="url(#compGrad)" filter="url(#compShadow)" />
    <circle cx="32" cy="38" r="3.5" fill="white" />
    <rect x="29" y="18" width="6" height="14" rx="3" fill="white" />
    <path d="M18 14C22 10 28 8 34 9" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.3" />
  </svg>
);

export const NavigateIcon = ({ size = 48, ...props }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <defs>
      <linearGradient id="navGrad" x1="12" y1="12" x2="52" y2="52" gradientUnits="userSpaceOnUse">
        <stop stopColor="#00CEC9" />
        <stop offset="1" stopColor="#00B894" />
      </linearGradient>
      <filter id="navShadow" x="-10" y="-10" width="84" height="84" filterUnits="userSpaceOnUse">
        <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#00B894" floodOpacity="0.4" />
      </filter>
    </defs>
    <circle cx="32" cy="32" r="24" fill="url(#navGrad)" filter="url(#navShadow)" />
    <path d="M44 20L20 28L30 34L36 44L44 20Z" fill="white" />
    <path d="M44 20L30 34" stroke="#00B894" strokeWidth="2" strokeLinecap="round" />
    <path d="M20 18C24 14 30 12 36 13" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
  </svg>
);

export const CarIcon = ({ size = 48, ...props }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <defs>
      <linearGradient id="carGrad" x1="10" y1="12" x2="54" y2="52" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FF7675" />
        <stop offset="1" stopColor="#D63031" />
      </linearGradient>
      <filter id="carShadow" x="-10" y="-10" width="84" height="84" filterUnits="userSpaceOnUse">
        <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#D63031" floodOpacity="0.4" />
      </filter>
    </defs>
    <rect x="8" y="24" width="48" height="24" rx="8" fill="url(#carGrad)" filter="url(#carShadow)" />
    <path d="M14 24L20 14H44L50 24" fill="url(#carGrad)" />
    <path d="M22 16H42L46 24H18L22 16Z" fill="#FFF" opacity="0.9" />
    <circle cx="20" cy="48" r="6" fill="#333" />
    <circle cx="20" cy="48" r="3" fill="#FFF" />
    <circle cx="44" cy="48" r="6" fill="#333" />
    <circle cx="44" cy="48" r="3" fill="#FFF" />
    <rect x="12" y="32" width="8" height="4" rx="2" fill="#FFF" opacity="0.6" />
    <rect x="44" y="32" width="8" height="4" rx="2" fill="#FFF" opacity="0.6" />
  </svg>
);

export const TrainIcon = ({ size = 48, ...props }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <defs>
      <linearGradient id="trainGrad" x1="12" y1="8" x2="52" y2="56" gradientUnits="userSpaceOnUse">
        <stop stopColor="#55EFC4" />
        <stop offset="1" stopColor="#00B894" />
      </linearGradient>
      <filter id="trainShadow" x="-10" y="-10" width="84" height="84" filterUnits="userSpaceOnUse">
        <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#00B894" floodOpacity="0.4" />
      </filter>
    </defs>
    <rect x="14" y="8" width="36" height="44" rx="10" fill="url(#trainGrad)" filter="url(#trainShadow)" />
    <rect x="20" y="16" width="24" height="16" rx="4" fill="#FFF" opacity="0.9" />
    <circle cx="24" cy="40" r="4" fill="#FFF" opacity="0.8" />
    <circle cx="40" cy="40" r="4" fill="#FFF" opacity="0.8" />
    <path d="M32 40L32 48" stroke="#FFF" strokeWidth="3" strokeLinecap="round" opacity="0.6" />
    <path d="M24 56L20 62" stroke="#00B894" strokeWidth="4" strokeLinecap="round" />
    <path d="M40 56L44 62" stroke="#00B894" strokeWidth="4" strokeLinecap="round" />
  </svg>
);

export const BusIcon = ({ size = 48, ...props }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <defs>
      <linearGradient id="busGrad" x1="10" y1="10" x2="54" y2="54" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FAB1A0" />
        <stop offset="1" stopColor="#E17055" />
      </linearGradient>
      <filter id="busShadow" x="-10" y="-10" width="84" height="84" filterUnits="userSpaceOnUse">
        <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#E17055" floodOpacity="0.4" />
      </filter>
    </defs>
    <rect x="12" y="12" width="40" height="36" rx="8" fill="url(#busGrad)" filter="url(#busShadow)" />
    <rect x="16" y="18" width="32" height="14" rx="4" fill="#FFF" opacity="0.9" />
    <rect x="18" y="38" width="6" height="4" rx="2" fill="#FFF" opacity="0.7" />
    <rect x="40" y="38" width="6" height="4" rx="2" fill="#FFF" opacity="0.7" />
    <path d="M20 48V52C20 54.2091 18.2091 56 16 56C13.7909 56 12 54.2091 12 52V48H20Z" fill="#333" />
    <path d="M52 48V52C52 54.2091 50.2091 56 48 56C45.7909 56 44 54.2091 44 52V48H52Z" fill="#333" />
    <path d="M12 26H52" stroke="url(#busGrad)" strokeWidth="2" />
  </svg>
);

export const TaxiIcon = ({ size = 48, ...props }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <defs>
      <linearGradient id="taxiGrad" x1="10" y1="12" x2="54" y2="52" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FDCB6E" />
        <stop offset="1" stopColor="#E17055" />
      </linearGradient>
      <filter id="taxiShadow" x="-10" y="-10" width="84" height="84" filterUnits="userSpaceOnUse">
        <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#E17055" floodOpacity="0.4" />
      </filter>
    </defs>
    <rect x="8" y="24" width="48" height="24" rx="8" fill="url(#taxiGrad)" filter="url(#taxiShadow)" />
    <path d="M14 24L20 14H44L50 24" fill="url(#taxiGrad)" />
    <rect x="24" y="10" width="16" height="6" rx="2" fill="#FFF" opacity="0.9" />
    <path d="M22 18H42L46 24H18L22 18Z" fill="#FFF" opacity="0.9" />
    <circle cx="20" cy="48" r="6" fill="#333" />
    <circle cx="20" cy="48" r="3" fill="#FFF" />
    <circle cx="44" cy="48" r="6" fill="#333" />
    <circle cx="44" cy="48" r="3" fill="#FFF" />
    <rect x="12" y="32" width="8" height="4" rx="2" fill="#FFF" opacity="0.6" />
    <rect x="44" y="32" width="8" height="4" rx="2" fill="#FFF" opacity="0.6" />
  </svg>
);
