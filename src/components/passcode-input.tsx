'use client'

import { useState, useRef, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface PasscodeInputProps {
  value: string
  onChange: (value: string) => void
  length?: number
  disabled?: boolean
  error?: boolean
}

export function PasscodeInput({ 
  value, 
  onChange, 
  length = 4, 
  disabled = false,
  error = false 
}: PasscodeInputProps) {
  const [focusedIndex, setFocusedIndex] = useState(0)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  const digits = value.split('').slice(0, length)
  while (digits.length < length) {
    digits.push('')
  }

  const handleInputChange = (index: number, digit: string) => {
    if (digit.length > 1) {
      digit = digit.slice(-1)
    }

    if (!/^\d*$/.test(digit)) {
      return
    }

    const newDigits = [...digits]
    newDigits[index] = digit
    const newValue = newDigits.join('')
    onChange(newValue)

    // Auto-focus next input
    if (digit && index < length - 1) {
      setFocusedIndex(index + 1)
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      setFocusedIndex(index - 1)
      inputRefs.current[index - 1]?.focus()
    }
    
    if (e.key === 'ArrowLeft' && index > 0) {
      setFocusedIndex(index - 1)
      inputRefs.current[index - 1]?.focus()
    }
    
    if (e.key === 'ArrowRight' && index < length - 1) {
      setFocusedIndex(index + 1)
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length)
    onChange(pastedData)
    
    const nextIndex = Math.min(pastedData.length, length - 1)
    setFocusedIndex(nextIndex)
    inputRefs.current[nextIndex]?.focus()
  }

  useEffect(() => {
    inputRefs.current[focusedIndex]?.focus()
  }, [focusedIndex])

  return (
    <div className="flex gap-2 justify-center">
      {digits.map((digit, index) => (
        <Input
          key={index}
          ref={(el) => {
            inputRefs.current[index] = el
          }}
          type="text"
          inputMode="numeric"
          pattern="\d*"
          maxLength={1}
          value={digit}
          onChange={(e) => handleInputChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          onFocus={() => setFocusedIndex(index)}
          disabled={disabled}
          className={cn(
            'w-12 h-12 text-center text-lg font-semibold',
            'focus:ring-2 focus:ring-primary focus:border-primary',
            error && 'border-red-500 focus:ring-red-500 focus:border-red-500',
            digit && 'bg-primary/5'
          )}
          autoComplete="one-time-code"
        />
      ))}
    </div>
  )
}
