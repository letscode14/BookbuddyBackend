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
class PaymentContoller {
  constructor(userCase) {
    this.userCase = userCase
  }
  createOrder(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const { amount, id } = req.body
        const result = yield this.userCase.createOrder(amount, id)
        res.status(result.statusCode).json(Object.assign({}, result))
      } catch (error) {
        console.log(error)
        next(error)
      }
    })
  }
  verifyPayment(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const { orderId, paymentId, signature, userId } = req.body
        const result = yield this.userCase.verifyPayment(
          orderId,
          paymentId,
          signature,
          userId
        )
        res.status(result.statusCode).json(Object.assign({}, result))
      } catch (error) {
        console.log(error)
      }
    })
  }
  addFundsOrder(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const { userId, email } = req.body
        const result = yield this.userCase.addOrderFunds(userId, email)
        res.status(result.statusCode).json(Object.assign({}, result))
      } catch (error) {
        console.log(error)
        next(error)
      }
    })
  }
  verifyAddFundsPayment(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const { orderId, paymentId, signature, userId, amount } = req.body
        const result = yield this.userCase.verifyaddFundsPayment(
          orderId,
          paymentId,
          signature,
          userId,
          Number(amount)
        )
        res.status(result.statusCode).json(Object.assign({}, result))
      } catch (error) {
        console.log(error)
        next(error)
      }
    })
  }
}
exports.default = PaymentContoller
