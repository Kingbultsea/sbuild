const fs = require('fs')
const path = require('path')
const chokidar = require('chokidar')
const { parseSFC } = require('./parseSFC')

exports.createFileWatcher = (notify) => {
  const fileWatcher = chokidar.watch(process.cwd(), {
    ignored: [/node_modules/]
  })

  fileWatcher.on('change', async (file) => {
    const resourcePath = '/' + path.relative(process.cwd(), file)
    if (file.endsWith('.vue')) {
      // check which part of the file changed
      const [descriptor, prevDescriptor] = await parseSFC(file)
      if (!prevDescriptor) {
        // the file has never been accessed yet
        return
      }

      if (
        (descriptor.script && descriptor.script.content) !== // && true 的情况下 取后者
        (prevDescriptor.script && prevDescriptor.script.content) // 对比script字符串有没有发生变化，空格也算变化
      ) {
        console.log(`[hmr:reload] ${resourcePath}`)
        notify({
          type: 'reload',
          path: resourcePath
        })
        return
      }

      if (
        (descriptor.template && descriptor.template.content) !==
        (prevDescriptor.template && prevDescriptor.template.content)
      ) {
        console.log(`[hmr:rerender] ${resourcePath}`)
        notify({
          type: 'rerender',
          path: resourcePath
        })
        return
      }

      // TODO styles
    } else {
      console.log(`[hmr:full-reload] ${resourcePath}`)
      notify({
        type: 'full-reload'
      })
    }
  })
}
