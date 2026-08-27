'use client';

import React from 'react';

export type LogoVariant = 'full' | 'header' | 'icon' | 'badge';

interface ReadBuddyLogoProps {
  variant?: LogoVariant;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showTagline?: boolean;
  className?: string;
  onClick?: () => void;
}

/**
 * ReadBuddy Official Brand Logo (Soft-Neobrutalism Academic Edition)
 * Clean, symmetrical vector mark featuring:
 * - Hardcover reading ledger with cream open pages
 * - Cute chibi scholar bookworm with graduation mortarboard & gold spectacles
 * - Crisp typography in Fraunces serif & Space Mono
 */
export function ReadBuddyLogo({
  variant = 'header',
  size = 'md',
  showTagline = true,
  className = '',
  onClick,
}: ReadBuddyLogoProps) {
  const iconSizes = {
    sm: 32,
    md: 42,
    lg: 56,
    xl: 72,
  };

  const titleSizes = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-3xl',
  };

  const iconDim = iconSizes[size] || 42;

  /* ─── 1. Vector Icon: Premium Scholar Book & Chibi Mascot ─── */
  const LogoIcon = (
    <div
      className="relative shrink-0 flex items-center justify-center transition-transform duration-150 group-hover:scale-105"
      style={{ width: iconDim, height: iconDim }}
    >
      <svg
        viewBox="0 0 100 100"
        width="100%"
        height="100%"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="overflow-visible drop-shadow-[2.5px_2.5px_0px_#133326]"
      >
        <defs>
          <radialGradient id="badgeEmerald" cx="50%" cy="35%" r="60%">
            <stop offset="0%" stopColor="#2F7A53" />
            <stop offset="70%" stopColor="#1F4D3A" />
            <stop offset="100%" stopColor="#133326" />
          </radialGradient>

          <linearGradient id="logoWormSkin" x1="30" y1="20" x2="70" y2="70" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#48C768" />
            <stop offset="60%" stopColor="#2E9E4A" />
            <stop offset="100%" stopColor="#1E7A36" />
          </linearGradient>

          <linearGradient id="logoGlassesGold" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FFD369" />
            <stop offset="100%" stopColor="#E8873A" />
          </linearGradient>

          <linearGradient id="logoBookBase" x1="10" y1="60" x2="90" y2="90" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#3D6B8A" />
            <stop offset="100%" stopColor="#1E3E54" />
          </linearGradient>
        </defs>

        {/* ─── Circular Badge Backing (Dark Emerald) ─── */}
        <circle cx="50" cy="50" r="46" fill="url(#badgeEmerald)" stroke="#133326" strokeWidth="3.5" />
        <circle cx="50" cy="50" r="41.5" stroke="#E8873A" strokeWidth="1.5" opacity="0.5" strokeDasharray="4 3" />

        {/* ─── Chibi Scholar Bookworm Body ─── */}
        {/* Curled back tail */}
        <circle cx="68" cy="54" r="8" fill="url(#logoWormSkin)" stroke="#133326" strokeWidth="2" />
        <circle cx="73" cy="48" r="5" fill="#48C768" stroke="#133326" strokeWidth="1.8" />

        {/* Upright Chest */}
        <circle cx="50" cy="56" r="13" fill="url(#logoWormSkin)" stroke="#133326" strokeWidth="2.5" />
        <ellipse cx="50" cy="59" rx="7.5" ry="5" fill="#FFFDF8" stroke="#133326" strokeWidth="1.5" />

        {/* Red Bowtie */}
        <g transform="translate(50, 52)">
          <path d="M0 0 C-4 -3 -6 -2 -7 1 C-6 4 -3 3 0 0 Z" fill="#E83A50" stroke="#133326" strokeWidth="1.2" />
          <path d="M0 0 C4 -3 6 -2 7 1 C6 4 3 3 0 0 Z" fill="#E83A50" stroke="#133326" strokeWidth="1.2" />
          <circle cx="0" cy="0" r="1.8" fill="#A81C2D" stroke="#133326" strokeWidth="1" />
        </g>

        {/* Chibi Head */}
        <circle cx="50" cy="34" r="16" fill="url(#logoWormSkin)" stroke="#133326" strokeWidth="2.5" />
        <ellipse cx="50" cy="28" rx="8" ry="4" fill="#5ED179" opacity="0.5" />

        {/* Cheeks */}
        <circle cx="38" cy="38" r="3.2" fill="#FFAAA6" opacity="0.8" />
        <circle cx="62" cy="38" r="3.2" fill="#FFAAA6" opacity="0.8" />

        {/* Smile */}
        <path d="M46 38 Q50 42 54 38" stroke="#133326" strokeWidth="1.8" strokeLinecap="round" fill="none" />

        {/* Round Eyes & Gold Glasses */}
        {/* Left Eye & Lens */}
        <circle cx="43" cy="32" r="5" fill="#FFFFFF" stroke="#133326" strokeWidth="1.5" />
        <circle cx="43.5" cy="32.5" r="2.8" fill="#133326" />
        <circle cx="42.5" cy="31.5" r="1" fill="#FFFFFF" />
        <circle cx="43" cy="32" r="6.8" fill="none" stroke="url(#logoGlassesGold)" strokeWidth="2" />

        {/* Right Eye & Lens */}
        <circle cx="57" cy="32" r="5" fill="#FFFFFF" stroke="#133326" strokeWidth="1.5" />
        <circle cx="56.5" cy="32.5" r="2.8" fill="#133326" />
        <circle cx="55.5" cy="31.5" r="1" fill="#FFFFFF" />
        <circle cx="57" cy="32" r="6.8" fill="none" stroke="url(#logoGlassesGold)" strokeWidth="2" />

        {/* Glasses Bridge */}
        <path d="M49 32 Q50 30 51 32" stroke="url(#logoGlassesGold)" strokeWidth="2" strokeLinecap="round" fill="none" />

        {/* Mini Graduation Cap on Top */}
        <g transform="translate(50, 19)">
          <path d="M-8 2 C-8 6 8 6 8 2 Z" fill="#133326" stroke="#133326" strokeWidth="1" />
          <path d="M0 -6 L15 0 L0 5 L-15 0 Z" fill="#1F4D3A" stroke="#133326" strokeWidth="1.8" />
          <circle cx="0" cy="-1" r="1.5" fill="#E8873A" />
          <path d="M0 -1 Q8 1 10 6" stroke="#E8873A" strokeWidth="1.2" fill="none" />
        </g>

        {/* ─── Open Storybook Pedestal at Base ─── */}
        <g transform="translate(14, 64)">
          {/* Base Book Cover */}
          <path
            d="M6 14 C26 9 36 12 36 12 C36 12 46 9 66 14 L68 18 C46 13 36 16 36 16 C36 16 26 13 4 18 Z"
            fill="url(#logoBookBase)"
            stroke="#133326"
            strokeWidth="2"
          />
          {/* Left Page */}
          <path
            d="M6 12 C24 8 35 10 35 12 L35 16 C35 16 24 12 6 16 Z"
            fill="#FFFDF8"
            stroke="#133326"
            strokeWidth="1.5"
          />
          {/* Right Page */}
          <path
            d="M37 12 C48 8 66 12 66 12 L66 16 C48 12 37 16 37 16 Z"
            fill="#FFFDF8"
            stroke="#133326"
            strokeWidth="1.5"
          />
          {/* Ribbon Bookmark */}
          <path d="M34 12 L34 21 L36 19 L38 21 L38 12 Z" fill="#E8873A" stroke="#9C4B0E" strokeWidth="1" />
        </g>
      </svg>
    </div>
  );

  /* ─── Just the Icon ─── */
  if (variant === 'icon') {
    return (
      <div className={`inline-flex items-center ${className}`} onClick={onClick}>
        {LogoIcon}
      </div>
    );
  }

  /* ─── Full Stacked Logo (for Landing & Auth) ─── */
  if (variant === 'full') {
    return (
      <div
        className={`inline-flex flex-col items-center text-center group cursor-pointer ${className}`}
        onClick={onClick}
      >
        <div className="mb-2.5">{LogoIcon}</div>
        <div className="flex items-center gap-2">
          <h1
            className={`font-serif font-bold text-[#1F4D3A] tracking-tight ${titleSizes[size]}`}
            style={{ fontFamily: "'Fraunces', serif" }}
          >
            ReadBuddy
          </h1>
          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-[#FCEDDE] text-[#9C4B0E] border border-[#F0C99A]">
            AI
          </span>
        </div>
        {showTagline && (
          <p
            className="text-xs text-[#2B2621]/75 font-sans mt-1 font-medium"
            style={{ fontFamily: "'Figtree', sans-serif" }}
          >
            AI-Powered Reading Comprehension Assistant • SMCC
          </p>
        )}
      </div>
    );
  }

  /* ─── Badge Card Variant ─── */
  if (variant === 'badge') {
    return (
      <div
        className={`inline-flex items-center gap-3 px-3.5 py-2 rounded-2xl bg-[#FFFDF8] border-2 border-[#1F4D3A] shadow-[3.5px_3.5px_0px_#1F4D3A] group cursor-pointer transition-all hover:-translate-y-0.5 ${className}`}
        onClick={onClick}
      >
        {LogoIcon}
        <div>
          <div className="flex items-center gap-1.5">
            <span
              className="font-serif font-bold text-[#1F4D3A] text-base leading-tight"
              style={{ fontFamily: "'Fraunces', serif" }}
            >
              ReadBuddy
            </span>
            <span className="text-[9px] font-mono font-bold px-1 py-0.2 rounded bg-[#E6F4EA] text-[#1F693D] border border-[#2E7D4F]">
              SMCC
            </span>
          </div>
          <span className="text-[10px] text-gray-500 font-sans block">
            Basic Education Reading Studio
          </span>
        </div>
      </div>
    );
  }

  /* ─── Header / Horizontal Variant (Default for Topbar & Sidebar) ─── */
  return (
    <div
      className={`inline-flex items-center gap-2.5 group cursor-pointer ${className}`}
      onClick={onClick}
    >
      {LogoIcon}
      <div className="flex flex-col text-left">
        <div className="flex items-center gap-1.5 leading-none">
          <span
            className={`font-serif font-bold text-[#FFFDF8] tracking-tight ${titleSizes[size]}`}
            style={{ fontFamily: "'Fraunces', serif" }}
          >
            ReadBuddy
          </span>
        </div>
        <span
          className="text-[10px] font-mono font-bold text-[#E8873A] tracking-wider mt-0.5 uppercase"
          style={{ fontFamily: "'Space Mono', monospace" }}
        >
          SMCC READING STUDIO
        </span>
      </div>
    </div>
  );
}
export default ReadBuddyLogo;
