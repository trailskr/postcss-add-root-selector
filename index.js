const globalRulesRe = /^((?:body|html)(?:[^\w ][^ ]+)?)( .*)?/

/**
 * @param opts {{rootSelector: string}}
 */
module.exports = (opts = { }) => {
  if (!opts.rootSelector || typeof opts.rootSelector !== 'string') {
    throw new Error('rootSelector is not specified or it is not a string')
  }

  const prependRoot = (selector) => {
    return `${opts.rootSelector} ${selector}`
  }
  const insertRoot = (global, selector) => {
    return `${global} ${opts.rootSelector}${selector || ''}`
  }

  return {
    postcssPlugin: 'postcss-add-root-selector',

    Rule (rule) {
      if (rule.parent.type === 'atrule') {
        if (!['media', 'supports', 'document'].includes(rule.parent.name)) return
      }
      rule.selectors = rule.selectors.map(selector => {
        if (selector === ':root') {
          return opts.rootSelector
        }
        const m = selector.match(globalRulesRe)
        if (m) {
          return insertRoot(m[1], m[2])
        }
        return prependRoot(selector)
      })
    }
  }
}
module.exports.postcss = true
