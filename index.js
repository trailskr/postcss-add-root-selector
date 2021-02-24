const postcss = require('postcss')

const globalRulesRe = /^((?:body|html)(?:[^\w ][^ ]+)?)( .*)?/
const inheritedDeclarationNamesRe = /^(-webkit-|-moz-|-moz-osx-|-o-|-ms-)?(?:color|font-.*|text-.*|line-height|letter-spacing|line-break|overflow-wrap|hyphens|tab-size|white-space|word-break|word-spacing|direction)$/

/**
 * @param opts {{
 *   rootSelector: string,
 *   include: Array<string | RegExp>,
 *   exclude: Array<string | RegExp>,
 * }}
 */
const makeRuleProcessor = (opts = { }) => {
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

  return (rule) => {
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

const includeFile = (root, opts) => {
  const fileName = root.source && root.source.input.file
  if (!fileName) return true

  if (opts.include && opts.include.length > 0) {
    return opts.include.some(pattern => fileName.match(pattern))
  }

  if (opts.exclude && opts.exclude.length > 0) {
    return !opts.exclude.some(pattern => fileName.match(pattern))
  }

  return true
}

const makeRootProcessor = (opts) => (root) => {
  if (includeFile(root, opts)) {
    root.walkRules(makeRuleProcessor(opts))
  }
}

const pluginName = 'postcss-add-root-selector'

const versionFormat = (postcss) => {
  const isPostCSSv8 = postcss.Root !== undefined

  if (isPostCSSv8) {
    const plugin = (opts) => {
      return {
        postcssPlugin: pluginName,
        Once: makeRootProcessor(opts)
      }
    }
    plugin.postcss = true
    return plugin
  } else {
    return postcss.plugin(pluginName, (opts) => {
      return makeRootProcessor(opts)
    })
  }
}

module.exports = versionFormat(postcss)
module.exports.versionFormat = versionFormat
