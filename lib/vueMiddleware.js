const fs = require('fs')
const url = require('url')
const path = require('path')
const qs = require('querystring')
const { parseSFC } = require('./parseSFC')
const { compileTemplate } = require('@vue/compiler-sfc')
const { sendJS } = require('./utils')

module.exports = (req, res) => {
  const parsed = url.parse(req.url, true)
  const query = parsed.query
  const filename = path.join(process.cwd(), parsed.pathname.slice(1))
  const [descriptor] = parseSFC(filename) // 获取到路径后 获取vue版AST语法树
  if (!query.type) { // 没有任何参数 直接输出js文件
    let code = ``
    // TODO use more robust rewrite
    if (descriptor.script) {
      code += descriptor.script.content.replace(
        `export default`,
        'const script ='
      )
      code += `\nexport default script`
    }
    if (descriptor.template) {
      code += `\nimport { render } from ${JSON.stringify(
        parsed.pathname + `?type=template${query.t ? `&t=${query.t}` : ``}`
      )}`
      code += `\nscript.render = render`
    }
    if (descriptor.style) { // 还没做
      // TODO
    }
    code += `\nscript.__hmrId = ${JSON.stringify(parsed.pathname)}`
    return sendJS(res, code)
  }

  if (query.type === 'template') { // http://localhost:3000/file-vue/test.vue?type=template
    // 获取template 转换而成的 render
    const { code, errors } = compileTemplate({
      source: descriptor.template.content,
      filename,
      compilerOptions: {
        runtimeModuleName: '/vue.js'
      }
    })

    if (errors) {
      // TODO
    }
    return sendJS(res, code)
  }

  if (query.type === 'style') {
    // TODO
    return
  }

  // TODO custom blocks
}
