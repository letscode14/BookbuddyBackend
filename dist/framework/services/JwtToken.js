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
Object.defineProperty(exports, '__esModule', { value: true })
const jsonwebtoken_1 = __importStar(require('jsonwebtoken'))
class JwtTokenService {
  SignInAccessToken(user) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const token = jsonwebtoken_1.default.sign(
          Object.assign({}, user),
          process.env.ACCESS_TOKEN_SECRET,
          {
            expiresIn: '30min',
          }
        )
        if (token) return token
        return ''
      } catch (error) {
        console.log(error)
        return ''
      }
    })
  }
  SignInRefreshToken(user) {
    return __awaiter(this, void 0, void 0, function* () {
      const token = jsonwebtoken_1.default.sign(
        Object.assign({}, user),
        process.env.REFRESH_TOKEN_SECRET,
        {
          expiresIn: '30d',
        }
      )
      if (token) return token
      return ''
    })
  }
  SignUpActivationToken(user, code) {
    return __awaiter(this, void 0, void 0, function* () {
      const token = jsonwebtoken_1.default.sign(
        { user, code },
        process.env.ACTIVATION_TOKEN_SECRET,
        {
          expiresIn: '2m',
        }
      )
      return token
    })
  }
  verifyOtpToken(activationToken, otp) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const payload = jsonwebtoken_1.default.verify(
          activationToken,
          process.env.ACTIVATION_TOKEN_SECRET
        )
        console.log('otp totken payload', payload)
        if (otp == 'resend') {
          return payload
        }
        if (payload.code == otp) {
          return payload
        } else {
          return { status: false, message: 'Otp Does not match' }
        }
      } catch (error) {
        if (error instanceof jsonwebtoken_1.TokenExpiredError) {
          return { status: false, message: 'Token expired try to again' }
        }
        return { status: false, message: 'Jwt error' }
      }
    })
  }
  SignInAdminAccessToken(admin) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const token = jsonwebtoken_1.default.sign(
          { admin },
          process.env.ADMIN_ACCESS_SECRET,
          {
            expiresIn: '30min',
          }
        )
        return token
      } catch (error) {
        console.log(error)
        return ''
      }
    })
  }
  SignInAdminRefreshToken(admin) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const token = jsonwebtoken_1.default.sign(
          { admin },
          process.env.ADMIN_REFRESH_SECRET,
          { expiresIn: '30d' }
        )
        return token
      } catch (error) {
        console.log(error)
        return ''
      }
    })
  }
  //token after login to generate new pass word
  signChangePassTokenOtp(user, code, email) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const token = jsonwebtoken_1.default.sign(
          { user, code, email },
          process.env.ACTIVATION_TOKEN_SECRET,
          {
            expiresIn: '2m',
          }
        )
        if (token) return token
        else return null
      } catch (error) {
        console.log(error)
        return ''
      }
    })
  }
  signChangePassToken(user) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const token = jsonwebtoken_1.default.sign(
          { user },
          process.env.ACTIVATION_TOKEN_SECRET,
          {
            expiresIn: '5m',
          }
        )
        if (token) return token
        else return null
      } catch (error) {
        console.log(error)
        return ''
      }
    })
  }
  verifyChangePassToken(activationToken) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const payload = jsonwebtoken_1.default.verify(
          activationToken,
          process.env.ACTIVATION_TOKEN_SECRET
        )
        if (payload) {
          return payload
        }
        return {
          status: false,
          message: 'unexpected error',
        }
      } catch (error) {
        if (error instanceof jsonwebtoken_1.TokenExpiredError) {
          return { status: false, message: 'Token expired try to again' }
        }
        return { status: false, message: 'Jwt error' }
      }
    })
  }
}
exports.default = JwtTokenService
