const postcss = require('postcss')
const postcss7 = require('postcss7')

const plugin = require('./')

async function run (input, output, opts = { }, from) {
  const result = await postcss([plugin(opts)]).process(input, { from })
  expect(result.css).toEqual(output)
  expect(result.warnings()).toHaveLength(0)
}

it('should throw if not rootSector option specified', async () => {
  let err
  try {
    await postcss([plugin({})]).process('', {from: undefined})
  } catch (e) {
    err = e
  }
  expect(err).toBeInstanceOf(Error)
})

it('adds root to tag', async () => {
  await run('a{color: red}', '.some-root a{color: red}', { rootSelector: '.some-root' })
})

it('adds root to tag with class', async () => {
  await run('a.some{color: red}', '.some-root a.some{color: red}', { rootSelector: '.some-root' })
})

it('adds root to class', async () => {
  await run('.some{color: red}', '.some-root .some{color: red}', { rootSelector: '.some-root' })
})

it('adds root to id selector', async () => {
  await run('#some{color: red}', '.some-root #some{color: red}', { rootSelector: '.some-root' })
})

it('adds root to sub-selector', async () => {
  await run('#some>.some{color: red}', '.some-root #some>.some{color: red}', { rootSelector: '.some-root' })
})

it('adds root in between for global selector and inherited declarations', async () => {
  await run('html{font-size: 10px;-webkit-font-smoothing: antialiased}', 'html .some-root{font-size: 10px;-webkit-font-smoothing: antialiased}', { rootSelector: '.some-root' })
})

it('preserves self-applied declarations to global elements', async () => {
  await run('html,body{margin: 0}', 'html,body{margin: 0}', { rootSelector: '.some-root' })
})

it('split self-applied declarations to global elements, and adds root in between for inherited declarations', async () => {
  await run(`\
html,body{
  margin: 0;
  padding-top: 10px;
  margin-left: 10px;
  background: white;
  background-color: red;
  font-size: 14px;
  font-family: Arial;
  font-smoothing: antialiased;
  -webkit-font-smoothing: antialiased;
  position: relative;
  display: block;
  top: 10px;
  border-top-width: 1px;
  outline: none;
  color: red !important;
}`, `\
html .some-root,body .some-root{
  font-size: 14px;
  font-family: Arial;
  font-smoothing: antialiased;
  -webkit-font-smoothing: antialiased;
  color: red !important;
}
html,body{
  margin: 0;
  padding-top: 10px;
  margin-left: 10px;
  background: white;
  background-color: red;
  position: relative;
  display: block;
  top: 10px;
  border-top-width: 1px;
  outline: none;
}`, { rootSelector: '.some-root' })
})

it('extracts not-global declarations for mixed global/not global selectors', async () => {
  await run(`\
html,body,.some-class{
  margin: 0;
  color: red !important;
}`, `\
.some-root .some-class{
  margin: 0;
  color: red !important;
}
html .some-root,body .some-root{
  color: red !important;
}
html,body{
  margin: 0;
}`, { rootSelector: '.some-root' })
})

it('adds root in between for global selector body with nested selector and inherited declarations', async () => {
  await run('body:hover .some-class{color: red}', 'body:hover .some-root .some-class{color: red}', { rootSelector: '.some-root' })
})

it('add root to multiple selectors', async () => {
  await run('.some-class,.other-class,a{color: red}', '.some-root .some-class,.some-root .other-class,.some-root a{color: red}', { rootSelector: '.some-root' })
})

it('add root to mixed global and local selectors', async () => {
  await run('.some-class,body,a{color: red}', '.some-root .some-class,body .some-root,.some-root a{color: red}', { rootSelector: '.some-root' })
})

it('change every rule inside @media rules', async () => {
  await run('@media (max-width: 200px) {.some-class{color: red}}', '@media (max-width: 200px) {.some-root .some-class{color: red}}', { rootSelector: '.some-root' })
})

it('change every rule inside @document rules', async () => {
  await run('@document url("https://www.example.com/") {.some-class{color: red}}', '@document url("https://www.example.com/") {.some-root .some-class{color: red}}', { rootSelector: '.some-root' })
})

it('change every rule inside @supports rules', async () => {
  await run('@supports (animation-name: test) {.some-class{color: red}}', '@supports (animation-name: test) {.some-root .some-class{color: red}}', { rootSelector: '.some-root' })
})

it('do not change @keyframes rules', async () => {
  await run('@keyframes some-transition{0%{opacity: 0}100%{opacity: 1}}', '@keyframes some-transition{0%{opacity: 0}100%{opacity: 1}}', { rootSelector: '.some-root' })
})

it('replace :root with new root', async () => {
  await run(':root{--some-var: 12px}', '.some-root{--some-var: 12px}', { rootSelector: '.some-root' })
})

it('adds root to * (all) selector-lists', async () => {
  await run('*,*::before{box-sizing: border-box;}', '.some-root,.some-root *,.some-root *::before{box-sizing: border-box;}', { rootSelector: '.some-root' })
})

it('do not change root selector itself', async () => {
  await run('.some-root{margin:0}', '.some-root{margin:0}', { rootSelector: '.some-root' })
})

it('should include files', async () => {
  await run('a{color: red}', '.some-root a{color: red}', { rootSelector: '.some-root', include: ['some.css'] }, 'some.css')
})

it('should exclude files', async () => {
  await run('a{color: red}', 'a{color: red}', { rootSelector: '.some-root', exclude: ['some.css'] }, 'some.css')
})

it('should ignore empty exclude and include lists', async () => {
  await run('a{color: red}', '.some-root a{color: red}', { rootSelector: '.some-root', exclude: [], include: [] }, 'some.css')
})

it('works with postcss v7 and v8', async () => {
  const input = '.some-root{margin:0}'
  const output = '.some-root{margin:0}'
  const opts = { rootSelector: '.some-root' }
  const result = await postcss([plugin.versionFormat(postcss)(opts)]).process(input, { from: undefined })
  const result7 = await postcss7([plugin.versionFormat(postcss7)(opts)]).process(input, { from: undefined })
  expect(result.css).toEqual(output)
  expect(result7.css).toEqual(output)
  expect(result.warnings()).toHaveLength(0)
  expect(result7.warnings()).toHaveLength(0)
})

it('complex example should work', async () => {
  await run(`\
.foo {
  color: red;
}

a.foo,
section {
  color: red;
}

@media (max-width: 700px) {
  #some-id {
    color: red;
  }
}

/* html and body selectors will be popped up */
html,
body.desktop {
  font-family: sans-serif;
}

body.desktop .bar {
  font-weight: bold;
}

:root {
  --some-var: 10px;
}`, `\
.some-root .foo {
  color: red;
}

.some-root a.foo,
.some-root section {
  color: red;
}

@media (max-width: 700px) {
  .some-root #some-id {
    color: red;
  }
}

/* html and body selectors will be popped up */
html .some-root,
body.desktop .some-root {
  font-family: sans-serif;
}

body.desktop .some-root .bar {
  font-weight: bold;
}

.some-root {
  --some-var: 10px;
}`, { rootSelector: '.some-root' })
})
