'use strict'
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod }
  }
Object.defineProperty(exports, '__esModule', { value: true })
const razorpay_1 = __importDefault(require('razorpay'))
require('dotenv').config()
const razorpayInstance = new razorpay_1.default({
  key_id: process.env.RAZORPAY_KEYID,
  key_secret: process.env.RAZORPAY_SECRET,
})
exports.default = razorpayInstance
