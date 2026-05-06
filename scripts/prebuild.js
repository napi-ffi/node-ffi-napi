const { execFileSync } = require('child_process')

execFileSync(process.execPath, [
  require.resolve('prebuildify/bin.js'),
  '--napi',
  '--tag-armv',
  '--tag-uv',
  '--strip',
  '--target', process.versions.node
], { stdio: 'inherit' })
