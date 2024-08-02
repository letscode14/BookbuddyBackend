'use strict'
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod }
  }
Object.defineProperty(exports, '__esModule', { value: true })
const express_1 = __importDefault(require('express'))
const userController_1 = __importDefault(
  require('../../controller/userController')
)
const userUsecase_1 = __importDefault(require('../../usecases/userUsecase'))
const userRepository_1 = __importDefault(
  require('../repository/userRepository')
)
const SendEmail_1 = __importDefault(require('../services/SendEmail'))
const JwtToken_1 = __importDefault(require('../services/JwtToken'))
const authMiddleware_1 = require('../middleware/authMiddleware')
const Cloudinary_1 = __importDefault(require('../services/Cloudinary'))
const formidable_1 = require('../middleware/formidable')
const PaymentService_1 = __importDefault(require('../services/PaymentService'))
const paymentController_1 = __importDefault(
  require('../../controller/paymentController')
)
const chatController_1 = __importDefault(
  require('../../controller/chatController')
)
const agenda_1 = __importDefault(require('../config/agenda'))
const Jobscheduler_1 = __importDefault(require('../services/Jobscheduler'))
const cloudinary = new Cloudinary_1.default()
const userRouter = express_1.default.Router()
const repository = new userRepository_1.default()
const jobScheduler = new Jobscheduler_1.default(agenda_1.default, repository)
jobScheduler.start()
const sendEmail = new SendEmail_1.default()
const JwtToken = new JwtToken_1.default()
const paymentService = new PaymentService_1.default()
const userUseCase = new userUsecase_1.default(
  repository,
  sendEmail,
  JwtToken,
  cloudinary,
  paymentService
)
const controller = new userController_1.default(userUseCase)
const paymentController = new paymentController_1.default(userUseCase)
const chatContoller = new chatController_1.default(userUseCase)
userRouter.post('/registration', (req, res, next) => {
  controller.registerUser(req, res, next)
})
//route to check if the username is valid or not
userRouter.post('/check/user/name', (req, res, next) => {
  controller.checkUsername(req, res, next)
})
userRouter.post('/create-user', (req, res, next) => {
  controller.activateUser(req, res, next)
})
//resend otp
userRouter.get('/resendotp', (req, res, next) => {
  controller.resendOtp(req, res, next)
})
//googleAuth
userRouter.post('/google/auth', (req, res, next) => {
  controller.googleAuth(req, res, next)
})
//login user
userRouter.post('/login', (req, res, next) => {
  controller.loginUser(req, res, next)
})
//test Route
userRouter.get(
  '/protected',
  authMiddleware_1.authMiddleware,
  (req, res, next) => {
    controller.protected(req, res, next)
  }
)
userRouter.post(
  '/logout',
  authMiddleware_1.authMiddleware,
  (req, res, next) => {
    controller.logoutUser(req, res, next)
  }
)
userRouter.post('/login-otp', (req, res, next) => {
  controller.loginWithOtp(req, res, next)
})
userRouter.post('/otp/login', (req, res, next) => {
  controller.submitLoginOtp(req, res, next)
})
//create post route
userRouter.post(
  '/create/post/:id',
  authMiddleware_1.authMiddleware,
  formidable_1.fileParser,
  (req, res, next) => {
    controller.createPost(req, res, next)
  }
)
userRouter.get(
  '/post/:id',
  authMiddleware_1.authMiddleware,
  (req, res, next) => {
    controller.getPost(req, res, next)
  }
)
//get user
userRouter.get(
  '/profile/:id',
  authMiddleware_1.authMiddleware,
  (req, res, next) => {
    controller.getUser(req, res, next)
  }
)
userRouter.get('/suggestions', (req, res, next) => {
  controller.getSuggestion(req, res, next)
})
userRouter.get(
  '/list/post/content',
  authMiddleware_1.authMiddleware,
  (req, res, next) => {
    controller.getPostContent(req, res, next)
  }
)
//follow usr
userRouter.post(
  '/follow',
  authMiddleware_1.authMiddleware,
  (req, res, next) => {
    controller.followUser(req, res, next)
  }
)
//unfollow user
userRouter.post(
  '/unfollow',
  authMiddleware_1.authMiddleware,
  (req, res, next) => {
    controller.unFollowUser(req, res, next)
  }
)
//list all the post
userRouter.get(
  '/post/content/:id',
  authMiddleware_1.authMiddleware,
  (req, res, next) => {
    controller.getPostData(req, res, next)
  }
)
userRouter.patch(
  '/post/like',
  authMiddleware_1.authMiddleware,
  (req, res, next) => {
    controller.likePost(req, res, next)
  }
)
userRouter.patch(
  '/post/dislike',
  authMiddleware_1.authMiddleware,
  (req, res, next) => {
    controller.UnLikePost(req, res, next)
  }
)
userRouter.post(
  '/edit/verify/email/:id',
  authMiddleware_1.authMiddleware,
  (req, res, next) => {
    controller.verifyEditEmail(req, res, next)
  }
)
userRouter.post(
  '/submit/verify/email/otp',
  authMiddleware_1.authMiddleware,
  (req, res, next) => {
    controller.verifyEmailEditOtp(req, res, next)
  }
)
userRouter.post(
  '/edit/details',
  authMiddleware_1.authMiddleware,
  formidable_1.fileParser,
  (req, res, next) => {
    controller.editUserDetails(req, res, next)
  }
)
userRouter.get(
  '/get/post',
  authMiddleware_1.authMiddleware,
  (req, res, next) => {
    controller.getPostDetails(req, res, next)
  }
)
userRouter.patch(
  '/add/comment',
  authMiddleware_1.authMiddleware,
  (req, res, next) => {
    controller.addComment(req, res, next)
  }
)
userRouter.patch(
  '/add/reply',
  authMiddleware_1.authMiddleware,
  (req, res, next) => {
    controller.addReply(req, res, next)
  }
)
//fetch followers
userRouter.get(
  '/friends/users',
  authMiddleware_1.authMiddleware,
  (req, res, next) => {
    controller.getF(req, res, next)
  }
)
userRouter.post(
  '/report',
  authMiddleware_1.authMiddleware,
  formidable_1.fileParser,
  (req, res, next) => {
    controller.report(req, res, next)
  }
)
userRouter.get(
  '/bookshelf',
  authMiddleware_1.authMiddleware,
  (req, res, next) => {
    controller.getBookshelf(req, res, next)
  }
)
userRouter.get('/book', authMiddleware_1.authMiddleware, (req, res, next) => {
  controller.viewBook(req, res, next)
})
userRouter.patch(
  '/edit/bookshelf',
  authMiddleware_1.authMiddleware,
  (req, res, next) => {
    controller.editBook(req, res, next)
  }
)
userRouter.patch(
  '/shelf/remove',
  authMiddleware_1.authMiddleware,
  (req, res, next) => {
    controller.removeBook(req, res, next)
  }
)
userRouter.get(
  '/request-book',
  authMiddleware_1.authMiddleware,
  (req, res, next) => {
    controller.getRequestBook(req, res, next)
  }
)
userRouter.post(
  '/pay-subscription',
  authMiddleware_1.authMiddleware,
  (req, res, next) => {
    paymentController.createOrder(req, res, next)
  }
)
userRouter.post(
  '/payment-verification',
  authMiddleware_1.authMiddleware,
  (req, res, next) => {
    paymentController.verifyPayment(req, res, next)
  }
)
userRouter.post(
  '/chat/:senderId/:userId',
  authMiddleware_1.authMiddleware,
  (req, res, next) => {
    chatContoller.getChat(req, res, next)
  }
)
userRouter.get(
  '/chats/:userId',
  authMiddleware_1.authMiddleware,
  (req, res, next) => {
    chatContoller.getAllchat(req, res, next)
  }
)
userRouter.post(
  '/chat/message',
  authMiddleware_1.authMiddleware,
  (req, res, next) => {
    chatContoller.sendMessage(req, res, next)
  }
)
userRouter.get(
  '/messages',
  authMiddleware_1.authMiddleware,
  (req, res, next) => {
    chatContoller.getAllMessages(req, res, next)
  }
)
userRouter.patch(
  '/messages/read/:messageId',
  authMiddleware_1.authMiddleware,
  (req, res, next) => {
    chatContoller.makeMsgRead(req, res, next)
  }
)
userRouter.patch(
  '/request/decline',
  authMiddleware_1.authMiddleware,
  (req, res, next) => {
    chatContoller.declineRequest(req, res, next)
  }
)
userRouter.post(
  '/add-story/:userId',
  authMiddleware_1.authMiddleware,
  formidable_1.fileParser,
  (req, res, next) => {
    controller.addStory(req, res, next)
  }
)
userRouter.get(
  '/stories',
  authMiddleware_1.authMiddleware,
  (req, res, next) => {
    controller.getStories(req, res, next)
  }
)
userRouter.patch(
  '/make-story-read',
  authMiddleware_1.authMiddleware,
  (req, res, next) => {
    controller.makeStoryViewed(req, res, next)
  }
)
userRouter.post(
  '/request/accept',
  authMiddleware_1.authMiddleware,
  (req, res, next) => {
    chatContoller.acceptRequest(req, res, next)
  }
)
userRouter.get(
  '/lended/books',
  authMiddleware_1.authMiddleware,
  (req, res, next) => {
    controller.getLendedBooks(req, res, next)
  }
)
userRouter.get(
  '/borrowed/books',
  authMiddleware_1.authMiddleware,
  (req, res, next) => {
    controller.getBorrowedBooks(req, res, next)
  }
)
userRouter.get(
  '/notifications',
  authMiddleware_1.authMiddleware,
  (req, res, next) => {
    controller.getNotifications(req, res, next)
  }
)
userRouter.patch(
  '/give-book-back',
  authMiddleware_1.authMiddleware,
  (req, res, next) => {
    controller.giveBackBook(req, res, next)
  }
)
//to collect book
userRouter.patch(
  '/collect-book',
  authMiddleware_1.authMiddleware,
  (req, res, next) => {
    controller.collectBook(req, res, next)
  }
)
//changePass before login
userRouter.post('/change-password/verify-email', (req, res, next) => {
  controller.changePassEmailVerify(req, res, next)
})
userRouter.get('/resend/otp/change/pass/before/login', (req, res, next) => {
  controller.resendOtpPassBeforeLogin(req, res, next)
})
userRouter.post('/submit/change-pass/otp/before/login', (req, res, next) => {
  controller.submitOtpChangePassBeforeLogin(req, res, next)
})
userRouter.post('/submit/new-password/before/login', (req, res, next) => {
  controller.submitNewPasswordBeforeLogin(req, res, next)
})
//
userRouter.get('/search', (req, res, next) => {
  controller.searchUsers(req, res, next)
})
//get the book shelfs near to you
userRouter.get(
  '/explore/books',
  authMiddleware_1.authMiddleware,
  (req, res, next) => {
    controller.exploreNearByBooks(req, res, next)
  }
)
//CHANGE PASS AFTER LOGIN
userRouter.get(
  '/change/pass/after/otp',
  authMiddleware_1.authMiddleware,
  (req, res, next) => {
    controller.getOtpForChangePassAfterLogin(req, res, next)
  }
)
userRouter.get(
  '/change/pass/after/resend-otp',
  authMiddleware_1.authMiddleware,
  (req, res, next) => {
    controller.resendForChangePassAfterLogin(req, res, next)
  }
)
userRouter.post(
  '/change/pass/after/submit-otp',
  authMiddleware_1.authMiddleware,
  (req, res, next) => {
    controller.submitChangePassOtpAfterLogin(req, res, next)
  }
)
userRouter.post('/change/pass/submit-old-password', (req, res, next) => {
  controller.submitOldPassWord(req, res, next)
})
userRouter.post('/change/pass/submit-new-password', (req, res, next) => {
  controller.submitNewPassword(req, res, next)
})
userRouter.get('/get-deposit', (req, res, next) => {
  controller.getDeposit(req, res, next)
})
//add funds
userRouter.post('/add-funds', (req, res, next) => {
  paymentController.addFundsOrder(req, res, next)
})
userRouter.post('/verify-add-funds-payment', (req, res, next) => {
  paymentController.verifyAddFundsPayment(req, res, next)
})
exports.default = userRouter
