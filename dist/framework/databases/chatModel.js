'use strict'
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod }
  }
Object.defineProperty(exports, '__esModule', { value: true })
const mongoose_1 = __importDefault(require('mongoose'))
const mongoose_2 = require('mongoose')
const chatSchema = new mongoose_2.Schema(
  {
    participants: [
      { type: mongoose_2.Schema.Types.ObjectId, ref: 'User', required: true },
    ],
    chatBackground: {
      publicId: {
        type: String,
        default: 'chat_default_r0plmt',
      },
      secureUrl: {
        type: String,
        default:
          'https://res.cloudinary.com/dcoy7olo9/image/upload/v1720547395/chat_defualt_r0plmt.jpg',
      },
    },
    sender: [
      { type: mongoose_2.Schema.Types.ObjectId, ref: 'User', required: true },
    ],
    lastMessage: {
      messageId: {
        type: mongoose_2.Schema.Types.ObjectId || null,
        ref: 'Message',
        default: null,
      },
      timeStamp: {
        type: Date,
        required: true,
        default: Date.now(),
      },
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
)
const ChatModel = mongoose_1.default.model('Chat', chatSchema)
exports.default = ChatModel
