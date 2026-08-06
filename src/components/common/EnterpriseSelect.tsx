'use client'

import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, Check } from 'lucide-react'

export interface SelectOption {
  value: string | number
  label: string
  icon?: React.ReactNode
  description?: string
}

export interface EnterpriseSelectProps {
  value: any
  onChange: (value: any) => void
  options: (SelectOption | string | number)[]
  placeholder?: string
  className?: string
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
  icon?: React.ReactNode
  align?: 'left' | 'right'
}

export default function EnterpriseSelect({
  value,
  onChange,
  options,
  placeholder = 'Select option...',
  className = '',
  disabled = false,
  size = 'md',
  icon,
  align = 'left'
}: EnterpriseSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [dropdownCoords, setDropdownCoords] = useState<{ top?: number, bottom?: number, left: number, width: number, minWidth: number }>({ left: 0, width: 0, minWidth: 0 })
  const containerRef = useRef<HTMLDivElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const normalizedOptions: SelectOption[] = options.map((opt) =>
    typeof opt === 'object' && opt !== null
      ? opt
      : { value: String(opt), label: String(opt) }
  )

  const selectedOption = normalizedOptions.find((opt) => String(opt.value) === String(value))

  const updateCoords = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      const spaceBelow = window.innerHeight - rect.bottom
      const spaceAbove = rect.top
      const dropUp = spaceBelow < 260 && spaceAbove > spaceBelow

      setDropdownCoords({
        top: dropUp ? undefined : rect.bottom + 6,
        bottom: dropUp ? window.innerHeight - rect.top + 6 : undefined,
        left: align === 'right' ? Math.max(8, rect.right - Math.max(rect.width, 220)) : rect.left,
        width: rect.width,
        minWidth: Math.max(rect.width, 180)
      })
    }
  }

  useEffect(() => {
    if (isOpen) {
      updateCoords()
      window.addEventListener('scroll', updateCoords, true)
      window.addEventListener('resize', updateCoords)
    }
    return () => {
      window.removeEventListener('scroll', updateCoords, true)
      window.removeEventListener('resize', updateCoords)
    }
  }, [isOpen, align])

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick)
      document.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs rounded-xl',
    md: 'px-3.5 py-2 text-xs rounded-xl font-bold',
    lg: 'px-4 py-2.5 text-sm rounded-xl font-bold'
  }[size]

  return (
    <div ref={containerRef} className={`relative w-full select-none ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-slate-800 dark:text-slate-200 hover:border-indigo-500/50 hover:shadow-md transition-all duration-200 ${sizeStyles} ${
          disabled ? 'opacity-50 cursor-not-allowed border-slate-200 dark:border-slate-800 hover:border-slate-200 hover:shadow-none' : 'cursor-pointer'
        } ${isOpen ? 'border-indigo-500 ring-2 ring-indigo-500/20 shadow-md' : ''}`}
      >
        <div className="flex items-center gap-2.5 overflow-hidden text-left truncate">
          {selectedOption?.icon || icon}
          <span className="truncate">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 shrink-0 ml-2 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-indigo-500' : ''
          }`}
        />
      </button>

      {isOpen && typeof document !== 'undefined' && createPortal(
        <div
          ref={dropdownRef}
          style={{
            position: 'fixed',
            top: dropdownCoords.top !== undefined ? `${dropdownCoords.top}px` : undefined,
            bottom: dropdownCoords.bottom !== undefined ? `${dropdownCoords.bottom}px` : undefined,
            left: `${dropdownCoords.left}px`,
            minWidth: `${dropdownCoords.minWidth}px`
          }}
          className="z-[9999] max-h-[260px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-xl py-1.5 overflow-y-auto custom-scrollbar animate-fade-in-up"
        >
          {normalizedOptions.map((opt, idx) => {
            const isSelected = String(opt.value) === String(value)
            return (
                <button
                  key={idx}
                  type="button"
                  style={{ cursor: 'pointer' }}
                  onClick={() => {
                    onChange(opt.value)
                    setIsOpen(false)
                  }}
                  className={`cursor-pointer w-full flex items-center justify-between gap-3 px-3.5 py-2.5 text-xs font-semibold transition-colors text-left ${
                    isSelected
                      ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                <div className="flex items-center gap-2.5 overflow-hidden">
                  {opt.icon}
                  <div>
                    <div className="truncate">{opt.label}</div>
                    {opt.description && (
                      <div className="text-[10px] text-slate-400 dark:text-slate-500 font-normal mt-0.5">
                        {opt.description}
                      </div>
                    )}
                  </div>
                </div>
                {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0 ml-2" />}
              </button>
            )
          })}
        </div>,
        document.body
      )}
    </div>
  )
}
