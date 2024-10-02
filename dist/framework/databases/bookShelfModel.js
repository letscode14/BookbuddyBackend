'use strict'
var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? function (o, m, k, k2) {
        if (k2 === undefined) k2 = k
        var desc = Object.getOwnPropertyDescriptor(m, k)
        if (
          !desc ||
          ('get' in desc ? !m.__esModule : desc.writable || desc.configurable)
        ) {
          desc = {
            enumerable: true,
            get: function () {
              return m[k]
            },
          }
        }
        Object.defineProperty(o, k2, desc)
      }
    : function (o, m, k, k2) {
        if (k2 === undefined) k2 = k
        o[k2] = m[k]
      })
var __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? function (o, v) {
        Object.defineProperty(o, 'default', { enumerable: true, value: v })
      }
    : function (o, v) {
        o['default'] = v
      })
var __importStar =
  (this && this.__importStar) ||
  function (mod) {
    if (mod && mod.__esModule) return mod
    var result = {}
    if (mod != null)
      for (var k in mod)
        if (k !== 'default' && Object.prototype.hasOwnProperty.call(mod, k))
          __createBinding(result, mod, k)
    __setModuleDefault(result, mod)
    return result
  }
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod }
  }
Object.defineProperty(exports, '__esModule', { value: true })
const mongoose_1 = __importStar(require('mongoose'))
const shortid_1 = __importDefault(require('shortid'))
const ShelfSchema = new mongoose_1.default.Schema({
  addedOn: {
    type: Date,
    default: Date.now,
  },
  author: {
    type: String,
    required: true,
  },
  bookName: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  ID: {
    type: String,
    default: () => `BOOK${shortid_1.default.generate()}`,
  },
  imageUrl: {
    type: {
      publicId: { type: String, required: true },
      secure_url: { type: String, required: true },
    },
    requiured: true,
  },
  limit: {
    type: Number,
    required: true,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
  isRemoved: {
    type: Boolean,
    default: false,
  },
  status: {
    type: String,
    enum: ['Available', 'Lended'],
    default: 'Available',
    required: true,
  },
  location: {
    type: {
      address: {
        type: String,
        required: true,
      },
      lat: {
        type: Number,
        required: true,
      },
      lng: {
        type: Number,
        required: true,
      },
    },
  },
  price: {
    type: Number,
    required: true,
  },
})
const BorrowedSchema = new mongoose_1.default.Schema({
  requestId: {
    type: mongoose_1.Schema.Types.ObjectId,
    required: true,
    ref: 'Requests',
  },
  from: {
    type: mongoose_1.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  isReturned: {
    type: Boolean,
    required: true,
    default: false,
  },
  remainingDays: {
    type: Number,
    required: true,
  },
  reportsMade: [
    {
      type: mongoose_1.default.Types.ObjectId,
      ref: 'Report',
      default: [],
    },
  ],
  keepingTime: {
    type: Date,
    required: true,
  },
  borrowedOn: {
    type: Date,
    default: new Date().getTime(),
  },
})
const LendedSchema = new mongoose_1.default.Schema({
  requestId: {
    type: mongoose_1.Schema.Types.ObjectId,
    required: true,
    ref: 'Requests',
  },
  earnedScore: {
    type: String,
    required: true,
  },
  isReturned: {
    type: Boolean,
    required: true,
    default: false,
  },
  lendedTo: {
    type: mongoose_1.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  remainingDays: {
    type: Number,
    required: true,
  },
  reportsMade: [
    {
      type: mongoose_1.default.Types.ObjectId,
      ref: 'Report',
      default: [],
    },
  ],
  keepingTime: {
    type: Date,
    required: true,
  },
  lendedOn: {
    type: Date,
    default: () => new Date().getTime(),
  },
  hasMadeRefund: {
    type: Boolean,
    default: false,
  },
})
const BookShelfSchema = new mongoose_1.default.Schema({
  userId: {
    type: mongoose_1.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  shelf: {
    type: [ShelfSchema],
    default: [],
  },
  borrowed: {
    type: [BorrowedSchema],
    default: [],
  },
  lended: {
    type: [LendedSchema],
    default: [],
  },
  isRestricted: {
    type: Boolean,
    required: true,
    default: false,
  },
})
const BookshelfModel = mongoose_1.default.model('BookShelf', BookShelfSchema)
exports.default = BookshelfModel
