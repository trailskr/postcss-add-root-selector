const globalRulesRe = /^((?:body|html)(?:[^\w ][^ ]+)?)( .*)?/
const inheritedDeclarationNamesRe = /^(?:color|font-.*|text-.*|line-height|letter-spacing|line-break|overflow-wrap|hyphens|tab-size|white-space|word-break|word-spacing|direction)$/

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

  const prependLocalSelector = selector => {
    if (selector === opts.rootSelector) return selector
    if (selector === ':root') {
      return opts.rootSelector
    }
    return prependRoot(selector)
  }

  const insertRootSelectorIntoGlobal = selector => {
    const m = selector.match(globalRulesRe)
    return insertRoot(m[1], m[2])
  }

  return {
    postcssPlugin: 'postcss-add-root-selector',

    Rule (rule) {
      if (rule._skip) return
      if (rule.parent.type === 'atrule') {
        if (!['media', 'supports', 'document'].includes(rule.parent.name)) return
      }
      if (rule.selectors.some(selector => selector.startsWith('*'))) {
        rule.selectors = [opts.rootSelector, ...rule.selectors]
      }

      const global = []
      const local = []
      rule.selectors.forEach(selector => {
        if (selector.match(globalRulesRe)) {
          global.push(selector)
        } else {
          local.push(selector)
        }
      })

      if (global.length === 0) {
        rule.selectors = rule.selectors.map(prependLocalSelector)
        return
      }

      if (local.length > 0) {
        if (rule.every(decl => inheritedDeclarationNamesRe.test(decl.prop))) {
          rule.selectors = rule.selectors.map(selector => {
            return globalRulesRe.test(selector)
              ? insertRootSelectorIntoGlobal(selector)
              : prependLocalSelector(selector)
          })
          return
        }
        const localRule = rule.cloneBefore()
        localRule._skip = true
        localRule.selectors = local.map(prependLocalSelector)
        rule.selectors = global
      }

      const inherited = []
      const selfApplied = []
      rule.each(decl => {
        if (inheritedDeclarationNamesRe.test(decl.prop)) {
          inherited.push(decl)
        } else {
          selfApplied.push(decl)
        }
      })

      if (selfApplied.length === 0) {
        rule.selectors = global.map(insertRootSelectorIntoGlobal)
        return
      } else if (inherited.length === 0) {
        return
      }

      const inheritedRule = rule.cloneBefore()
      inheritedRule._skip = true
      inheritedRule.selectors = global.map(insertRootSelectorIntoGlobal)
      inheritedRule.nodes = inherited

      rule.nodes = selfApplied
    }
  }
}
module.exports.postcss = true
