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
Object.defineProperty(exports, '__esModule', { value: true })
class ChatController {
  constructor(userCase) {
    this.userCase = userCase
  }
  getChat(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const result = yield this.userCase.getChat(req)
        res.status(result.statusCode).json(Object.assign({}, result))
      } catch (error) {
        console.log(error)
        next(error)
      }
    })
  }
  getAllchat(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const result = yield this.userCase.getAllChat(req)
        res.status(result.statusCode).json(Object.assign({}, result))
      } catch (error) {
        console.log(error)
        next(error)
      }
    })
  }
  sendMessage(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const result = yield this.userCase.sendMessage(req)
        res.status(result.statusCode).json(Object.assign({}, result))
      } catch (error) {
        console.log(error)
        next(error)
      }
    })
  }
  getAllMessages(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const { chatId, pageNo } = req.query
        const result = yield this.userCase.getAllMessages(chatId, pageNo)
        res.status(result.statusCode).json(Object.assign({}, result))
      } catch (error) {
        console.log(error)
        next(error)
      }
    })
  }
  makeMsgRead(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const { messageId } = req.params
        const result = yield this.userCase.makeMsgRead(messageId)
        res.status(result.statusCode).json(Object.assign({}, result))
      } catch (error) {
        console.log(error)
        next(error)
      }
    })
  }
  declineRequest(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const result = yield this.userCase.declineRequest(req)
        res.status(result.statusCode).json(Object.assign({}, result))
      } catch (error) {
        console.log(error)
        next(error)
      }
    })
  }
  acceptRequest(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const result = yield this.userCase.acceptRequest(req)
        res.status(result.statusCode).json(Object.assign({}, result))
      } catch (error) {
        console.log(error)
        next(error)
      }
    })
  }
}
exports.default = ChatController
