/**
 * Utility function to convert HTML string from clipboard (Google Docs, Word, Notion) into clean Markdown.
 */
export function convertHtmlToMarkdown(htmlString: string): string {
  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(htmlString, 'text/html')

    function parseNode(node: Node): string {
      if (node.nodeType === Node.TEXT_NODE) {
        return node.textContent || ''
      }

      if (node.nodeType !== Node.ELEMENT_NODE) return ''

      const el = node as HTMLElement
      const tag = el.tagName.toLowerCase()

      const childrenText = Array.from(el.childNodes)
        .map(parseNode)
        .join('')

      switch (tag) {
        case 'b':
        case 'strong':
          return childrenText.trim() ? `**${childrenText.trim()}**` : ''
        case 'i':
        case 'em':
          return childrenText.trim() ? `*${childrenText.trim()}*` : ''
        case 'h1':
          return `\n\n# ${childrenText.trim()}\n\n`
        case 'h2':
          return `\n\n## ${childrenText.trim()}\n\n`
        case 'h3':
          return `\n\n### ${childrenText.trim()}\n\n`
        case 'h4':
        case 'h5':
        case 'h6':
          return `\n\n#### ${childrenText.trim()}\n\n`
        case 'p':
          return `\n\n${childrenText.trim()}\n\n`
        case 'br':
          return '\n'
        case 'blockquote':
          return `\n\n> ${childrenText.trim()}\n\n`
        case 'code':
          return `\`${childrenText}\``
        case 'pre':
          return `\n\n\`\`\`\n${childrenText.trim()}\n\`\`\`\n\n`
        case 'a': {
          const href = el.getAttribute('href')
          return href ? `[${childrenText.trim()}](${href})` : childrenText
        }
        case 'ul':
          return `\n\n${Array.from(el.children).map(child => parseNode(child)).join('\n')}\n\n`
        case 'ol': {
          let idx = 1
          return `\n\n${Array.from(el.children).map(child => {
            const res = parseNode(child)
            return res.startsWith('- ') ? res.replace('- ', `${idx++}. `) : res
          }).join('\n')}\n\n`
        }
        case 'li': {
          const text = childrenText.trim().replace(/^[•▪◦-]\s*/, '')
          return `- ${text}`
        }
        case 'tr': {
          const cells = Array.from(el.children).map(c => parseNode(c).trim())
          return `| ${cells.join(' | ')} |`
        }
        case 'tbody':
        case 'thead':
          return childrenText
        case 'table': {
          const rows = Array.from(el.querySelectorAll('tr'))
          if (rows.length === 0) return childrenText
          const headerCells = Array.from(rows[0].querySelectorAll('th, td')).map(c => parseNode(c).trim() || ' ')
          const headerRow = `| ${headerCells.join(' | ')} |`
          const separatorRow = `| ${headerCells.map(() => '---').join(' | ')} |`
          const bodyRows = rows.slice(1).map(r => {
            const cells = Array.from(r.querySelectorAll('td, th')).map(c => parseNode(c).trim() || ' ')
            return `| ${cells.join(' | ')} |`
          })
          return `\n\n${headerRow}\n${separatorRow}\n${bodyRows.join('\n')}\n\n`
        }
        default:
          return childrenText
      }
    }

    const md = parseNode(doc.body)
      .replace(/\n{3,}/g, '\n\n')
      .replace(/^[\s\n]+/, '')
      .replace(/[\s\n]+$/, '')

    return md
  } catch (e) {
    console.error('HTML to MD parse error:', e)
    return ''
  }
}
