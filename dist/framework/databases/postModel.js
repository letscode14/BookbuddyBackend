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
const ReplySchema = new mongoose_1.default.Schema({
  content: { type: String, required: true },
  author: {
    type: mongoose_1.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  likes: { type: [mongoose_1.Schema.Types.ObjectId], ref: 'User', default: [] },
  createdAt: { type: Date, default: Date.now },
})
const CommentSchema = new mongoose_1.default.Schema({
  content: { type: String, required: true },
  author: {
    type: mongoose_1.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  likes: { type: [mongoose_1.Schema.Types.ObjectId], ref: 'User', default: [] },
  replies: { type: [ReplySchema], default: [] },
  createdAt: { type: Date, default: Date.now },
})
const postSchema = new mongoose_1.default.Schema({
  userId: {
    type: mongoose_1.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  description: {
    type: String,
    required: true,
    default: 'Not Added',
  },
  ID: {
    type: String,
    default: () => `POST${shortid_1.default.generate()}`,
  },
  reportCount: {
    type: Number,
    default: 0,
  },
  imageUrls: [
    {
      publicId: {
        type: String,
        required: true,
      },
      secure_url: {
        type: String,
        required: true,
      },
    },
  ],
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  likes: [
    {
      type: mongoose_1.Schema.Types.ObjectId,
      ref: 'User',
    },
  ],
  isAddedToBookShelf: {
    type: mongoose_1.default.Schema.Types.ObjectId,
    default: null,
    ref: 'BookShelf',
  },
  comments: {
    type: [CommentSchema],
    default: [],
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
  isRemoved: {
    type: Boolean,
    default: false,
  },
})
const postModel = mongoose_1.default.model('Post', postSchema)
exports.default = postModel
