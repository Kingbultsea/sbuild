const fs = require('fs')
const path = require('path')
const http = require('http')
const url = require('url')
const ws = require('ws')
const serve = require('serve-handler')
const vue = require('./vueMiddleware')
const { moduleMiddleware } = require('./moduleMiddleware')
const { createFileWatcher } = require('./hmrWatcher')
const { sendJS } = require('./utils')
const { rewrite } = require('./moduleRewriter')

const hmrClientCode = fs.readFileSync(path.resolve(__dirname, './hmrClient.js'))  // 代理信息 connected reload rerender update-style full-reload

const server = http.createServer((req, res) => {
  const pathname = url.parse(req.url).pathname
  if (pathname === '/__hmrClient') {
    return sendJS(res, hmrClientCode)
  } else if (pathname.startsWith('/__modules/')) {
    return moduleMiddleware(pathname.replace('/__modules/', ''), res)
  } else if (pathname.endsWith('.vue')) {
    return vue(req, res)  // 发送vue文件 需要vue中间件 （@vue/compiler-sfc）
  } else if (pathname.endsWith('.js')) { // 发送JS
    const filename = path.join(process.cwd(), pathname.slice(1))
    if (fs.existsSync(filename)) {
      const content = rewrite(fs.readFileSync(filename, 'utf-8'))
      return sendJS(res, content)
    }
  }

  serve(req, res, {
    rewrites: [{ source: '**', destination: '/index.html' }]
  })
})

const wss = new ws.Server({ server }) // server {http.Server|https.Server} A pre-created Node.js HTTP/S server.
const sockets = new Set()
wss.on('connection', (socket) => {
  sockets.add(socket)
  socket.send(JSON.stringify({ type: 'connected' }))
  socket.on('close', () => {
    sockets.delete(socket) // 删除
  })
})

createFileWatcher((payload) => // 建立文件监听
  sockets.forEach((s) => s.send(JSON.stringify(payload))) // 因为我们可以有多个窗口打开 所以会存在多个socket链接
)

// TODO customized port
server.listen(3000, () => {
  console.log('Running at http://localhost:3000')
})
