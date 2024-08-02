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
const worker_threads_1 = require('worker_threads')
const connectDB_1 = require('../config/connectDB')
const userModel_1 = __importDefault(require('../databases/userModel'))
const userRepository_1 = __importDefault(
  require('../repository/userRepository')
)
const redis_1 = require('../config/redis')
const userRepository = new userRepository_1.default()
function loadAllUsers() {
  return __awaiter(this, void 0, void 0, function* () {
    try {
      yield (0, connectDB_1.connecDB)()
      console.log('Worker: Attempting to load users...')
      const cacheKey = 'blockedUsers'
      const blockedUsers = yield userModel_1.default
        .find({ isBlocked: true })
        .select('_id')
        .lean()
      yield redis_1.redis.set(
        cacheKey,
        JSON.stringify(blockedUsers),
        'EX',
        86400
      )
      console.log('All blocked users are looaded')
      worker_threads_1.parentPort === null ||
      worker_threads_1.parentPort === void 0
        ? void 0
        : worker_threads_1.parentPort.postMessage({ status: 'complete' })
    } catch (error) {
      console.error('Error loading blocked users:', error)
      if (worker_threads_1.parentPort) {
        worker_threads_1.parentPort.postMessage({ status: 'error', error })
      }
    }
  })
}
function updateBadge() {
  return __awaiter(this, void 0, void 0, function* () {
    try {
      yield (0, connectDB_1.connecDB)()
      yield userRepository.updateBadge()
      worker_threads_1.parentPort === null ||
      worker_threads_1.parentPort === void 0
        ? void 0
        : worker_threads_1.parentPort.postMessage({
            status: 'updatebadgecomplete',
          })
    } catch (error) {
      console.error('Error updating the badge:', error)
      if (worker_threads_1.parentPort) {
        worker_threads_1.parentPort.postMessage({ status: 'bagdeerror', error })
      }
    }
  })
}
worker_threads_1.parentPort === null || worker_threads_1.parentPort === void 0
  ? void 0
  : worker_threads_1.parentPort.on('message', (message) =>
      __awaiter(void 0, void 0, void 0, function* () {
        if (message.action === 'loadUsers') {
          yield loadAllUsers()
        }
      })
    )
worker_threads_1.parentPort === null || worker_threads_1.parentPort === void 0
  ? void 0
  : worker_threads_1.parentPort.on('message', (message) =>
      __awaiter(void 0, void 0, void 0, function* () {
        if (message.action == 'updateBadge') {
          yield updateBadge()
        }
      })
    )
