const fs = require('fs')
const path = require('path')
const http = require('http')
const url = require('url')
const ws = require('ws')
const serve = require('serve-handler')
const vue = require('./vueMiddleware')
const { createFileWatcher } = require('./fileWatcher')
const { sendJS } = require('./utils')

// 是给前端的
const hmrProxy = fs.readFileSync(path.resolve(__dirname, './hmrProxy.js')) // 代理信息 connected reload rerender update-style full-reload

const server = http.createServer((req, res) => {
  const pathname = url.parse(req.url).pathname
  if (pathname === '/__hmrProxy') {
    sendJS(res, hmrProxy) // 发送 ./hmrProxy.js 的js文件
  } else if (pathname.endsWith('.vue')) {
    vue(req, res) // 发送vue文件 需要vue中间件 （@vue/compiler-sfc）
  } else {
    serve(req, res)
  }
})

const wss = new ws.Server({ server }) // server {http.Server|https.Server} A pre-created Node.js HTTP/S server.
const sockets = new Set()
wss.on('connection', (socket) => {
  sockets.add(socket)
  socket.send(JSON.stringify({ type: 'connected'})) // 发送数据都通过JSON的形式
  socket.on('close', () => {
    sockets.delete(socket) // 删除
  })
})

createFileWatcher((payload) => // 建立文件监听
  sockets.forEach((s) => s.send(JSON.stringify(payload))) // 因为我们可以有多个窗口打开 所以会存在多个socket链接
)

server.listen(3000, () => {
  console.log('Running at http://localhost:3000')
})
