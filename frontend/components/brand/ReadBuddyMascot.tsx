'use client';

import React, { useState, useEffect, useRef, ReactNode } from 'react';
import { Sparkles, HelpCircle, Zap, Flame, Heart } from 'lucide-react';

export type MascotMood = 'happy' | 'reading' | 'listening' | 'cheering' | 'thinking';

interface ReadBuddyMascotProps {
  mood?: MascotMood;
  size?: number;
  animated?: boolean;
  badgeFramed?: boolean;
  interactive?: boolean;
  soundEnabled?: boolean;
  onClick?: () => void;
  className?: string;
}

type EmotionalState =
  | 'idle'
  | 'sleeping'
  | 'curious'    // 1 click: Curious poke ("Huh?")
  | 'dizzy'      // 2 clicks: Confused & dizzy wobble ("Whoa?!")
  | 'angry'      // 3 clicks: Angry pout with steam puffs ("Hey! Stop poking!")
  | 'tantrum'    // 4+ clicks: Dramatic shock jump & fiery sparks
  | 'petting';   // Hover / Rub: Calms down, happy purr & hearts

interface ActionParticle {
  id: number;
  symbol: ReactNode;
  color: string;
  x: number;
  y: number;
}

// ─── Web Audio API Sound Synthesizer ───
function playEmotionSound(type: 'curious' | 'dizzy' | 'angry' | 'tantrum' | 'soothe' | 'wake') {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;

    if (type === 'curious') {
      // Gentle questioning upward chirp (G4 -> C5)
      osc.type = 'sine';
      osc.frequency.setValueAtTime(392, now);
      osc.frequency.exponentialRampToValueAtTime(523, now + 0.12);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.14);
      osc.start(now);
      osc.stop(now + 0.14);
    } else if (type === 'dizzy') {
      // Warbly confused wobble sound (Vibrato)
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.linearRampToValueAtTime(330, now + 0.08);
      osc.frequency.linearRampToValueAtTime(490, now + 0.16);
      osc.frequency.linearRampToValueAtTime(300, now + 0.24);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.28);
      osc.start(now);
      osc.stop(now + 0.28);
    } else if (type === 'angry') {
      // Low grumpy buzzer / stomp sound (Sawtooth drop)
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.linearRampToValueAtTime(140, now + 0.12);
      osc.frequency.linearRampToValueAtTime(110, now + 0.25);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.28);
      osc.start(now);
      osc.stop(now + 0.28);
    } else if (type === 'tantrum') {
      // High dramatic surprise screech / pop
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.2);
      gain.gain.setValueAtTime(0.14, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    } else if (type === 'soothe') {
      // Soft pleasant marimba chime (E5 -> G5)
      osc.type = 'sine';
      osc.frequency.setValueAtTime(659, now);
      osc.frequency.exponentialRampToValueAtTime(784, now + 0.18);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.005, now + 0.22);
      osc.start(now);
      osc.stop(now + 0.22);
    } else if (type === 'wake') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523, now);
      osc.frequency.exponentialRampToValueAtTime(1046, now + 0.14);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.16);
      osc.start(now);
      osc.stop(now + 0.16);
    }
  } catch (e) {}
}

/**
 * ReadBuddy Interactive Companion Mascot — "Buddy the Bookworm"
 * Features Multi-Click Emotional Escalation (Pou / Talking Tom style):
 * - Click 1: Curious tilt ("Huh?") with floating inquiry particles
 * - Click 2: Confused & dizzy wobble with swirly eyes & dizzy sparks
 * - Click 3: Grumpy angry pout with red cheeks & puffing steam
 * - Click 4+: Funny shock tantrum with comic fiery sparks
 * - Hover / Pet: Soothes him instantly with happy eyes and hearts
 * - Inactivity (6s): Sleeps peacefully with floating Zzz particles
 * - Cursor tracking: Smooth real-time eye tracking
 */
