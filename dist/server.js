'use strict'
var __awaiter =
  (this && this.__awaiter) ||
  function (thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function (resolve) {
            resolve(value)
          })
    }
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value))
        } catch (e) {
          reject(e)
        }
      }
      function rejected(value) {
        try {
          step(generator['throw'](value))
        } catch (e) {
          reject(e)
        }
      }
      function step(result) {
        result.done
          ? resolve(result.value)
          : adopt(result.value).then(fulfilled, rejected)
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next())
    })
  }
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod }
  }
Object.defineProperty(exports, '__esModule', { value: true })
const app_1 = __importDefault(require('./framework/config/app'))
const connectDB_1 = require('./framework/config/connectDB')
const socketService_1 = require('./framework/services/socketService')
const agenda_1 = __importDefault(require('./framework/config/agenda'))
const worker_threads_1 = require('worker_threads')
const path_1 = __importDefault(require('path'))
const http_1 = __importDefault(require('http'))
const dotenv_1 = require('dotenv')
;(0, dotenv_1.config)()
const startWorker = () => {
  const worker = new worker_threads_1.Worker(
    path_1.default.resolve(__dirname, 'framework/services/Worker.js'),
    {
      execArgv: ['-r', 'ts-node/register'],
    }
  )
  worker.on('message', (message) => {
    if (message.status === 'complete') {
      console.log('User loading complete')
    } else if (message.status === 'error') {
      console.error('Error loading users:', message.error)
    } else if (message.status === 'updatebadgecomplete') {
      console.log('Update badge success fully')
    } else if (message.status == 'bagdeerror') {
      console.log('error  in updating the badge')
    }
  })
  worker.on('error', (error) => {
    console.error('Worker error:', error)
  })
  worker.postMessage({ action: 'loadUsers' })
}
const startServer = () =>
  __awaiter(void 0, void 0, void 0, function* () {
    try {
      yield (0, connectDB_1.connecDB)()
      const app = (0, app_1.default)()
      const server = http_1.default.createServer(app)
      const port = process.env.PORT
      ;(0, socketService_1.initSocketsever)(server)
      yield agenda_1.default.start()
      yield agenda_1.default.every('5 hours', 'updateBadge')
      server === null || server === void 0
        ? void 0
        : server.listen(port, () => {
            console.log('server is running at port ', port)
          })
      startWorker()
    } catch (error) {
      console.log(error)
    }
  })
startServer()
