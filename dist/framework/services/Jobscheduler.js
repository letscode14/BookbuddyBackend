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
const path_1 = __importDefault(require('path'))
const worker_threads_1 = require('worker_threads')
const worker = new worker_threads_1.Worker(
  path_1.default.resolve(__dirname, 'Worker.js')
)
class JobScheduler {
  constructor(agenda, userRepository) {
    this.agenda = agenda
    this.userRepository = userRepository
  }
  start() {
    return __awaiter(this, void 0, void 0, function* () {
      this.agenda.on('start', () => {
        console.log(`Job scheduler active`)
      })
      this.agenda.on('error', (error) => {
        console.error('Agenda encountered an error:', error)
      })
      this.agenda.define('removeStory', (job) =>
        __awaiter(this, void 0, void 0, function* () {
          const { userId, storyId } = job.attrs.data
          const story = yield this.userRepository.removeStory(userId, storyId)
          if (story) {
            console.log(`Removed story`)
          } else {
            console.log(`story not found`)
          }
        })
      )
      this.agenda.define('requestExpiry', (job) =>
        __awaiter(this, void 0, void 0, function* () {
          const { requestId } = job.attrs.data
          const story = yield this.userRepository.makeRequestExpirey(requestId)
          if (story) {
            console.log(`made request expired`, requestId)
          } else {
            console.log(`error in scheduling job `)
          }
        })
      )
      this.agenda.define('updateRemainingDays', (job) =>
        __awaiter(this, void 0, void 0, function* () {
          const { borrowId, lendedId } = job.attrs.data
          const result = yield this.userRepository.updateRemainingDays(
            borrowId,
            lendedId
          )
        })
      )
      this.agenda.define('updateBadge', () =>
        __awaiter(this, void 0, void 0, function* () {
          worker.postMessage({ action: 'updateBadge' })
        })
      )
    })
  }
}
exports.default = JobScheduler
