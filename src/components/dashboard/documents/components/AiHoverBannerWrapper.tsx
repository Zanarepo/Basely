import React, { ReactNode } from 'react'

interface AiHoverBannerWrapperProps {
  trigger: ReactNode
  children: ReactNode
  align?: 'left' | 'right'
  widthClass?: string
}

export function AiHoverBannerWrapper({ trigger, children, align = 'left', widthClass = 'w-[320px]' }: AiHoverBannerWrapperProps) {
  return (
    <div className={`group relative mb-8 w-max ${align === 'right' ? 'ml-auto' : ''} z-40`}>
      <div className="flex items-center gap-2 cursor-pointer">
        {trigger}
      </div>

      {/* Popover Card */}
      <div className={`absolute top-full mt-2 ${widthClass} ${align === 'right' ? 'right-0' : 'left-0'} opacity-0 invisible translate-y-2 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 transition-all duration-200 ease-out z-50 pointer-events-none group-hover:pointer-events-auto`}>
        {children}
      </div>
    </div>
  )
}
