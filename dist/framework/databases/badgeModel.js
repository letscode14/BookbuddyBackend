'use strict'
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod }
  }
Object.defineProperty(exports, '__esModule', { value: true })
const mongoose_1 = __importDefault(require('mongoose'))
const shortid_1 = __importDefault(require('shortid'))
const BadgeSchema = new mongoose_1.default.Schema({
  name: {
    type: String,
    required: true,
  },
  ID: {
    type: String,
    required: true,
    default: () => `BADGE${shortid_1.default.generate()}`,
  },
  createdOn: {
    type: Date,
    required: true,
    default: Date.now(),
  },
  minScore: {
    type: Number,
    required: true,
  },
  iconUrl: {
    type: {
      secureUrl: String,
      publicId: String,
    },
    required: true,
  },
  updatedOn: {
    type: Date,
    required: true,
    default: Date.now(),
  },
  limit: {
    type: Number,
    required: true,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
})
const BadgeModel = mongoose_1.default.model('Badge', BadgeSchema)
exports.default = BadgeModel
