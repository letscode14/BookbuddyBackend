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
exports.fileParser = void 0
const formidable_1 = __importDefault(require('formidable'))
const fileParser = (req, res, next) =>
  __awaiter(void 0, void 0, void 0, function* () {
    try {
      const form = (0, formidable_1.default)()
      const [fields, files] = yield form.parse(req)
      const validImageMimeTypes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/svg+xml',
      ]
      if (!req.body) req.body = {}
      for (let key in fields) {
        const value = fields[key]
        if (value) req.body[key] = value[0]
      }
      if (!req.files) req.files = {}
      for (let key in files) {
        const value = files[key]
        if (value) {
          if (value.length > 1) {
            const isValid = value.every((file) =>
              validImageMimeTypes.includes(file.mimetype)
            )
            if (!isValid) {
              res.status(415).json({
                messages: 'Only allow extensions which are .jpg,.web,.png,.svg',
              })
              return
            }
            req.files[key] = value
          } else {
            const isValid = validImageMimeTypes.includes(value[0].mimetype)
            if (!isValid) {
              res.status(415).json({
                messages: 'Only allow extensions which are .jpg,.web,.png,.svg',
              })
              return
            }
            req.files[key] = value[0]
          }
        }
      }
      next()
    } catch (error) {
      console.log(error)
    }
  })
exports.fileParser = fileParser
