import React, { useState, useRef, useEffect } from 'react'
import { convertHtmlToMarkdown } from './convertHtmlToMarkdown'

export interface ActiveFormats {
  bold: boolean
  italic: boolean
  h1: boolean
  h2: boolean
  h3: boolean
  bullet: boolean
  number: boolean
  quote: boolean
  link: boolean
}

export function useRichTextFormatting(
  value: string,
  onChange: (val: string) => void,
  isEditing: boolean
) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const [activeFormats, setActiveFormats] = useState<ActiveFormats>({
    bold: false,
    italic: false,
    h1: false,
    h2: false,
    h3: false,
    bullet: false,
    number: false,
    quote: false,
    link: false
  })

  const checkActiveFormats = () => {
    const el = textareaRef.current
    if (!el) return

    const start = el.selectionStart
    const end = el.selectionEnd
    const currentVal = value || ''

    let selectedText = ''
    if (start !== end) {
      selectedText = currentVal.substring(start, end)
    } else {
      selectedText = currentVal
    }

    const bold =
      (selectedText.length > 0 && selectedText.startsWith('**') && selectedText.endsWith('**')) ||
      (currentVal.trim().length > 0 && currentVal.startsWith('**') && currentVal.endsWith('**'))

    const italic =
      (selectedText.length > 0 &&
        selectedText.startsWith('*') &&
        !selectedText.startsWith('**') &&
        selectedText.endsWith('*') &&
        !selectedText.endsWith('**')) ||
      (currentVal.trim().length > 0 &&
        currentVal.startsWith('*') &&
        !currentVal.startsWith('**') &&
        currentVal.endsWith('*') &&
        !currentVal.endsWith('**'))

    const link = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/.test(selectedText)

    const lineStart = currentVal.lastIndexOf('\n', start - 1) + 1
    let lineEnd = currentVal.indexOf('\n', start)
    if (lineEnd === -1) lineEnd = currentVal.length
    const lineText = currentVal.substring(lineStart, lineEnd)

    const h1 = /^#\s/.test(lineText)
    const h2 = /^##\s/.test(lineText)
    const h3 = /^###\s/.test(lineText)
    const bullet = /^[-*+]\s/.test(lineText)
    const number = /^\d+\.\s/.test(lineText)
    const quote = /^>\s/.test(lineText)

    setActiveFormats({ bold, italic, h1, h2, h3, bullet, number, quote, link })
  }

  useEffect(() => {
    if (isEditing) {
      checkActiveFormats()
    }
  }, [value, isEditing])

  const insertFormatting = (prefix: string, suffix: string = '') => {
    const el = textareaRef.current
    if (!el) return

    const start = el.selectionStart
    const end = el.selectionEnd
    const currentVal = value || ''
    const selectedText = currentVal.substring(start, end)

    if (selectedText.length > 0) {
      if (selectedText.startsWith(prefix) && selectedText.endsWith(suffix)) {
        const unwrapped = selectedText.slice(prefix.length, selectedText.length - suffix.length)
        const newVal = currentVal.substring(0, start) + unwrapped + currentVal.substring(end)
        onChange(newVal)
        setTimeout(() => {
          el.focus()
          el.setSelectionRange(start, start + unwrapped.length)
          checkActiveFormats()
        }, 0)
        return
      }

      const replacement = `${prefix}${selectedText}${suffix}`
      const newVal = currentVal.substring(0, start) + replacement + currentVal.substring(end)
      onChange(newVal)
      setTimeout(() => {
        el.focus()
        el.setSelectionRange(start, start + replacement.length)
        checkActiveFormats()
      }, 0)
      return
    }

    if (currentVal.trim().length > 0) {
      if (currentVal.startsWith(prefix) && currentVal.endsWith(suffix)) {
        const unwrapped = currentVal.slice(prefix.length, currentVal.length - suffix.length)
        onChange(unwrapped)
      } else {
        onChange(`${prefix}${currentVal}${suffix}`)
      }
    } else {
      onChange(`${prefix}${suffix}`)
    }

    setTimeout(() => {
      el.focus()
      checkActiveFormats()
    }, 0)
  }

  const insertLinePrefix = (prefix: string) => {
    const el = textareaRef.current
    if (!el) return

    const start = el.selectionStart
    const end = el.selectionEnd
    const currentVal = value || ''

    const cleanLinePrefix = (line: string) => {
      return line.replace(/^(#{1,6}\s+|[-*+]\s+|\d+\.\s+|>+\s+)/, '')
    }

    if (start !== end) {
      const before = currentVal.substring(0, start)
      const selected = currentVal.substring(start, end)
      const after = currentVal.substring(end)

      const lines = selected.split('\n')
      const allHavePrefix = lines.every((line) => line.startsWith(prefix))

      let prefixed: string
      if (allHavePrefix) {
        prefixed = lines.map((line) => line.substring(prefix.length)).join('\n')
      } else {
        prefixed = lines.map((line) => `${prefix}${cleanLinePrefix(line)}`).join('\n')
      }
      onChange(before + prefixed + after)
    } else {
      const lineStart = currentVal.lastIndexOf('\n', start - 1) + 1
      let lineEnd = currentVal.indexOf('\n', start)
      if (lineEnd === -1) lineEnd = currentVal.length

      const before = currentVal.substring(0, lineStart)
      const lineText = currentVal.substring(lineStart, lineEnd)
      const after = currentVal.substring(lineEnd)

      if (lineText.startsWith(prefix)) {
        const newLine = lineText.substring(prefix.length)
        onChange(before + newLine + after)
      } else {
        const cleaned = cleanLinePrefix(lineText)
        const newLine = `${prefix}${cleaned}`
        onChange(before + newLine + after)
      }
    }

    setTimeout(() => {
      el.focus()
      checkActiveFormats()
    }, 0)
  }

  const insertTableTemplate = () => {
    const tableSnippet = `\n\n| Feature / Item | Description | Priority | Status |\n| --- | --- | --- | --- |\n| User Authentication | SSO & OAuth2 integration | High | In Progress |\n| Real-time Telemetry | Event tracking and analytics | Medium | Proposed |\n\n`
    const el = textareaRef.current
    if (!el) return
    const start = el.selectionStart
    const currentVal = value || ''
    const newVal = currentVal.substring(0, start) + tableSnippet + currentVal.substring(start)
    onChange(newVal)
  }

  const insertLink = () => {
    const el = textareaRef.current
    if (!el) return

    const start = el.selectionStart
    const end = el.selectionEnd
    const currentVal = value || ''
    const selectedText = currentVal.substring(start, end)

    const defaultUrl = selectedText.startsWith('http') ? selectedText : 'https://'
    const defaultLabel = selectedText && !selectedText.startsWith('http') ? selectedText : ''

    const inputUrl = window.prompt(
      'Enter Reference URL (e.g. https://figma.com/file/123):',
      defaultUrl
    )
    if (!inputUrl || !inputUrl.trim()) return

    let formattedUrl = inputUrl.trim()
    if (
      !formattedUrl.startsWith('http://') &&
      !formattedUrl.startsWith('https://') &&
      !formattedUrl.startsWith('/')
    ) {
      formattedUrl = `https://${formattedUrl}`
    }

    const inputLabel =
      window.prompt('Enter Link Display Text (e.g. Figma Design Spec):', defaultLabel) ||
      formattedUrl

    const markdownLink = `[${inputLabel.trim()}](${formattedUrl})`

    let newVal: string
    if (selectedText.length > 0) {
      newVal = currentVal.substring(0, start) + markdownLink + currentVal.substring(end)
    } else {
      newVal = currentVal.substring(0, start) + markdownLink + currentVal.substring(start)
    }

    onChange(newVal)

    setTimeout(() => {
      el.focus()
      checkActiveFormats()
    }, 0)
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const htmlData = e.clipboardData.getData('text/html')
    const plainData = e.clipboardData.getData('text/plain')

    let convertedMarkdown = ''

    if (htmlData) {
      convertedMarkdown = convertHtmlToMarkdown(htmlData)
    }

    if (!convertedMarkdown && plainData) {
      convertedMarkdown = plainData.replace(/^[•▪◦]\s*/gm, '- ').replace(/\n[•▪◦]\s*/g, '\n- ')
    }

    if (convertedMarkdown) {
      e.preventDefault()
      const el = textareaRef.current
      if (!el) return

      const start = el.selectionStart
      const end = el.selectionEnd
      const currentVal = value || ''

      const newVal = currentVal.substring(0, start) + convertedMarkdown + currentVal.substring(end)
      onChange(newVal)

      setTimeout(() => {
        el.focus()
        el.setSelectionRange(start + convertedMarkdown.length, start + convertedMarkdown.length)
        checkActiveFormats()
      }, 0)
    }
  }

  return {
    textareaRef,
    activeFormats,
    checkActiveFormats,
    insertFormatting,
    insertLinePrefix,
    insertTableTemplate,
    insertLink,
    handlePaste
  }
}
