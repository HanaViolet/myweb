'use strict'

// Apply the Field Notes art direction at render time so the theme class is
// present before the first paint and remains available without client JS.
hexo.extend.filter.register('after_render:html', (html, data) => {
  if (!data) return html

  let result = html.replace(/<body([^>]*)>/i, (opening, attributes) => {
    if (/\bclass\s*=\s*(["'])/.test(attributes)) {
      return opening.replace(/\bclass\s*=\s*(["'])(.*?)\1/i, (attribute, quote, value) => {
        const classes = value.split(/\s+/)
        return classes.includes('atlas-theme') ? attribute : `class=${quote}${value} atlas-theme${quote}`
      })
    }
    return `<body class="atlas-theme"${attributes}>`
  })
  result = result.replace(/<header\b[^>]*>/i, (opening) => {
    if (!/\bid=["']page-header["']/i.test(opening) || !/\bnot-home-page\b/i.test(opening)) return opening
    const withoutInlineCover = opening.replace(/\sstyle=(["'])[^"']*\1/i, '')
    return withoutInlineCover.replace(/>$/, ' style="background-image:none !important;background-color:#e9ecec !important;">')
  })
  result = result.replace(/(<meta\s+name="theme-color"\s+content=")[^"]*("\s*\/?>)/i, '$1#e9ecec$2')

  return result
}, 40)