export function ReadBuddyMascot({
  mood = 'happy',
  size = 80,
  animated = true,
  badgeFramed = false,
  interactive = true,
  soundEnabled = true,
  onClick,
  className = '',
}: ReadBuddyMascotProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // States
  const [emotion, setEmotion] = useState<EmotionalState>('idle');
  const [clickStreak, setClickStreak] = useState(0);
  const [isBlinking, setIsBlinking] = useState(false);
  const [particles, setParticles] = useState<ActionParticle[]>([]);

  // Mouse tracking angles
  const [eyeOffset, setEyeOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [headRotation, setHeadRotation] = useState(0);

  const isSleeping = emotion === 'sleeping';

  // ─── 1. Idle Sleep Timer ───
  useEffect(() => {
    if (!interactive) return;

    let sleepTimer: NodeJS.Timeout;
    const IDLE_TIME_MS = 6000;

    function resetSleepTimer() {
      if (emotion === 'sleeping') {
        setEmotion('idle');
        setClickStreak(0);
        if (soundEnabled) playEmotionSound('wake');
      }
      clearTimeout(sleepTimer);
      sleepTimer = setTimeout(() => {
        setEmotion('sleeping');
        setClickStreak(0);
      }, IDLE_TIME_MS);
    }

    function handleMouseMove(e: MouseEvent) {
      resetSleepTimer();

      if (!containerRef.current || emotion === 'sleeping' || emotion === 'dizzy' || emotion === 'tantrum') return;

      const rect = containerRef.current.getBoundingClientRect();
      const mascotCenterX = rect.left + rect.width / 2;
      const mascotCenterY = rect.top + rect.height * 0.4;

      const deltaX = e.clientX - mascotCenterX;
      const deltaY = e.clientY - mascotCenterY;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      if (distance > 0) {
        const maxOffset = 3.5;
        const normalizedX = (deltaX / Math.max(distance, 100)) * maxOffset;
        const normalizedY = (deltaY / Math.max(distance, 100)) * maxOffset;
        setEyeOffset({ x: normalizedX, y: normalizedY });

        const tilt = Math.max(-3.5, Math.min(3.5, (deltaX / 350) * 3.5));
        setHeadRotation(tilt);
      }
    }

    function handleMouseLeave() {
      sleepTimer = setTimeout(() => {
        setEmotion('sleeping');
        setClickStreak(0);
      }, 3000);
    }

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('keydown', resetSleepTimer, { passive: true });

    sleepTimer = setTimeout(() => {
      setEmotion('sleeping');
    }, IDLE_TIME_MS);

    return () => {
      clearTimeout(sleepTimer);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('keydown', resetSleepTimer);
    };
  }, [interactive, emotion, soundEnabled]);

  // ─── 2. Natural Blinking (When awake and not dizzy) ───
  useEffect(() => {
    if (!animated || isSleeping || emotion === 'dizzy' || emotion === 'angry') return;

    const blinkInterval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 180);
    }, 3800 + Math.random() * 2200);

    return () => clearInterval(blinkInterval);
  }, [animated, isSleeping, emotion]);

  // ─── 3. Particle Emitter ───
  function spawnParticle(symbol: ReactNode, color: string) {
    const newP: ActionParticle = {
      id: Date.now() + Math.random(),
      symbol,
      color,
      x: (Math.random() - 0.5) * 36,
      y: -12 - Math.random() * 18,
    };
    setParticles((prev) => [...prev, newP]);

    setTimeout(() => {
      setParticles((prev) => prev.filter((p) => p.id !== newP.id));
    }, 1100);
  }

  // ─── 4. Multi-Click Escalation Engine (Pou / Tom Style) ───
  function handleClick() {
    // If sleeping, wake up on click
    if (emotion === 'sleeping') {
      setEmotion('idle');
      setClickStreak(0);
      if (soundEnabled) playEmotionSound('wake');
      spawnParticle(<Sparkles className="w-3.5 h-3.5" />, '#F5A623');
      if (onClick) onClick();
      return;
    }

    const nextStreak = clickStreak + 1;
    setClickStreak(nextStreak);

    if (nextStreak === 1) {
      // ─── 1st Click: Curious ("Huh?") ───
      setEmotion('curious');
      if (soundEnabled) playEmotionSound('curious');
      spawnParticle(<HelpCircle className="w-3.5 h-3.5" />, '#E8873A');

      setTimeout(() => {
        setEmotion((curr) => (curr === 'curious' ? 'idle' : curr));
      }, 1100);
    } else if (nextStreak === 2) {
      // ─── 2nd Click: Confused & Dizzy Wobble ───
      setEmotion('dizzy');
      if (soundEnabled) playEmotionSound('dizzy');
      spawnParticle(<Zap className="w-3.5 h-3.5" />, '#F5A623');
      spawnParticle(<HelpCircle className="w-3.5 h-3.5" />, '#E8873A');

      setTimeout(() => {
        setEmotion((curr) => (curr === 'dizzy' ? 'idle' : curr));
      }, 1500);
    } else if (nextStreak === 3) {
      // ─── 3rd Click: Angry Pout with Steam Puffs ───
      setEmotion('angry');
      if (soundEnabled) playEmotionSound('angry');
      spawnParticle(<Flame className="w-3.5 h-3.5" />, '#A8A29E');
      spawnParticle(<Flame className="w-3.5 h-3.5" />, '#E83A50');

      setTimeout(() => {
        setEmotion((curr) => (curr === 'angry' ? 'idle' : curr));
      }, 2000);
    } else {
      // ─── 4+ Clicks: Funny Tantrum & Shock Jump ───
      setEmotion('tantrum');
      if (soundEnabled) playEmotionSound('tantrum');
      spawnParticle(<Flame className="w-4 h-4" />, '#FF5722');
      spawnParticle(<Zap className="w-4 h-4" />, '#F5A623');

      setTimeout(() => {
        setEmotion('angry');
        setClickStreak(3); // drop down to angry
        setTimeout(() => {
          setEmotion('idle');
          setClickStreak(0);
        }, 2000);
      }, 900);
    }

    if (onClick) onClick();
  }

  // ─── 5. Hover / Pet to Soothe Him Down ───
  function handleMouseEnter() {
    if (emotion === 'sleeping') return;

    // Petting soothes any anger or dizziness immediately!
    setEmotion('petting');
    setClickStreak(0);
    if (soundEnabled) playEmotionSound('soothe');
    spawnParticle(<Heart className="w-3.5 h-3.5 fill-current" />, '#E83A50');
  }

  function handleMouseLeave() {
    if (emotion === 'petting') {
      setEmotion('idle');
    }
  }

  return (
    <div
      ref={containerRef}
      className={`relative inline-block select-none ${className}`}
      style={{
        width: size,
        height: size,
        filter: badgeFramed ? 'drop-shadow(0 6px 12px rgba(31,77,58,0.18))' : 'none',
      }}
    >
      {/* ─── Floating Action Particles ─── */}
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute text-sm pointer-events-none z-30 animate-ping font-bold"
          style={{
            transform: `translate(${p.x}px, ${p.y}px)`,
            color: p.color,
          }}
        >
          {p.symbol}
        </div>
      ))}

      {/* ─── Mascot SVG Character ─── */}
      <div
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="w-full h-full cursor-pointer transition-transform duration-200"
        style={{
          animation:
            emotion === 'tantrum'
              ? 'pou-tantrum 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)'
              : emotion === 'angry'
              ? 'pou-angry-stomp 0.4s ease-in-out infinite'
              : emotion === 'dizzy'
              ? 'pou-dizzy-wobble 0.35s ease-in-out infinite'
              : emotion === 'curious'
              ? 'pou-curious 0.6s ease-in-out'
              : isSleeping
              ? 'chibi-sleep 3.5s ease-in-out infinite'
              : animated
              ? 'chibi-float 3s ease-in-out infinite'
              : 'none',
          transform: isSleeping ? 'translateY(2px)' : `rotate(${headRotation}deg)`,
        }}
        title={
          isSleeping
            ? "Buddy is sleeping. Tap to wake him!"
            : emotion === 'angry'
            ? "Buddy is angry! Pet him to calm him down!"
            : emotion === 'dizzy'
            ? "Buddy is dizzy! Whoa!"
            : "Click to interact! Hover to pet!"
        }
      >
        <svg
          viewBox="0 0 160 160"
          width="100%"
          height="100%"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="overflow-visible"
        >
          <defs>
            <linearGradient id="chibiWormSkin" x1="40" y1="20" x2="120" y2="120" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor={emotion === 'angry' ? '#5AC26E' : '#48C768'} />
              <stop offset="50%" stopColor={emotion === 'angry' ? '#38A850' : '#2E9E4A'} />
              <stop offset="100%" stopColor={emotion === 'angry' ? '#208038' : '#1E7A36'} />
            </linearGradient>

            <linearGradient id="chibiBelly" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FFFDF8" />
              <stop offset="100%" stopColor="#F7E8C8" />
            </linearGradient>

            <linearGradient id="chibiGlasses" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#FFD369" />
              <stop offset="50%" stopColor="#E8873A" />
              <stop offset="100%" stopColor="#C46D18" />
            </linearGradient>

            <linearGradient id="chibiBowTie" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#FF6B7A" />
              <stop offset="100%" stopColor="#D12C42" />
            </linearGradient>

            <linearGradient id="chibiBookCover" x1="20" y1="110" x2="140" y2="155" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#3D6B8A" />
              <stop offset="100%" stopColor="#1D3D53" />
            </linearGradient>

            <linearGradient id="chibiCapGrad" x1="40" y1="10" x2="120" y2="35" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#2A6B4F" />
              <stop offset="100%" stopColor="#133326" />
            </linearGradient>
          </defs>

          <style>
            {`
              @keyframes chibi-float {
                0%, 100% { transform: translateY(0px); }
                50% { transform: translateY(-4px); }
              }
              @keyframes chibi-sleep {
                0%, 100% { transform: translateY(1px) scale(0.99); }
                50% { transform: translateY(3px) scale(1.01); }
              }
              @keyframes pou-curious {
                0% { transform: rotate(0deg); }
                50% { transform: rotate(-7deg) translateY(-3px); }
                100% { transform: rotate(0deg); }
              }
              @keyframes pou-dizzy-wobble {
                0%, 100% { transform: rotate(-6deg) scale(0.96, 1.04); }
                50% { transform: rotate(6deg) scale(1.04, 0.96); }
              }
              @keyframes pou-angry-stomp {
                0%, 100% { transform: translateY(0) scale(1.08, 0.94); }
                50% { transform: translateY(-4px) scale(0.96, 1.06); }
              }
              @keyframes pou-tantrum {
                0% { transform: translateY(0) scale(1); }
                30% { transform: translateY(-22px) rotate(-15deg) scale(1.2); }
                60% { transform: translateY(-16px) rotate(15deg) scale(1.15); }
                100% { transform: translateY(0) rotate(0deg) scale(1); }
              }
              @keyframes sleep-z-rise {
                0% { opacity: 0; transform: translate(0, 0) scale(0.6); }
                40% { opacity: 0.9; transform: translate(5px, -10px) scale(0.9); }
                80% { opacity: 0.8; transform: translate(12px, -20px) scale(1.1); }
                100% { opacity: 0; transform: translate(18px, -30px) scale(1.2); }
              }
              @keyframes steam-puff-left {
                0% { opacity: 0.9; transform: translate(0, 0) scale(0.7); }
                100% { opacity: 0; transform: translate(-12px, -14px) scale(1.3); }
              }
              @keyframes steam-puff-right {
                0% { opacity: 0.9; transform: translate(0, 0) scale(0.7); }
                100% { opacity: 0; transform: translate(12px, -14px) scale(1.3); }
              }
            `}
          </style>

          {/* ─── Ground Drop Shadow ─── */}
          <ellipse cx="80" cy="148" rx="46" ry="6.5" fill="#133326" opacity="0.16" />

          {/* ─── 1. Open Storybook Pedestal at Base ─── */}
          <g transform="translate(18, 118)">
            <path
              d="M10 20 C42 14 62 18 62 18 C62 18 82 14 114 20 L118 26 C82 20 62 24 62 24 C62 24 42 20 6 26 Z"
              fill="url(#chibiBookCover)"
              stroke="#133326"
              strokeWidth="2.5"
            />
            <path
              d="M10 18 C40 12 61 15 61 17 L61 23 C61 23 40 18 10 23 Z"
              fill="#FFFDF8"
              stroke="#133326"
              strokeWidth="2"
            />
            <path
              d="M63 17 C84 12 114 18 114 18 L114 23 C84 18 63 23 63 23 Z"
              fill="#FFFDF8"
              stroke="#133326"
              strokeWidth="2"
            />
            <path d="M59 17 L59 30 L62 27 L65 30 L65 17 Z" fill="#E8873A" stroke="#9C4B0E" strokeWidth="1.2" />
          </g>

          {/* ─── 2. Caterpillar Body Segments ─── */}
          <circle cx="114" cy="116" r="14" fill="url(#chibiWormSkin)" stroke="#133326" strokeWidth="3" />
          <circle cx="124" cy="106" r="10" fill="url(#chibiWormSkin)" stroke="#133326" strokeWidth="2.5" />
          <circle cx="129" cy="98" r="6" fill="#48C768" stroke="#133326" strokeWidth="2" />

          {/* Lower Body Segment */}
          <circle cx="80" cy="112" r="19" fill="url(#chibiWormSkin)" stroke="#133326" strokeWidth="3" />
          <ellipse cx="80" cy="116" rx="12" ry="9" fill="url(#chibiBelly)" stroke="#133326" strokeWidth="2" />

          {/* Upper Chest */}
          <circle cx="80" cy="94" r="18" fill="url(#chibiWormSkin)" stroke="#133326" strokeWidth="3" />
          <ellipse cx="80" cy="97" rx="10" ry="7" fill="url(#chibiBelly)" stroke="#133326" strokeWidth="1.8" />

          {/* ─── 3. Red Bowtie ─── */}
          <g transform="translate(80, 89)">
            <path d="M0 0 C-7 -5 -10 -3 -11 1 C-10 5 -5 4 0 0 Z" fill="url(#chibiBowTie)" stroke="#133326" strokeWidth="2" />
            <path d="M0 0 C7 -5 10 -3 11 1 C10 5 5 4 0 0 Z" fill="url(#chibiBowTie)" stroke="#133326" strokeWidth="2" />
            <circle cx="0" cy="0" r="2.8" fill="#A81C2D" stroke="#133326" strokeWidth="1.5" />
          </g>

          {/* ─── 4. Chibi Head ─── */}
          <circle cx="80" cy="56" r="28" fill="url(#chibiWormSkin)" stroke="#133326" strokeWidth="3.2" />
          <ellipse cx="80" cy="46" rx="14" ry="8" fill="#5ED179" opacity="0.45" />

          {/* Cheeks (Turn bright red if angry, glowing pink if petting) */}
          <circle
            cx="58"
            cy="62"
            r={emotion === 'angry' || emotion === 'tantrum' ? 8 : emotion === 'petting' ? 7.5 : 5.5}
            fill={emotion === 'angry' || emotion === 'tantrum' ? '#FF5252' : '#FFAAA6'}
            opacity={emotion === 'angry' || emotion === 'tantrum' || emotion === 'petting' ? 0.95 : 0.65}
          />
          <circle
            cx="102"
            cy="62"
            r={emotion === 'angry' || emotion === 'tantrum' ? 8 : emotion === 'petting' ? 7.5 : 5.5}
            fill={emotion === 'angry' || emotion === 'tantrum' ? '#FF5252' : '#FFAAA6'}
            opacity={emotion === 'angry' || emotion === 'tantrum' || emotion === 'petting' ? 0.95 : 0.65}
          />

          {/* ─── 5. Mouth & Expression Engine ─── */}
          {isSleeping ? (
            // Sleeping Smile ( ˘ ᵕ ˘ )
            <path d="M74 65 Q80 69 86 65" stroke="#133326" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          ) : emotion === 'angry' || emotion === 'tantrum' ? (
            // Angry Pout / Grumpy Squiggle ( ಠ_ಠ )
            <path d="M72 68 Q76 63 80 67 Q84 71 88 65" stroke="#133326" strokeWidth="3" strokeLinecap="round" fill="none" />
          ) : emotion === 'dizzy' ? (
            // Confused Wavy Mouth (~ o ~)
            <ellipse cx="80" cy="65" rx="4.5" ry="3.5" fill="#D12C42" stroke="#133326" strokeWidth="2" />
          ) : emotion === 'curious' ? (
            // Little Inquisitive 'O' mouth
            <circle cx="80" cy="65" r="3.2" fill="#D12C42" stroke="#133326" strokeWidth="1.8" />
          ) : emotion === 'petting' ? (
            // Purring Bliss Smile
            <path d="M72 63 Q80 70 88 63" stroke="#133326" strokeWidth="2.8" strokeLinecap="round" fill="none" />
          ) : mood === 'thinking' ? (
            <ellipse cx="80" cy="65" rx="3.5" ry="4.5" fill="#D12C42" stroke="#133326" strokeWidth="1.8" />
          ) : (
            <path d="M73 63 Q80 68 87 63" stroke="#133326" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          )}

          {/* ─── 6. Cute Spectacles & Eyeball Expressions ─── */}
          {/* Left Eye */}
          <g transform="translate(66, 52)">
            <circle cx="0" cy="0" r="9" fill="#FFFFFF" stroke="#133326" strokeWidth="2" />
            {isSleeping ? (
              <path d="M-6 1 Q0 6 6 1" stroke="#133326" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            ) : emotion === 'petting' ? (
              <path d="M-6 2 Q0 -4 6 2" stroke="#133326" strokeWidth="2.8" strokeLinecap="round" fill="none" />
            ) : emotion === 'dizzy' ? (
              // Swirly Dizzy Eye (@)
              <path d="M-4 0 C-4 -4 4 -4 4 0 C4 3 -2 3 -2 0 C-2 -1 1 -1 1 0" stroke="#133326" strokeWidth="2" strokeLinecap="round" fill="none" />
            ) : emotion === 'angry' || emotion === 'tantrum' ? (
              // Angry Slanted Eye
              <g>
                <line x1="-7" y1="-5" x2="6" y2="0" stroke="#133326" strokeWidth="3" strokeLinecap="round" />
                <circle cx="0" cy="2" r="3.8" fill="#133326" />
              </g>
            ) : emotion === 'curious' ? (
              // Curious Eye (Looking up-right)
              <g transform="translate(2, -2)">
                <circle cx="0.5" cy="0.5" r="4.8" fill="#133326" />
                <circle cx="-1" cy="-1.5" r="1.8" fill="#FFFFFF" />
              </g>
            ) : isBlinking ? (
              <line x1="-7" y1="0" x2="7" y2="0" stroke="#133326" strokeWidth="3" strokeLinecap="round" />
            ) : (
              // Default Eye with Real-Time Mouse Tracking
              <g transform={`translate(${eyeOffset.x}, ${eyeOffset.y})`}>
                <circle cx="0.5" cy="0.5" r="5" fill="#133326" />
                <circle cx="-1" cy="-1.5" r="2" fill="#FFFFFF" />
                <circle cx="2" cy="2" r="1" fill="#FFFFFF" />
              </g>
            )}
            {/* Left Glass Rim */}
            <circle cx="0" cy="0" r="12" fill="none" stroke="url(#chibiGlasses)" strokeWidth="3.2" />
          </g>

          {/* Right Eye */}
          <g transform="translate(94, 52)">
            <circle cx="0" cy="0" r="9" fill="#FFFFFF" stroke="#133326" strokeWidth="2" />
            {isSleeping ? (
              <path d="M-6 1 Q0 6 6 1" stroke="#133326" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            ) : emotion === 'petting' ? (
              <path d="M-6 2 Q0 -4 6 2" stroke="#133326" strokeWidth="2.8" strokeLinecap="round" fill="none" />
            ) : emotion === 'dizzy' ? (
              // Swirly Dizzy Eye (@)
              <path d="M-4 0 C-4 -4 4 -4 4 0 C4 3 -2 3 -2 0 C-2 -1 1 -1 1 0" stroke="#133326" strokeWidth="2" strokeLinecap="round" fill="none" />
            ) : emotion === 'angry' || emotion === 'tantrum' ? (
              // Angry Slanted Eye
              <g>
                <line x1="7" y1="-5" x2="-6" y2="0" stroke="#133326" strokeWidth="3" strokeLinecap="round" />
                <circle cx="0" cy="2" r="3.8" fill="#133326" />
              </g>
            ) : emotion === 'curious' ? (
              <g transform="translate(2, -2)">
                <circle cx="0" cy="0.5" r="4.8" fill="#133326" />
                <circle cx="-1.5" cy="-1.5" r="1.8" fill="#FFFFFF" />
              </g>
            ) : isBlinking ? (
              <line x1="-7" y1="0" x2="7" y2="0" stroke="#133326" strokeWidth="3" strokeLinecap="round" />
            ) : (
              <g transform={`translate(${eyeOffset.x}, ${eyeOffset.y})`}>
                <circle cx="0" cy="0.5" r="5" fill="#133326" />
                <circle cx="-1.5" cy="-1.5" r="2" fill="#FFFFFF" />
                <circle cx="1.5" cy="2" r="1" fill="#FFFFFF" />
              </g>
            )}
            {/* Right Glass Rim */}
            <circle cx="0" cy="0" r="12" fill="none" stroke="url(#chibiGlasses)" strokeWidth="3.2" />
          </g>

          {/* Glasses Bridge & Temples */}
          <path d="M78 52 Q80 50 82 52" stroke="url(#chibiGlasses)" strokeWidth="3.2" strokeLinecap="round" fill="none" />
          <path d="M54 52 Q48 54 44 60" stroke="#E8873A" strokeWidth="2" strokeLinecap="round" fill="none" />
          <path d="M106 52 Q112 54 116 60" stroke="#E8873A" strokeWidth="2" strokeLinecap="round" fill="none" />

          {/* ─── 7. Mini Scholar Cap ─── */}
          <g transform="translate(80, 29)">
            <path d="M-14 3 C-14 9 14 9 14 3 Z" fill="#133326" stroke="#133326" strokeWidth="1.5" />
            <path d="M0 -10 L26 -1 L0 7 L-26 -1 Z" fill="url(#chibiCapGrad)" stroke="#133326" strokeWidth="2.5" />
            <circle cx="0" cy="-1" r="2.5" fill="#E8873A" stroke="#9C4B0E" strokeWidth="1" />
            <path d="M0 -1 Q13 3 16 11" stroke="#E8873A" strokeWidth="2" fill="none" />
            <circle cx="16" cy="12" r="2.5" fill="#E8873A" stroke="#9C4B0E" strokeWidth="1" />
          </g>

          {/* ─── 8. Worm Hands ─── */}
          <g>
            <circle cx="62" cy="102" r="4" fill="#48C768" stroke="#133326" strokeWidth="2" />
            <circle cx="98" cy="102" r="4" fill="#48C768" stroke="#133326" strokeWidth="2" />
          </g>

          {/* ─── 9. Angry Steam Puffs ─── */}
          {(emotion === 'angry' || emotion === 'tantrum') && (
            <g>
              <g transform="translate(42, 38)" style={{ animation: 'steam-puff-left 0.8s ease-out infinite' }}>
                <circle cx="0" cy="0" r="4" fill="#E7E5E4" opacity="0.8" />
                <circle cx="-5" cy="-4" r="3" fill="#E7E5E4" opacity="0.8" />
              </g>
              <g transform="translate(118, 38)" style={{ animation: 'steam-puff-right 0.8s ease-out infinite 0.2s' }}>
                <circle cx="0" cy="0" r="4" fill="#E7E5E4" opacity="0.8" />
                <circle cx="5" cy="-4" r="3" fill="#E7E5E4" opacity="0.8" />
              </g>
            </g>
          )}

          {/* ─── 10. Floating Sleeping Zzz Particles ─── */}
          {isSleeping && (
            <g transform="translate(108, 26)">
              <text
                x="0"
                y="0"
                fontFamily="'Space Mono', monospace"
                fontWeight="bold"
                fontSize="11"
                fill="#E8873A"
                style={{ animation: 'sleep-z-rise 2.2s ease-out infinite' }}
              >
                z
              </text>
              <text
                x="6"
                y="-8"
                fontFamily="'Space Mono', monospace"
                fontWeight="bold"
                fontSize="14"
                fill="#E8873A"
                style={{ animation: 'sleep-z-rise 2.2s ease-out infinite 0.7s' }}
              >
                Z
              </text>
              <text
                x="13"
                y="-18"
                fontFamily="'Space Mono', monospace"
                fontWeight="bold"
                fontSize="18"
                fill="#1F4D3A"
                style={{ animation: 'sleep-z-rise 2.2s ease-out infinite 1.4s' }}
              >
                Z
              </text>
            </g>
          )}
        </svg>
      </div>
    </div>
  );
}
export default ReadBuddyMascot;
