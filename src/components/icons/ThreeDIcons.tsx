import React from 'react';

interface IconProps {
    size?: number;
    className?: string;
}

export const Book3D: React.FC<IconProps> = ({ size = 64, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="book-front" x1="30" y1="20" x2="90" y2="85" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#60A5FA" />
                <stop offset="100%" stopColor="#1E40AF" />
            </linearGradient>
            <linearGradient id="book-side" x1="15" y1="25" x2="30" y2="85" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#3B82F6" />
                <stop offset="100%" stopColor="#1E3A8A" />
            </linearGradient>
            <linearGradient id="book-pages" x1="25" y1="80" x2="85" y2="85" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#F8FAFC" />
                <stop offset="100%" stopColor="#94A3B8" />
            </linearGradient>
            <filter id="shadow-book" x="0" y="0" width="120" height="120" filterUnits="userSpaceOnUse">
                <feDropShadow dx="-4" dy="6" stdDeviation="4" floodColor="#0F172A" floodOpacity="0.4" />
                <feDropShadow dx="0" dy="15" stdDeviation="15" floodColor="#1D4ED8" floodOpacity="0.3" />
            </filter>
        </defs>
        <g filter="url(#shadow-book)">
            {/* Pages bottom */}
            <path d="M15 90 L30 85 L90 85 L75 90 Z" fill="url(#book-pages)" />
            {/* Cover Spine */}
            <path d="M15 25 L30 20 L30 85 L15 90 Z" fill="url(#book-side)" />
            {/* Cover Front */}
            <path d="M30 20 L90 20 L90 85 L30 85 Z" fill="url(#book-front)" />
            {/* Book details/Text lines */}
            <path d="M48 40 L75 40" stroke="#BFDBFE" strokeWidth="4" strokeLinecap="round" />
            <path d="M48 55 L70 55" stroke="#BFDBFE" strokeWidth="4" strokeLinecap="round" />
            <path d="M48 70 L60 70" stroke="#BFDBFE" strokeWidth="4" strokeLinecap="round" />

            {/* Golden Bookmark */}
            <path d="M68 20 L68 45 L74 40 L80 45 L80 20 Z" fill="#FBBF24" />
        </g>
    </svg>
);

export const Scales3D: React.FC<IconProps> = ({ size = 64, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="scale-gold" x1="10" y1="10" x2="90" y2="90" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#FDE68A" />
                <stop offset="50%" stopColor="#F59E0B" />
                <stop offset="100%" stopColor="#92400E" />
            </linearGradient>
            <linearGradient id="scale-silver" x1="50" y1="20" x2="50" y2="90" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#F8FAFC" />
                <stop offset="100%" stopColor="#94A3B8" />
            </linearGradient>
            <filter id="shadow-scale" x="-10" y="-10" width="120" height="120" filterUnits="userSpaceOnUse">
                <feDropShadow dx="0" dy="8" stdDeviation="6" floodColor="#92400E" floodOpacity="0.5" />
            </filter>
            <filter id="glow-scale" x="-20" y="-20" width="140" height="140" filterUnits="userSpaceOnUse">
                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                </feMerge>
            </filter>
        </defs>
        <g filter="url(#shadow-scale)">
            {/* Base */}
            <path d="M30 85 L70 85 L65 75 L35 75 Z" fill="url(#scale-gold)" />
            <path d="M20 92 L80 92 L75 85 L25 85 Z" fill="url(#scale-gold)" />
            {/* Main Pillar */}
            <rect x="46" y="25" width="8" height="50" rx="3" fill="url(#scale-gold)" />
            {/* Top beam */}
            <path d="M20 30 C35 25 65 25 80 30 L80 25 C65 20 35 20 20 25 Z" fill="url(#scale-gold)" />
            {/* Left string & pan */}
            <path d="M25 30 L15 55 L35 55 Z" stroke="url(#scale-silver)" strokeWidth="1.5" strokeLinejoin="round" fill="none" />
            <path d="M10 55 C10 65 40 65 40 55 Z" fill="url(#scale-silver)" />
            {/* Right string & pan */}
            <path d="M75 30 L65 55 L85 55 Z" stroke="url(#scale-silver)" strokeWidth="1.5" strokeLinejoin="round" fill="none" />
            <path d="M60 55 C60 65 90 65 90 55 Z" fill="url(#scale-silver)" />
            {/* Top Cap */}
            <circle cx="50" cy="18" r="6" fill="url(#scale-gold)" />
            <circle cx="50" cy="18" r="3" fill="#FEF3C7" />
        </g>
    </svg>
);

export const Bell3D: React.FC<IconProps> = ({ size = 64, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="bell-main" x1="30" y1="15" x2="70" y2="75" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#A855F7" />
                <stop offset="100%" stopColor="#6D28D9" />
            </linearGradient>
            <linearGradient id="bell-rim" x1="15" y1="75" x2="85" y2="75" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#9333EA" />
                <stop offset="100%" stopColor="#4C1D95" />
            </linearGradient>
            <linearGradient id="bell-clapper" x1="40" y1="80" x2="60" y2="95" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#FDE68A" />
                <stop offset="100%" stopColor="#D97706" />
            </linearGradient>
            <filter id="shadow-bell" x="-15" y="-10" width="130" height="130" filterUnits="userSpaceOnUse">
                <feDropShadow dx="0" dy="10" stdDeviation="8" floodColor="#4C1D95" floodOpacity="0.5" />
            </filter>
            <filter id="glow" x="-20" y="-20" width="140" height="140" filterUnits="userSpaceOnUse">
                <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                </feMerge>
            </filter>
        </defs>
        <g filter="url(#shadow-bell)">
            {/* Clapper */}
            <circle cx="50" cy="85" r="10" fill="url(#bell-clapper)" />
            {/* Bell Rim */}
            <path d="M15 75 C15 70 25 70 50 70 C75 70 85 70 85 75 C85 80 75 85 50 85 C25 85 15 80 15 75 Z" fill="url(#bell-rim)" />
            {/* Bell Body */}
            <path d="M50 15 C35 15 25 35 25 50 C25 60 20 70 20 75 C20 75 40 75 50 75 C60 75 80 75 80 75 C80 75 75 60 75 50 C75 35 65 15 50 15 Z" fill="url(#bell-main)" />
            {/* Highlight Line */}
            <path d="M35 30 C30 40 28 50 28 60" stroke="#DDD6FE" strokeWidth="4" strokeLinecap="round" opacity="0.4" />
            {/* Top Handle */}
            <path d="M45 15 C45 10 55 10 55 15" stroke="url(#bell-main)" strokeWidth="6" strokeLinecap="round" />

            <circle cx="82" cy="24" r="3" fill="#FEF2F2" />
        </g>
    </svg>
);

export const Users3D: React.FC<IconProps> = ({ size = 64, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="user-blue" x1="20" y1="20" x2="80" y2="80" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#38BDF8" />
                <stop offset="100%" stopColor="#0284C7" />
            </linearGradient>
            <linearGradient id="user-teal" x1="50" y1="20" x2="90" y2="90" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#2DD4BF" />
                <stop offset="100%" stopColor="#0F766E" />
            </linearGradient>
            <filter id="shadow-users" x="-10" y="-10" width="120" height="120" filterUnits="userSpaceOnUse">
                <feDropShadow dx="0" dy="8" stdDeviation="6" floodColor="#0284C7" floodOpacity="0.4" />
            </filter>
        </defs>
        <g filter="url(#shadow-users)">
            <circle cx="65" cy="35" r="16" fill="url(#user-teal)" />
            <path d="M45 80 C45 60 85 60 85 80 Z" fill="url(#user-teal)" />
            <circle cx="40" cy="45" r="18" fill="url(#user-blue)" />
            <path d="M15 90 C15 65 65 65 65 90 Z" fill="url(#user-blue)" />
        </g>
    </svg>
);

export const Wallet3D: React.FC<IconProps> = ({ size = 64, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="wallet-green" x1="10" y1="20" x2="90" y2="80" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#4ADE80" />
                <stop offset="100%" stopColor="#16A34A" />
            </linearGradient>
            <linearGradient id="wallet-dark" x1="20" y1="30" x2="80" y2="80" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#22C55E" />
                <stop offset="100%" stopColor="#14532D" />
            </linearGradient>
            <linearGradient id="cash" x1="30" y1="10" x2="70" y2="50" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#A7F3D0" />
                <stop offset="100%" stopColor="#34D399" />
            </linearGradient>
            <filter id="shadow-wallet" x="-10" y="-10" width="120" height="120" filterUnits="userSpaceOnUse">
                <feDropShadow dx="0" dy="8" stdDeviation="6" floodColor="#16A34A" floodOpacity="0.4" />
            </filter>
        </defs>
        <g filter="url(#shadow-wallet)">
            <path d="M15 35 L85 35 L85 75 C85 80 80 85 75 85 L25 85 C20 85 15 80 15 75 Z" fill="url(#wallet-dark)" />
            <rect x="25" y="20" width="50" height="40" rx="4" fill="url(#cash)" />
            <circle cx="50" cy="40" r="10" fill="#10B981" opacity="0.3" />
            <path d="M15 45 L85 45 L85 75 C85 80 80 85 75 85 L25 85 C20 85 15 80 15 75 Z" fill="url(#wallet-green)" />
            <rect x="70" y="40" width="15" height="20" rx="4" fill="url(#wallet-dark)" />
            <circle cx="77.5" cy="50" r="3" fill="#FBBF24" />
        </g>
    </svg>
);

export const HandCoins3D: React.FC<IconProps> = ({ size = 64, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="hand" x1="10" y1="50" x2="70" y2="90" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#FDBA74" />
                <stop offset="100%" stopColor="#EA580C" />
            </linearGradient>
            <linearGradient id="coin" x1="30" y1="10" x2="70" y2="50" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#FDE047" />
                <stop offset="100%" stopColor="#CA8A04" />
            </linearGradient>
            <filter id="shadow-hand" x="-10" y="-10" width="120" height="120" filterUnits="userSpaceOnUse">
                <feDropShadow dx="0" dy="8" stdDeviation="6" floodColor="#EA580C" floodOpacity="0.4" />
            </filter>
        </defs>
        <g filter="url(#shadow-hand)">
            <circle cx="50" cy="35" r="16" fill="url(#coin)" />
            <circle cx="50" cy="35" r="10" fill="#EAB308" />
            <circle cx="65" cy="20" r="12" fill="url(#coin)" />
            <circle cx="65" cy="20" r="7" fill="#EAB308" />
            <path d="M15 70 C15 50 35 60 45 60 L75 60 C80 60 85 65 85 70 C85 75 80 80 75 80 L60 80 C60 85 55 90 50 90 L25 90 C20 90 15 80 15 70 Z" fill="url(#hand)" />
            <path d="M25 60 C35 50 45 45 50 50 C55 55 45 65 40 65" fill="#C2410C" opacity="0.3" />
        </g>
    </svg>
);

export const HeartGift3D: React.FC<IconProps> = ({ size = 64, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="heart" x1="10" y1="20" x2="90" y2="80" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#C084FC" />
                <stop offset="100%" stopColor="#7E22CE" />
            </linearGradient>
            <filter id="shadow-heart" x="-10" y="-10" width="120" height="120" filterUnits="userSpaceOnUse">
                <feDropShadow dx="0" dy="8" stdDeviation="6" floodColor="#7E22CE" floodOpacity="0.4" />
            </filter>
        </defs>
        <g filter="url(#shadow-heart)">
            <path d="M50 85 C50 85 15 55 15 35 C15 20 30 15 40 25 C45 30 50 35 50 35 C50 35 55 30 60 25 C70 15 85 20 85 35 C85 55 50 85 50 85 Z" fill="url(#heart)" />
            <path d="M25 35 C25 25 35 23 40 30" stroke="#E9D5FF" strokeWidth="4" strokeLinecap="round" opacity="0.5" />
            <path d="M43 50 L57 50 M50 43 L50 57" stroke="#F3E8FF" strokeWidth="6" strokeLinecap="round" />
        </g>
    </svg>
);

export const Complaint3D: React.FC<IconProps> = ({ size = 64, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="doc-bg" x1="20" y1="10" x2="80" y2="90" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#F8FAFC" />
                <stop offset="100%" stopColor="#CBD5E1" />
            </linearGradient>
            <linearGradient id="warning" x1="30" y1="30" x2="70" y2="70" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#F87171" />
                <stop offset="100%" stopColor="#B91C1C" />
            </linearGradient>
            <filter id="shadow-complaint" x="-10" y="-10" width="120" height="120" filterUnits="userSpaceOnUse">
                <feDropShadow dx="-4" dy="6" stdDeviation="4" floodColor="#0F172A" floodOpacity="0.2" />
            </filter>
        </defs>
        <g filter="url(#shadow-complaint)">
            <path d="M25 15 L60 15 L75 30 L75 85 C75 90 70 95 65 95 L25 95 C20 95 15 90 15 85 L15 25 C15 20 20 15 25 15 Z" fill="url(#doc-bg)" />
            <path d="M60 15 L60 30 L75 30 Z" fill="#94A3B8" />
            <path d="M50 45 L65 70 L35 70 Z" fill="url(#warning)" />
            <rect x="48" y="52" width="4" height="8" rx="2" fill="#FEF2F2" />
            <circle cx="50" cy="65" r="2.5" fill="#FEF2F2" />
        </g>
    </svg>
);

export const Certificate3D: React.FC<IconProps> = ({ size = 64, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="cert-cyan" x1="20" y1="20" x2="80" y2="80" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#22D3EE" />
                <stop offset="100%" stopColor="#0891B2" />
            </linearGradient>
            <linearGradient id="ribbon" x1="50" y1="60" x2="80" y2="90" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#FDE047" />
                <stop offset="100%" stopColor="#CA8A04" />
            </linearGradient>
            <filter id="shadow-cert" x="-10" y="-10" width="120" height="120" filterUnits="userSpaceOnUse">
                <feDropShadow dx="0" dy="8" stdDeviation="6" floodColor="#0891B2" floodOpacity="0.3" />
            </filter>
        </defs>
        <g filter="url(#shadow-cert)">
            <rect x="15" y="25" width="70" height="50" rx="4" fill="#F8FAFC" />
            <rect x="15" y="25" width="70" height="50" rx="4" fill="url(#cert-cyan)" opacity="0.1" />
            <rect x="20" y="30" width="60" height="40" rx="2" stroke="url(#cert-cyan)" strokeWidth="2" fill="none" />
            <path d="M30 45 L50 45 M30 55 L45 55" stroke="#CBD5E1" strokeWidth="3" strokeLinecap="round" />
            <path d="M70 65 L65 90 L75 85 L85 90 L80 65 Z" fill="url(#ribbon)" />
            <circle cx="75" cy="55" r="12" fill="url(#cert-cyan)" />
            <circle cx="75" cy="55" r="8" fill="#ECFEFF" />
        </g>
    </svg>
);

export const Shield3D: React.FC<IconProps> = ({ size = 64, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="shield-pink" x1="20" y1="10" x2="80" y2="90" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#F472B6" />
                <stop offset="100%" stopColor="#BE185D" />
            </linearGradient>
            <linearGradient id="shield-silver" x1="30" y1="30" x2="70" y2="70" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#FDF2F8" />
                <stop offset="100%" stopColor="#FBCFE8" />
            </linearGradient>
            <filter id="shadow-shield" x="-10" y="-10" width="120" height="120" filterUnits="userSpaceOnUse">
                <feDropShadow dx="0" dy="8" stdDeviation="6" floodColor="#BE185D" floodOpacity="0.4" />
            </filter>
        </defs>
        <g filter="url(#shadow-shield)">
            <path d="M50 15 L20 25 C20 55 30 75 50 90 C70 75 80 55 80 25 L50 15 Z" fill="url(#shield-pink)" />
            <path d="M50 25 L30 32 C30 55 38 68 50 80 C62 68 70 55 70 32 L50 25 Z" fill="url(#shield-silver)" />
            <path d="M42 50 L48 56 L60 42" stroke="#BE185D" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M50 15 C50 15 28 22 25 35" stroke="#FCE7F3" strokeWidth="3" strokeLinecap="round" opacity="0.6" />
        </g>
    </svg>
);

export const Folder3D: React.FC<IconProps> = ({ size = 64, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="folder-back" x1="10" y1="20" x2="90" y2="80" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#94A3B8" />
                <stop offset="100%" stopColor="#475569" />
            </linearGradient>
            <linearGradient id="folder-front" x1="10" y1="40" x2="90" y2="90" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#CBD5E1" />
                <stop offset="100%" stopColor="#64748B" />
            </linearGradient>
            <filter id="shadow-folder" x="-10" y="-10" width="120" height="120" filterUnits="userSpaceOnUse">
                <feDropShadow dx="-4" dy="8" stdDeviation="6" floodColor="#334155" floodOpacity="0.3" />
            </filter>
        </defs>
        <g filter="url(#shadow-folder)">
            <path d="M15 30 C15 25 20 20 25 20 L45 20 L55 30 L80 30 C85 30 90 35 90 40 L90 80 C90 85 85 90 80 90 L15 90 Z" fill="url(#folder-back)" />
            <rect x="25" y="30" width="50" height="50" rx="2" fill="#F8FAFC" />
            <path d="M35 45 L65 45 M35 55 L55 55" stroke="#E2E8F0" strokeWidth="4" strokeLinecap="round" />
        </g>
    </svg>
);

export const PiggyBank3D: React.FC<IconProps> = ({ size = 64, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="pig-pink" x1="20" y1="20" x2="80" y2="80" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#F472B6" />
                <stop offset="100%" stopColor="#BE185D" />
            </linearGradient>
            <linearGradient id="pig-ear" x1="30" y1="30" x2="60" y2="60" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#FBCFE8" />
                <stop offset="100%" stopColor="#DB2777" />
            </linearGradient>
            <linearGradient id="coin-gold" x1="45" y1="5" x2="65" y2="35" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#FDE047" />
                <stop offset="100%" stopColor="#CA8A04" />
            </linearGradient>
            <filter id="shadow-pig" x="-10" y="-10" width="120" height="120" filterUnits="userSpaceOnUse">
                <feDropShadow dx="-2" dy="8" stdDeviation="6" floodColor="#BE185D" floodOpacity="0.4" />
            </filter>
        </defs>
        <g filter="url(#shadow-pig)">
            {/* Legs */}
            <rect x="30" y="70" width="12" height="15" rx="4" fill="url(#pig-pink)" />
            <rect x="65" y="70" width="12" height="15" rx="4" fill="url(#pig-pink)" />
            {/* Body */}
            <path d="M20 50 C20 30 40 25 55 25 C75 25 85 40 85 60 C85 75 70 80 50 80 C30 80 20 70 20 50 Z" fill="url(#pig-pink)" />
            {/* Snout */}
            <circle cx="20" cy="55" r="10" fill="url(#pig-ear)" />
            <circle cx="17" cy="55" r="2" fill="#BE185D" />
            <circle cx="23" cy="55" r="2" fill="#BE185D" />
            {/* Ear */}
            <path d="M40 25 L35 15 C35 15 45 15 50 25 Z" fill="url(#pig-ear)" />
            <path d="M70 30 L80 15 C80 15 85 20 80 30 Z" fill="url(#pig-ear)" />
            {/* Coin Slot text & Coin */}
            <circle cx="55" cy="20" r="12" fill="url(#coin-gold)" />
            <circle cx="55" cy="20" r="8" fill="#EAB308" />
            <rect x="52" y="15" width="6" height="10" rx="1" fill="#CA8A04" />
            <path d="M45 28 C50 32 60 32 65 28" stroke="#DB2777" strokeWidth="3" strokeLinecap="round" />
        </g>
    </svg>
);

export const CoinsStack3D: React.FC<IconProps> = ({ size = 64, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="stack-gold" x1="10" y1="20" x2="90" y2="80" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#FDE047" />
                <stop offset="100%" stopColor="#B45309" />
            </linearGradient>
            <linearGradient id="stack-top" x1="20" y1="10" x2="80" y2="40" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#FEF08A" />
                <stop offset="100%" stopColor="#EAB308" />
            </linearGradient>
            <filter id="shadow-stack" x="-10" y="-10" width="120" height="120" filterUnits="userSpaceOnUse">
                <feDropShadow dx="-2" dy="8" stdDeviation="6" floodColor="#B45309" floodOpacity="0.4" />
            </filter>
        </defs>
        <g filter="url(#shadow-stack)">
            {/* Bottom Coin */}
            <ellipse cx="50" cy="80" rx="35" ry="12" fill="url(#stack-gold)" />
            <path d="M15 80 L15 70 C15 76 30 82 50 82 C70 82 85 76 85 70 L85 80 C85 86 70 92 50 92 C30 92 15 86 15 80 Z" fill="url(#stack-gold)" />

            {/* Middle Coin */}
            <ellipse cx="50" cy="65" rx="35" ry="12" fill="url(#stack-gold)" />
            <path d="M15 65 L15 55 C15 61 30 67 50 67 C70 67 85 61 85 55 L85 65 C85 71 70 77 50 77 C30 77 15 71 15 65 Z" fill="url(#stack-gold)" />

            {/* Top Coin */}
            <ellipse cx="50" cy="50" rx="35" ry="12" fill="url(#stack-top)" />
            <path d="M15 50 L15 40 C15 46 30 52 50 52 C70 52 85 46 85 40 L85 50 C85 56 70 62 50 62 C30 62 15 56 15 50 Z" fill="url(#stack-gold)" />

            {/* Standing Coin */}
            <circle cx="50" cy="25" r="20" fill="url(#stack-top)" />
            <circle cx="50" cy="25" r="14" fill="#EAB308" />
            <circle cx="50" cy="25" r="10" fill="url(#stack-top)" />
        </g>
    </svg>
);

export const HomeLoan3D: React.FC<IconProps> = ({ size = 64, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="home-roof" x1="20" y1="10" x2="80" y2="50" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#FB923C" />
                <stop offset="100%" stopColor="#C2410C" />
            </linearGradient>
            <linearGradient id="home-wall" x1="30" y1="40" x2="70" y2="80" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#FFEDD5" />
                <stop offset="100%" stopColor="#FDBA74" />
            </linearGradient>
            <linearGradient id="coin-gold2" x1="50" y1="45" x2="75" y2="70" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#FDE047" />
                <stop offset="100%" stopColor="#B45309" />
            </linearGradient>
            <filter id="shadow-home" x="-10" y="-10" width="120" height="120" filterUnits="userSpaceOnUse">
                <feDropShadow dx="-2" dy="6" stdDeviation="5" floodColor="#C2410C" floodOpacity="0.3" />
            </filter>
            <filter id="shadow-coin" x="-5" y="-5" width="110" height="110" filterUnits="userSpaceOnUse">
                <feDropShadow dx="2" dy="2" stdDeviation="3" floodColor="#B45309" floodOpacity="0.5" />
            </filter>
        </defs>
        <g filter="url(#shadow-home)">
            {/* House Wall */}
            <path d="M25 45 L75 45 L75 85 L25 85 Z" fill="url(#home-wall)" />
            {/* Door */}
            <path d="M40 85 L40 60 C40 55 60 55 60 60 L60 85 Z" fill="#EA580C" opacity="0.8" />
            <circle cx="55" cy="72" r="2" fill="#FFEDD5" />

            {/* Roof */}
            <path d="M15 45 L50 15 L85 45 L75 45 L50 25 L25 45 Z" fill="url(#home-roof)" />
            <path d="M50 15 L85 45 L75 45 L50 25 Z" fill="#9A3412" opacity="0.4" />

            {/* Chimney */}
            <path d="M65 35 L65 20 L75 20 L75 45 Z" fill="url(#home-roof)" />
        </g>

        {/* Floating Coin overlapping */}
        <g filter="url(#shadow-coin)">
            <circle cx="70" cy="70" r="16" fill="url(#coin-gold2)" />
            <circle cx="70" cy="70" r="11" fill="#FEF08A" />
            <path d="M68 64 C72 64 74 67 74 70 C74 73 72 76 68 76 M68 62 L68 78 M71 62 L71 78" stroke="#B45309" strokeWidth="1.5" strokeLinecap="round" />
        </g>
    </svg>
);

export const Phone3D: React.FC<IconProps> = ({ size = 64, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="phone-body" x1="20" y1="10" x2="80" y2="90" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#818CF8" />  {/* Indigo 400 */}
                <stop offset="100%" stopColor="#4338CA" /> {/* Indigo 700 */}
            </linearGradient>
            <linearGradient id="phone-screen" x1="30" y1="20" x2="70" y2="80" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#E0E7FF" />  {/* Indigo 100 */}
                <stop offset="100%" stopColor="#A5B4FC" /> {/* Indigo 300 */}
            </linearGradient>
            <filter id="shadow-phone" x="-10" y="-10" width="120" height="120" filterUnits="userSpaceOnUse">
                <feDropShadow dx="0" dy="8" stdDeviation="6" floodColor="#4338CA" floodOpacity="0.3" />
            </filter>
        </defs>
        <g filter="url(#shadow-phone)">
            <rect x="25" y="10" width="50" height="80" rx="12" fill="url(#phone-body)" />
            <rect x="30" y="20" width="40" height="60" rx="4" fill="url(#phone-screen)" />
            {/* Screen reflection/details */}
            <path d="M30 40 L50 20" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" opacity="0.3" />
            <circle cx="50" cy="84" r="3" fill="#E0E7FF" />
            <rect x="42" y="14" width="16" height="2" rx="1" fill="#E0E7FF" />
        </g>
    </svg>
);

export const ShieldTick3D: React.FC<IconProps> = ({ size = 64, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="shield-body" x1="20" y1="10" x2="80" y2="90" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#34D399" /> {/* Emerald 400 */}
                <stop offset="100%" stopColor="#047857" /> {/* Emerald 700 */}
            </linearGradient>
            <filter id="shadow-shield-tick" x="-10" y="-10" width="120" height="120" filterUnits="userSpaceOnUse">
                <feDropShadow dx="0" dy="8" stdDeviation="6" floodColor="#047857" floodOpacity="0.3" />
            </filter>
        </defs>
        <g filter="url(#shadow-shield-tick)">
            <path d="M50 15 L20 25 C20 55 30 75 50 90 C70 75 80 55 80 25 L50 15 Z" fill="url(#shield-body)" />
            <path d="M50 25 L30 32 C30 55 38 68 50 80 C62 68 70 55 70 32 L50 25 Z" fill="#D1FAE5" /> {/* Emerald 100 */}
            <path d="M40 50 L47 57 L62 42" stroke="#059669" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" /> {/* Emerald 600 */}
        </g>
    </svg>
);

export const CloudBase3D: React.FC<IconProps> = ({ size = 64, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="cloud-grad" x1="10" y1="30" x2="90" y2="70" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#38BDF8" /> {/* Light Blue 400 */}
                <stop offset="100%" stopColor="#0284C7" /> {/* Light Blue 700 */}
            </linearGradient>
            <filter id="shadow-cloud" x="-10" y="-10" width="120" height="120" filterUnits="userSpaceOnUse">
                <feDropShadow dx="0" dy="8" stdDeviation="6" floodColor="#0284C7" floodOpacity="0.3" />
            </filter>
        </defs>
        <g filter="url(#shadow-cloud)">
            <path d="M70 45 C70 34 61 25 50 25 C42 25 35 30 32 37 C24 38 18 45 18 53 C18 63 26 71 36 71 L68 71 C78 71 86 63 86 53 C86 44 80 37 72 35 C72 38 70 42 70 45 Z" fill="url(#cloud-grad)" />
            <path d="M40 45 C35 45 31 50 31 55 C31 61 36 65 42 65 L65 65 C71 65 76 60 76 54 C76 49 72 45 67 44" stroke="#E0F2FE" strokeWidth="8" strokeLinecap="round" /> {/* Light Blue 100 */}
        </g>
    </svg>
);

export const CheckSquare3D: React.FC<IconProps> = ({ size = 64, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="check-grad" x1="20" y1="20" x2="80" y2="80" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#F472B6" /> {/* Pink 400 */}
                <stop offset="100%" stopColor="#BE185D" /> {/* Pink 700 */}
            </linearGradient>
            <filter id="shadow-check" x="-10" y="-10" width="120" height="120" filterUnits="userSpaceOnUse">
                <feDropShadow dx="0" dy="8" stdDeviation="6" floodColor="#BE185D" floodOpacity="0.3" />
            </filter>
        </defs>
        <g filter="url(#shadow-check)">
            <rect x="20" y="20" width="60" height="60" rx="16" fill="url(#check-grad)" />
            <rect x="28" y="28" width="44" height="44" rx="10" fill="#FCE7F3" /> {/* Pink 100 */}
            <path d="M38 52 L45 59 L62 42" stroke="#DB2777" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" /> {/* Pink 600 */}
        </g>
    </svg>
);
