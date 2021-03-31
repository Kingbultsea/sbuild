const fs = require('fs')
const { parse } = require('@vue/compiler-sfc')

const cache = new Map()

exports.parseSFC = filename => {
  const content = fs.readFileSync(filename, 'utf-8')
  const { descriptor, errors } = parse(content, { // descriptor 可以去查看vue compiler-sfc的包 过程是AST 转换 VUE模式的AST style script template filename
    filename
  })

  if (errors) {
    // TODO
  }

  const prev = cache.get(filename) // 获取缓存
  cache.set(filename, descriptor)
  console.log(descriptor)
  return [descriptor, prev]
}
