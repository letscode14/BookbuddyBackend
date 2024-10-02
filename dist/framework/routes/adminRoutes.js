'use strict'
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod }
  }
Object.defineProperty(exports, '__esModule', { value: true })
const express_1 = __importDefault(require('express'))
const adminReposito0ry_1 = __importDefault(
  require('../repository/adminReposito0ry')
)
const adminController_1 = __importDefault(
  require('../../controller/adminController')
)
const adminUseCases_1 = __importDefault(require('../../usecases/adminUseCases'))
const JwtToken_1 = __importDefault(require('../services/JwtToken'))
const adminAuth_1 = require('../middleware/adminAuth')
const formidable_1 = require('../middleware/formidable')
const Cloudinary_1 = __importDefault(require('../services/Cloudinary'))
const SendEmail_1 = __importDefault(require('../services/SendEmail'))
const PaymentService_1 = __importDefault(require('../services/PaymentService'))
const adminRouter = express_1.default.Router()
const jwtToken = new JwtToken_1.default()
const repository = new adminReposito0ry_1.default()
const cloudinary = new Cloudinary_1.default()
const sendEmail = new SendEmail_1.default()
const paymentService = new PaymentService_1.default()
const adminUseCase = new adminUseCases_1.default(
  repository,
  jwtToken,
  cloudinary,
  sendEmail,
  paymentService
)
const controller = new adminController_1.default(adminUseCase)
//login admin
adminRouter.post('/login', (req, res, next) => {
  controller.loginAdmin(req, res, next)
})
adminRouter.get('/logout', (req, res, next) => {
  controller.logoutAdmin(req, res, next)
})
adminRouter.get(
  '/user/list',
  adminAuth_1.adminAuthMiddleware,
  (req, res, next) => {
    controller.getAllusers(req, res, next)
  }
)
adminRouter.patch(
  '/user/block',
  adminAuth_1.adminAuthMiddleware,
  (req, res, next) => {
    controller.blockUser(req, res, next)
  }
)
adminRouter.get('/post', adminAuth_1.adminAuthMiddleware, (req, res, next) => {
  controller.getAllPost(req, res, next)
})
adminRouter.get(
  '/post/reports',
  adminAuth_1.adminAuthMiddleware,
  (req, res, next) => {
    controller.getPostReports(req, res, next)
  }
)
adminRouter.patch(
  '/remove/report',
  adminAuth_1.adminAuthMiddleware,
  (req, res, next) => {
    controller.removeReport(req, res, next)
  }
)
//badge
adminRouter.post(
  '/create-badge',
  adminAuth_1.adminAuthMiddleware,
  formidable_1.fileParser,
  (req, res, next) => {
    controller.addBadge(req, res, next)
  }
)
adminRouter.get('/single-badge', (req, res, next) => {
  controller.getSingleBadge(req, res, next)
})
adminRouter.patch(
  '/edit-badge',
  adminAuth_1.adminAuthMiddleware,
  (req, res, next) => {
    controller.editBadge(req, res, next)
  }
)
//
adminRouter.get('/badge', adminAuth_1.adminAuthMiddleware, (req, res, next) => {
  controller.getBadge(req, res, next)
})
adminRouter.get('/get/lended', (req, res, next) => {
  controller.getLendedTransactions(req, res, next)
})
adminRouter.get('/get/borrowed', (req, res, next) => {
  controller.getBorrowedTransactions(req, res, next)
})
//userpage functionaliity
adminRouter.get('/get/single-user', (req, res, next) => {
  controller.getSingleUser(req, res, next)
})
adminRouter.get('/get/user/reported-post', (req, res, next) => {
  controller.getReportedPost(req, res, next)
})
adminRouter.get('/get/user/account/reports', (req, res, next) => {})
adminRouter.get('/get/user/transactions/reports', (req, res, next) => {})
//dashboards
/* user statistics */
adminRouter.get('/get/user/statistics', (req, res, next) => {
  controller.getUserStatistics(req, res, next)
})
adminRouter.get('/get/user/period/statistics', (req, res, next) => {
  controller.getPeriodUserStatistics(req, res, next)
})
adminRouter.get('/get/top/lendscore/users', (req, res, next) => {
  controller.getHighLendScoreUser(req, res, next)
})
adminRouter.get('/get/post/statistics', (req, res, next) => {
  controller.getPostStatistics(req, res, next)
})
adminRouter.get('/get/post/period/statistics', (req, res, next) => {
  controller.getPeriodPostStatistics(req, res, next)
})
adminRouter.get('/get/post/boosted/post', (req, res, next) => {
  controller.getHighBoostedPost(req, res, next)
})
adminRouter.get(
  '/get/post',
  adminAuth_1.adminAuthMiddleware,
  (req, res, next) => {
    controller.getPost(req, res, next)
  }
)
adminRouter.patch(
  '/remove/post',
  adminAuth_1.adminAuthMiddleware,
  (req, res, next) => {
    controller.removePost(req, res, next)
  }
)
//transaction statistics
adminRouter.get('/transaction/statistics', (req, res, next) => {
  controller.getTransactionStatistics(req, res, next)
})
adminRouter.get('/period/transaction/statistics', (req, res, next) => {
  controller.getPeriodTransactionStatistics(req, res, next)
})
adminRouter.get('/period/request/statistics', (req, res, next) => {
  controller.getPeriodRequestStatistics(req, res, next)
})
adminRouter.post('/make-refund', (req, res, next) => {
  controller.makeRefund(req, res, next)
})
exports.default = adminRouter
