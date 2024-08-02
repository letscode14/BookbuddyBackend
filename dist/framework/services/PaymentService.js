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
const crypto_1 = __importDefault(require('crypto'))
const shortid_1 = __importDefault(require('shortid'))
const razorpayConfig_1 = __importDefault(require('../config/razorpayConfig'))
class PaymentService {
  constructor() {
    this.razorpayInstance = razorpayConfig_1.default
  }
  createOrder(amount, user) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const options = {
          amount: 1000 * 100,
          currency: 'INR',
          receipt: `PY${shortid_1.default.generate()}`,
          notes: {
            email: user.email,
            contact: user.contact,
            name: user.name,
          },
        }
        const order = yield this.razorpayInstance.orders.create(options)
        return order
      } catch (error) {
        console.log(error)
      }
    })
  }
  verifyPaymentSignature(order_id, payment_id, signature) {
    return __awaiter(this, void 0, void 0, function* () {
      const hmac = crypto_1.default.createHmac(
        'sha256',
        process.env.RAZORPAY_SECRET
      )
      hmac.update(`${order_id}|${payment_id}`)
      const generatedSignature = hmac.digest('hex')
      return generatedSignature === signature
    })
  }
  createRefund(payment_id, amount, notes, userId) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const response = yield razorpayConfig_1.default.payments.refund(
          payment_id,
          {
            amount: amount * 100,
            speed: 'optimum',
            notes: {
              note_key_1: notes,
            },
            receipt: shortid_1.default.generate(),
          }
        )
        if (response) {
          return response
        }
        return null
      } catch (error) {
        console.log(error)
        return null
      }
    })
  }
  //create add funds order
  createAddFundsOrder(amount, user) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const options = {
          amount: amount * 100,
          currency: 'INR',
          receipt: `PY${shortid_1.default.generate()}`,
          notes: {
            email: user.email,
            contact: user.contact,
            name: user.name,
          },
        }
        const order = yield this.razorpayInstance.orders.create(options)
        return order
      } catch (error) {
        console.log(error)
      }
    })
  }
}
exports.default = PaymentService
