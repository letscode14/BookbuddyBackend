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
const mongoose_1 = __importDefault(require('mongoose'))
const bcryptjs_1 = __importDefault(require('bcryptjs'))
const userSchema = new mongoose_1.default.Schema({
  userName: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  paymentId: {
    type: String || null,
    default: null,
  },
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  age: {
    type: Number,
    default: 0,
  },
  reportsMade: [
    {
      type: mongoose_1.default.Types.ObjectId,
      ref: 'Report',
      default: [],
    },
  ],
  reportCount: [
    {
      type: mongoose_1.default.Types.ObjectId,
      ref: 'Report',
      default: [],
    },
  ],
  cautionDeposit: {
    type: Number,
    default: 0,
  },
  isSubscribed: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  updateAt: {
    type: Date,
    default: Date.now(),
  },
  followers: {
    type: [
      {
        userId: {
          type: mongoose_1.default.Types.ObjectId,
          ref: 'User',
        },
        followedOn: {
          type: Date,
          default: Date.now(),
        },
      },
    ],
    default: [],
  },
  following: {
    type: [
      {
        userId: {
          type: mongoose_1.default.Types.ObjectId,
          ref: 'User',
        },
        followedOn: {
          type: Date,
          default: Date.now(),
        },
      },
    ],
    default: [],
  },
  gender: {
    type: String,
    default: '',
  },
  profile: {
    publicId: {
      type: String,
      default: '',
    },
    profileUrl: {
      type: String,
      default:
        'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png',
    },
  },
  privacy: {
    type: Boolean,
    default: false,
  },
  about: {
    type: String,
    default: '',
  },
  contact: {
    type: String,
    default: '',
  },
  lendscore: {
    type: null || mongoose_1.default.Types.ObjectId,
    default: null,
    ref: 'Lendscore',
  },
  isBlocked: {
    type: Boolean,
    default: false,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
  role: {
    type: String,
    default: 'user',
  },
  isGoogleSignUp: {
    type: Boolean,
    default: false,
  },
  location: {
    type: {
      address: {
        type: String,
        required: true,
        default: '',
      },
      lat: {
        type: Number,
        required: true,
        default: 0,
      },
      lng: {
        type: Number,
        required: true,
        default: 0,
      },
    },
  },
})
userSchema.pre('save', function (next) {
  return __awaiter(this, void 0, void 0, function* () {
    if (!this.isModified('password')) {
      next()
    }
    this.password = yield bcryptjs_1.default.hash(this.password, 10)
    next()
  })
})
userSchema.index({ userName: 'text', name: 'text' })
const userModel = mongoose_1.default.model('User', userSchema)
exports.default = userModel
