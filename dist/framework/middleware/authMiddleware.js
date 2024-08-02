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
exports.authMiddleware = void 0
const jsonwebtoken_1 = __importStar(require('jsonwebtoken'))
const JwtToken_1 = __importDefault(require('../services/JwtToken'))
const redis_1 = require('../config/redis')
const jwtToken = new JwtToken_1.default()
const authMiddleware = (req, res, next) =>
  __awaiter(void 0, void 0, void 0, function* () {
    const authHeader = req.headers['authorization']
    const bearerToken = authHeader && authHeader.split(' ')[1]
    if (!bearerToken) {
      return res.status(401).json({ message: 'Token missing' })
    }
    try {
      const decoded = jsonwebtoken_1.default.verify(
        bearerToken,
        process.env.ACCESS_TOKEN_SECRET
      )
      req.user = decoded
      const userId = decoded.id
      redis_1.redis.get('blockedUsers', (err, cachedData) => {
        if (cachedData) {
          const blockedUserIds = JSON.parse(cachedData)
          if (blockedUserIds.length > 0) {
            const isBlocked = blockedUserIds.some((u) => u._id === userId)
            if (isBlocked) {
              return res.status(403).json({ message: 'User is blocked' })
            }
          }
        }
        next()
      })
    } catch (error) {
      if (error instanceof jsonwebtoken_1.TokenExpiredError) {
        try {
          const refreshToken = req.cookies.refreshToken
          if (!refreshToken) {
            return res
              .status(401)
              .json({ message: 'Refresh Token not Available' })
          }
          const decoded = jsonwebtoken_1.default.verify(
            refreshToken,
            process.env.REFRESH_TOKEN_SECRET
          )
          const user = {
            role: decoded.role,
            id: decoded.id,
          }
          const newAccessToken = yield jwtToken.SignInAccessToken(user)
          req.user = decoded
          return res.status(401).json({
            accessToken: newAccessToken,
            message: 'AccessToken Expired',
          })
        } catch (error) {
          console.log(error)
          if (error instanceof jsonwebtoken_1.TokenExpiredError) {
            return res.status(401).json({ message: 'RefreshToken Expired' })
          }
        }
      }
    }
  })
exports.authMiddleware = authMiddleware
