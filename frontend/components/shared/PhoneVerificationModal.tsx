'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Smartphone,
  ShieldCheck,
  Check,
  X,
  RefreshCw,
  KeyRound,
  Sparkles,
} from 'lucide-react';

interface PhoneVerificationModalProps {
  open: boolean;
  phoneNumber: string;
  userName?: string;
  accent?: string;
  onVerified: () => void;
  onClose: () => void;
}

export function PhoneVerificationModal({
  open,
  phoneNumber,
  userName = 'User',
  accent = '#1F4D3A',
  onVerified,
  onClose,
}: PhoneVerificationModalProps) {
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [demoCode, setDemoCode] = useState<string>('849201');
  const [countdown, setCountdown] = useState<number>(45);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Generate a random 6-digit demo code when opened
  useEffect(() => {
    if (open) {
      const generated = Math.floor(100000 + Math.random() * 900000).toString();
      setDemoCode(generated);
      setDigits(['', '', '', '', '', '']);
      setCountdown(45);
      setErrorMsg(null);
      setIsVerifying(false);
      setIsSuccess(false);

      // Focus first input box
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 150);
    }
  }, [open]);

  // Resend countdown timer
  useEffect(() => {
    if (!open || countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [open, countdown]);

  function handleDigitChange(index: number, value: string) {
    setErrorMsg(null);
    const cleaned = value.replace(/\D/g, '');
    if (!cleaned) {
      const newDigits = [...digits];
      newDigits[index] = '';
      setDigits(newDigits);
      return;
    }

    // Handle full 6-digit paste
    if (cleaned.length >= 6) {
      const pasted = cleaned.slice(0, 6).split('');
      setDigits(pasted);
      inputRefs.current[5]?.focus();
      verifyCode(pasted.join(''));
      return;
    }

    const single = cleaned.slice(-1);
    const newDigits = [...digits];
    newDigits[index] = single;
    setDigits(newDigits);

    // Auto-advance to next input
    if (index < 5 && single) {
      inputRefs.current[index + 1]?.focus();
    }

    // If last digit filled, check if all filled
    if (index === 5 && single) {
      const fullCode = newDigits.join('');
      if (fullCode.length === 6) {
        verifyCode(fullCode);
      }
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handleResend() {
    if (countdown > 0) return;
    const newGenerated = Math.floor(100000 + Math.random() * 900000).toString();
    setDemoCode(newGenerated);
    setDigits(['', '', '', '', '', '']);
    setCountdown(45);
    setErrorMsg(null);
    inputRefs.current[0]?.focus();
  }

  function verifyCode(codeToTest?: string) {
    const code = codeToTest || digits.join('');
    if (code.length < 6) {
      setErrorMsg('Please enter all 6 digits of your verification code.');
      return;
    }

    setIsVerifying(true);
    setErrorMsg(null);

    setTimeout(() => {
      setIsVerifying(false);
      // Accept matching demo code or master test code '123456'
      if (code === demoCode || code === '123456' || code === '849201') {
        setIsSuccess(true);
        setTimeout(() => {
          onVerified();
          onClose();
        }, 800);
      } else {
        setErrorMsg('Invalid verification code. Please check the SMS hint and try again.');
      }
    }, 600);
  }

  function fillDemoCode() {
    const codeArr = demoCode.split('');
    setDigits(codeArr);
    inputRefs.current[5]?.focus();
    verifyCode(demoCode);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[#0F2119]/75 backdrop-blur-[2px] select-none rb-fade-in-up">
      <div
        className="w-full max-w-md bg-[#FFFDF8] border-3 border-[#1F4D3A] rounded-2xl shadow-[6px_6px_0px_#1F4D3A] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b-2 border-[#DED2B4] flex items-center justify-between bg-[#F5EFE0]/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#E8873A] text-white border-2 border-[#1F4D3A] shadow-[2px_2px_0px_#1F4D3A]">
              <Smartphone className="w-4 h-4" strokeWidth={2.5} />
            </div>
            <div>
              <h2
                className="font-serif font-bold text-base sm:text-lg text-[#1F4D3A] leading-tight"
                style={{ fontFamily: "'Fraunces', serif" }}
              >
                Secondary Verification
              </h2>
              <p
                className="text-xs font-mono font-medium text-[#8A5A1E]"
                style={{ fontFamily: "'Space Mono', monospace" }}
              >
                SMS Authentication Code
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-[#1F4D3A] p-1.5 rounded-lg border-2 border-transparent hover:border-[#1F4D3A] transition-all cursor-pointer"
            title="Close dialog"
          >
            <X className="w-5 h-5" strokeWidth={2.5} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 flex flex-col gap-4">
          <div className="text-center">
            <p className="text-xs text-gray-600 font-sans leading-relaxed">
              We sent a 6-digit security code to your registered mobile number:
            </p>
            <p className="font-mono font-bold text-sm text-[#1F4D3A] mt-1 tracking-wider bg-[#FAF6EE] py-1 px-3 rounded-lg border inline-block border-[#DED2B4]">
              {phoneNumber || '+63 9•• ••• ••••'}
            </p>
          </div>

          {/* Carrier Dispatch Hint / Demo Badge */}
          <div className="p-3 rounded-xl bg-[#E8F0F8] border-2 border-[#3D6B8A] flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-[#3D6B8A] shrink-0 mt-0.5" strokeWidth={2.5} />
            <div className="flex-1 text-xs">
              <span className="font-mono font-bold text-[#2A4D65] block">
                SMCC Telecom Gateway (Demo Mode):
              </span>
              <p className="text-[11px] text-[#3D6B8A] font-sans mt-0.5">
                Use verification code{' '}
                <button
                  type="button"
                  onClick={fillDemoCode}
                  className="font-mono font-bold underline text-[#1F4D3A] bg-white px-1.5 py-0.5 rounded border border-[#3D6B8A] hover:bg-[#FAF6EE] cursor-pointer"
                  title="Click to autofill"
                >
                  {demoCode}
                </button>{' '}
                or click code to autofill.
              </p>
            </div>
          </div>

          {/* 6-Digit Box Input */}
          <div className="flex items-center justify-center gap-2 sm:gap-2.5 my-1">
            {digits.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => { inputRefs.current[idx] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleDigitChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                disabled={isVerifying || isSuccess}
                className="w-10 sm:w-11 h-12 text-center text-lg font-mono font-bold rounded-xl border-2 border-[#1F4D3A] bg-[#FFFDF8] shadow-[2px_2px_0px_#1F4D3A] focus:border-[#E8873A] focus:ring-2 focus:ring-[#E8873A]/30 focus:outline-none transition-all disabled:opacity-50"
              />
            ))}
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-2.5 rounded-xl bg-[#FDF2E9] border-2 border-[#F0C99A] text-xs font-semibold text-[#B4602E] text-center font-sans">
              {errorMsg}
            </div>
          )}

          {/* Success State */}
          {isSuccess && (
            <div className="p-2.5 rounded-xl bg-[#E6F4EA] border-2 border-[#BFE0CC] text-xs font-bold text-[#2E7D4F] text-center font-sans flex items-center justify-center gap-1.5 animate-bounce">
              <Check className="w-4 h-4 text-[#2E7D4F]" strokeWidth={2.5} />
              <span>Mobile Phone Verified Successfully!</span>
            </div>
          )}

          {/* Resend Code Section */}
          <div className="flex items-center justify-between text-xs font-sans text-gray-500 pt-1">
            <span>Didn&apos;t receive SMS code?</span>
            {countdown > 0 ? (
              <span className="font-mono font-semibold text-gray-400">
                Resend in {countdown}s
              </span>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                className="font-bold text-[#E8873A] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Resend Code</span>
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t-2 border-[#DED2B4] bg-[#F5EFE0]/40 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-gray-700 border-2 border-[#1F4D3A] bg-[#FFFDF8] shadow-[2px_2px_0px_#1F4D3A] hover:-translate-y-0.5 transition-all cursor-pointer font-sans"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={() => verifyCode()}
            disabled={isVerifying || isSuccess}
            className="px-4 py-1.5 rounded-xl text-xs font-bold text-white border-2 border-[#133326] shadow-[2.5px_2.5px_0px_#133326] hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer flex items-center gap-1.5 font-sans disabled:opacity-50"
            style={{
              background: `linear-gradient(135deg, ${accent}, #1F4D3A)`,
            }}
          >
            <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
            <span>{isVerifying ? 'Verifying...' : 'Confirm Verification'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default PhoneVerificationModal;
