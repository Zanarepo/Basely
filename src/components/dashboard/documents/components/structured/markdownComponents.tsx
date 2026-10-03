import React from 'react'

export const markdownComponents = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  table: ({ node, ...props }: any) => (
    <div className="overflow-x-auto my-4 border border-app-border rounded-lg shadow-sm">
      <table className="w-full text-left text-sm" {...props} />
    </div>
  ),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  thead: ({ node, ...props }: any) => (
    <thead className="bg-app-muted-surface border-b border-app-border" {...props} />
  ),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  th: ({ node, ...props }: any) => (
    <th className="px-4 py-3 font-semibold text-app-fg" {...props} />
  ),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  td: ({ node, ...props }: any) => (
    <td className="px-4 py-3 border-t border-app-border/50 text-app-fg/80" {...props} />
  ),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ul: ({ node, ...props }: any) => (
    <ul className="list-disc list-outside pl-6 space-y-1.5 my-2 text-app-fg" {...props} />
  ),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ol: ({ node, ...props }: any) => (
    <ol className="list-decimal list-outside pl-6 space-y-1.5 my-2 text-app-fg" {...props} />
  ),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  li: ({ node, ...props }: any) => (
    <li className="pl-1 mb-1 leading-relaxed [&>p]:inline [&>p]:mb-0" {...props} />
  ),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  h1: ({ node, ...props }: any) => (
    <h1 className="text-xl font-extrabold text-app-fg mt-5 mb-3" {...props} />
  ),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  h2: ({ node, ...props }: any) => (
    <h2 className="text-lg font-bold text-app-fg mt-4 mb-2" {...props} />
  ),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  h3: ({ node, ...props }: any) => (
    <h3 className="text-base font-bold text-app-fg mt-3 mb-2" {...props} />
  ),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  p: ({ node, ...props }: any) => (
    <p className="mb-2 leading-relaxed" {...props} />
  ),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  blockquote: ({ children, ...props }: any) => {
    const childrenStr = String(children || '')

    if (childrenStr.includes('💡')) {
      return (
        <blockquote className="my-4 p-4 rounded-2xl border-l-4 border-violet-500 bg-violet-500/10 text-app-fg shadow-2xs space-y-1 font-medium" {...props}>
          {children}
        </blockquote>
      )
    }

    if (childrenStr.includes('⚠️')) {
      return (
        <blockquote className="my-4 p-4 rounded-2xl border-l-4 border-amber-500 bg-amber-500/10 text-app-fg shadow-2xs space-y-1 font-medium" {...props}>
          {children}
        </blockquote>
      )
    }

    if (childrenStr.includes('📌')) {
      return (
        <blockquote className="my-4 p-4 rounded-2xl border-l-4 border-blue-500 bg-blue-500/10 text-app-fg shadow-2xs space-y-1 font-medium" {...props}>
          {children}
        </blockquote>
      )
    }

    if (childrenStr.includes('🚀')) {
      return (
        <blockquote className="my-4 p-4 rounded-2xl border-l-4 border-emerald-500 bg-emerald-500/10 text-app-fg shadow-2xs space-y-1 font-medium" {...props}>
          {children}
        </blockquote>
      )
    }

    return (
      <blockquote className="my-3 p-3.5 border-l-4 border-violet-500 bg-violet-500/5 rounded-r-xl italic text-app-fg/90 shadow-2xs" {...props}>
        {children}
      </blockquote>
    )
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  a: () => {
    // Exclude inline link badges from body text preview so links ONLY appear in the section bottom-right footer bar
    return null
  }
}
