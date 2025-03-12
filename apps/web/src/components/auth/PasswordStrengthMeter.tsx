'use client';

import React from 'react';

interface PasswordStrengthMeterProps {
  password: string;
  showRequirements?: boolean;
}

export function getPasswordStrength(password: string): number {
  let strength = 0;
  
  if (password.length >= 8) strength += 20;
  if (password.length >= 12) strength += 10;
  if (/[a-z]/.test(password)) strength += 15;
  if (/[A-Z]/.test(password)) strength += 15;
  if (/[0-9]/.test(password)) strength += 20;
  if (/[^a-zA-Z0-9]/.test(password)) strength += 20;
  
  return Math.min(strength, 100);
}

export function getPasswordRequirements(password: string) {
  return {
    minLength: password.length >= 8,
    hasLowercase: /[a-z]/.test(password),
    hasUppercase: /[A-Z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[^a-zA-Z0-9]/.test(password),
  };
}

export function isPasswordValid(password: string): boolean {
  const reqs = getPasswordRequirements(password);
  return reqs.minLength && reqs.hasLowercase && reqs.hasUppercase && reqs.hasNumber;
}

export function PasswordStrengthMeter({ password, showRequirements = true }: PasswordStrengthMeterProps) {
  const strength = getPasswordStrength(password);
  const requirements = getPasswordRequirements(password);
  
  const getStrengthColor = () => {
    if (strength < 30) return 'bg-red-500';
    if (strength < 50) return 'bg-orange-500';
    if (strength < 70) return 'bg-yellow-500';
    if (strength < 90) return 'bg-green-400';
    return 'bg-green-500';
  };
  
  const getStrengthLabel = () => {
    if (strength < 30) return 'Weak';
    if (strength < 50) return 'Fair';
    if (strength < 70) return 'Good';
    if (strength < 90) return 'Strong';
    return 'Very Strong';
  };

  const getStrengthTextColor = () => {
    if (strength < 30) return 'text-red-500';
    if (strength < 50) return 'text-orange-500';
    if (strength < 70) return 'text-yellow-600';
    return 'text-green-500';
  };

  if (!password) return null;

  return (
    <div className="mt-2 space-y-3">
      {/* Strength Bar */}
      <div className="space-y-1">
        <div className="flex justify-between items-center text-xs">
          <span className="text-gray-500 dark:text-gray-400">Password Strength</span>
          <span className={`font-bold ${getStrengthTextColor()}`}>{getStrengthLabel()}</span>
        </div>
        <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-300 ${getStrengthColor()}`}
            style={{ width: `${strength}%` }}
          />
        </div>
      </div>

      {/* Requirements Checklist */}
      {showRequirements && (
        <div className="grid grid-cols-2 gap-2 text-xs">
          <RequirementItem met={requirements.minLength} label="8+ characters" />
          <RequirementItem met={requirements.hasLowercase} label="Lowercase letter" />
          <RequirementItem met={requirements.hasUppercase} label="Uppercase letter" />
          <RequirementItem met={requirements.hasNumber} label="Number" />
          <RequirementItem met={requirements.hasSpecial} label="Special character" />
        </div>
      )}
    </div>
  );
}

function RequirementItem({ met, label }: { met: boolean; label: string }) {
  return (
    <div className={`flex items-center gap-1.5 ${met ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`}>
      <span className="material-symbols-outlined text-sm">
        {met ? 'check_circle' : 'radio_button_unchecked'}
      </span>
      <span>{label}</span>
    </div>
  );
}
