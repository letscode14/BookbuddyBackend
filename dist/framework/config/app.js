'use strict'
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod }
  }
Object.defineProperty(exports, '__esModule', { value: true })
const express_1 = __importDefault(require('express'))
const cors_1 = __importDefault(require('cors'))
const cookie_parser_1 = __importDefault(require('cookie-parser'))
const userRoutes_1 = __importDefault(require('../routes/userRoutes'))
const adminRoutes_1 = __importDefault(require('../routes/adminRoutes'))
const express_session_1 = __importDefault(require('express-session'))
const createServer = () => {
  try {
    const app = (0, express_1.default)()
    //Cors middleware
    app.use(
      (0, cors_1.default)({
        origin: process.env.ORIGIN,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true,
        maxAge: 3600,
      })
    )

    app.use((0, cookie_parser_1.default)())
    app.use(express_1.default.json())
    app.use(express_1.default.urlencoded({ extended: true }))
    app.use(
      (0, express_session_1.default)({
        secret: 'your_secret_key',
        resave: false,
        saveUninitialized: true,
        cookie: { secure: false },
      })
    )
    //Routes
    app.use('/user', userRoutes_1.default)
    app.use('/admin', adminRoutes_1.default)
    return app
  } catch (error) {
    console.log(error)
  }
}
exports.default = createServer
