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
Object.defineProperty(exports, '__esModule', { value: true })
const express_1 = require('express')
class UserController {
  constructor(userCase) {
    this.userCase = userCase
  }
  registerUser(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const userData = req.body
        const user = yield this.userCase.registrationUser(userData)
        if (user.activationToken) {
          res.cookie('activationToken', user.activationToken, {
            httpOnly: true,
            secure: true,
          })
        }
        return res
          .status(user === null || user === void 0 ? void 0 : user.statusCode)
          .json(Object.assign({}, user))
      } catch (error) {
        console.log(error)
        next(error)
      }
    })
  }
  checkUsername(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const { username } = req.body
        const result = yield this.userCase.checkUsername(username)
        res.status(result.statusCode).json(Object.assign({}, result))
      } catch (error) {
        console.log(error)
        next()
      }
    })
  }
  activateUser(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const { otp } = req.body
        const token = req.cookies.activationToken
        const user = yield this.userCase.activateUser(token, otp)
        res.cookie('refreshToken', user.refreshToken, {
          httpOnly: true,
          maxAge: 30 * 24 * 60 * 60 * 10000,
        })
        let message
        if (user === null || user === void 0 ? void 0 : user.message) {
          message = user.message
        }
        res
          .status(user === null || user === void 0 ? void 0 : user.statusCode)
          .json(Object.assign({ message }, user))
      } catch (error) {
        console.log(error)
        next(error)
      }
    })
  }
  resendOtp(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const token = req.cookies.activationToken
        const type = req.body.type
        const user = yield this.userCase.resendOtp(token)
        if (user.activationToken) {
          res.cookie('activationToken', user.activationToken, {
            httpOnly: true,
            secure: true,
          })
        }
        console.log(user)
        res
          .status(user === null || user === void 0 ? void 0 : user.statusCode)
          .json(Object.assign({ message: user.message }, user))
      } catch (error) {
        console.log(error)
        next(error)
      }
    })
  }
  googleAuth(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const user = req.body
        const result = yield this.userCase.googleAuth(user)
        res.cookie('refreshToken', result.refreshToken, {
          httpOnly: true,
          maxAge: 30 * 24 * 60 * 60 * 10000,
        })
        res.status(result.statusCode).json(Object.assign({}, result))
      } catch (error) {
        console.log(error)
        next(error)
      }
    })
  }
  loginUser(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const user = req.body
        const result = yield this.userCase.loginUser(user)
        if (result.refreshToken) {
          res.cookie('refreshToken', result.refreshToken, {
            httpOnly: true,
            maxAge: 30 * 24 * 60 * 60 * 10000,
          })
        }
        res.status(result.statusCode).json(Object.assign({}, result))
      } catch (error) {
        console.log(error)
        next(error)
      }
    })
  }
  protected(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        res.status(200).json({ message: '' })
      } catch (error) {
        console.log(error)
        next(error)
      }
    })
  }
  loginWithOtp(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const user = req.body
        const result = yield this.userCase.loginWithOtp(user)
        res.cookie('activationToken', result.accessToken, {
          httpOnly: true,
          secure: true,
        })
        res.status(result.statusCode).json(Object.assign({}, result))
      } catch (error) {
        console.log(error)
        next(error)
      }
    })
  }
  submitLoginOtp(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const { token, otp } = req.body
        const result = yield this.userCase.submitOtp(token, otp)
        if (result.statusCode == 200) {
          res.cookie('refreshToken', result.refreshToken, {
            httpOnly: true,
            maxAge: 30 * 24 * 60 * 60 * 10000,
          })
        }
        res.status(result.statusCode).json(Object.assign({}, result))
      } catch (error) {
        console.log(error)
        next(error)
      }
    })
  }
  logoutUser(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        console.log('logout')
        res.clearCookie('accessToken')
        res.clearCookie('refreshToken')
        res.status(200).json({ message: 'User LogOut success fully' })
      } catch (error) {
        console.log(error)
        next(error)
      }
    })
  }
  //create post
  createPost(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const result = yield this.userCase.createPost(req)
        res.status(result.statusCode).json(Object.assign({}, result))
      } catch (error) {
        console.log(error)
        next(error)
      }
    })
  }
  getPost(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const result = yield this.userCase.getPost(req.params.id)
        res.status(result.statusCode).json(Object.assign({}, result))
      } catch (error) {
        console.log(error)
        next(error)
      }
    })
  }
  getUser(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const user = yield this.userCase.getUser(req.params.id, req)
        res.status(user.statusCode).json(Object.assign({}, user))
      } catch (error) {
        console.log(error)
        next(error)
      }
    })
  }
  getSuggestion(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const user = yield this.userCase.suggestUsers(req)
        res.status(user.statusCode).json({ users: user.result })
      } catch (error) {
        console.log(error)
        next(error)
      }
    })
  }
  getPostContent(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
      } catch (error) {
        console.log(error)
        next(error)
      }
    })
  }
  followUser(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const response = yield this.userCase.followUser(req)
        res.status(response.statusCode).json({ response })
      } catch (error) {
        console.log(error)
        next(error)
      }
    })
  }
  unFollowUser(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const response = yield this.userCase.unFollowUser(req)
        res.status(response.statusCode).json({ response })
      } catch (error) {
        console.log(error)
        next(error)
      }
    })
  }
  getPostData(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const { id } = req.params
        const response = yield this.userCase.getPostData(req, id)
        res.status(response.statusCode).json(Object.assign({}, response))
      } catch (error) {
        console.log(error)
        next(error)
      }
    })
  }
  likePost(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const response = yield this.userCase.likePost(req)
        res.status(response.statusCode).json(Object.assign({}, response))
      } catch (error) {
        console.log(error)
        next(error)
      }
    })
  }
  UnLikePost(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const response = yield this.userCase.UnLikePost(req)
        console.log(response)
        res.status(response.statusCode).json(Object.assign({}, response))
      } catch (error) {
        console.log(error)
        next(error)
      }
    })
  }
  verifyEditEmail(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const result = yield this.userCase.verifyEditEmail(req)
        if (result.activationToken) {
          res.cookie('activationToken', result.activationToken, {
            httpOnly: true,
            secure: true,
          })
        }
        res.status(result.statusCode).json(Object.assign({}, result))
      } catch (error) {
        console.log(error)
        next(error)
      }
    })
  }
  verifyEmailEditOtp(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const token = req.cookies.activationToken
        const result = yield this.userCase.verifyEmailEditOtp(
          token,
          req.body.code
        )
        res.status(result.statusCode).json(Object.assign({}, result))
      } catch (error) {
        console.log(error)
        next(error)
      }
    })
  }
  editUserDetails(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const result = yield this.userCase.editUserDetails(req)
        res.status(result.statusCode).json(Object.assign({}, result))
      } catch (error) {
        console.log(error)
        next(error)
      }
    })
  }
  getPostDetails(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const result = yield this.userCase.getPostDetails(req)
        res.status(200).json(Object.assign({}, result))
      } catch (error) {
        console.log(error)
        next(error)
      }
    })
  }
  addComment(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const result = yield this.userCase.addComment(req)
        res.status(result.statusCode).json(Object.assign({}, result))
      } catch (error) {
        console.log(error)
        next(error)
      }
    })
  }
  addReply(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const reponse = yield this.userCase.addReply(req)
        res
          .status(express_1.response.statusCode)
          .json(Object.assign({}, reponse))
      } catch (error) {
        console.log(error)
        next(error)
      }
    })
  }
  getF(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const reponse = yield this.userCase.getF(req)
        res
          .status(express_1.response.statusCode)
          .json(Object.assign({}, reponse))
      } catch (error) {
        console.log(error)
        next(error)
      }
    })
  }
  report(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const result = yield this.userCase.postReport(req)
        res.status(result.statusCode).json(Object.assign({}, result))
      } catch (error) {
        console.log(error)
        next(error)
      }
    })
  }
  getBookshelf(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const userId = req.query.userId
        const result = yield this.userCase.getBookshelf(userId)
        res.status(result.statusCode).json(Object.assign({}, result))
      } catch (error) {
        console.log(error)
        next(error)
      }
    })
  }
  viewBook(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const bookId = req.query.bookId
        const userId = req.query.userId
        const result = yield this.userCase.viewBook(bookId, userId)
        res.status(result.statusCode).json(Object.assign({}, result))
      } catch (error) {
        console.log(error)
        next(error)
      }
    })
  }
  editBook(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const result = yield this.userCase.editBook(req)
        res.status(result.statusCode).json(Object.assign({}, result))
      } catch (error) {
        console.log(error)
        next(error)
      }
    })
  }
  removeBook(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const result = yield this.userCase.removeBook(req)
        res.status(result.statusCode).json(Object.assign({}, result))
      } catch (error) {
        console.log(error)
        next(error)
      }
    })
  }
  getRequestBook(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const result = yield this.userCase.getRequestBook(req)
        res.status(result.statusCode).json(Object.assign({}, result))
      } catch (error) {
        console.log(error)
        next(error)
      }
    })
  }
  addStory(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const result = yield this.userCase.addStory(req)
        res.status(result.statusCode).json(Object.assign({}, result))
      } catch (error) {
        console.log(error)
        next(error)
      }
    })
  }
  getStories(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const result = yield this.userCase.getStories(req)
        res.status(result.statusCode).json(Object.assign({}, result))
      } catch (error) {
        console.log(error)
        next(error)
      }
    })
  }
  makeStoryViewed(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const result = yield this.userCase.makeStoryViewed(req)
        res.status(result.statusCode).json(Object.assign({}, result))
      } catch (error) {
        console.log(error)
        next(error)
      }
    })
  }
  getLendedBooks(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const { userId, pageNo } = req.query
        const result = yield this.userCase.getLendedBooks(
          userId,
          Number(pageNo)
        )
        res.status(result.statusCode).json(Object.assign({}, result))
      } catch (error) {
        console.log(error)
        next(error)
      }
    })
  }
  getBorrowedBooks(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const { userId, pageNo } = req.query
        const result = yield this.userCase.getBorrowedBooks(
          userId,
          Number(pageNo)
        )
        res.status(result.statusCode).json(Object.assign({}, result))
      } catch (error) {
        console.log(error)
        next(error)
      }
    })
  }
  getNotifications(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const { userId, pageNo, unRead } = req.query
        const u = Number(unRead)
        const result = yield this.userCase.getNotifications(
          userId,
          Number(pageNo),
          Boolean(u)
        )
        res.status(result.statusCode).json(Object.assign({}, result))
      } catch (error) {
        console.log(error)
        next(error)
      }
    })
  }
  giveBackBook(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const result = yield this.userCase.giveBackBook(req)
        res.status(result.statusCode).json(Object.assign({}, result))
      } catch (error) {
        console.log(error)
        next(error)
      }
    })
  }
  collectBook(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const result = yield this.userCase.collectBook(req)
        res.status(result.statusCode).json(Object.assign({}, result))
      } catch (error) {
        console.log(error)
        next(error)
      }
    })
  }
  //change pass before login
  changePassEmailVerify(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const { email } = req.body
        const result = yield this.userCase.verifyChangePassEmail(email)
        if (result.activationToken) {
          res.cookie('changePassOtpTokenBeforeLogin', result.activationToken, {
            maxAge: 5 * 60 * 1000,
            httpOnly: true,
          })
        }
        res.status(result.statusCode).json(Object.assign({}, result))
      } catch (error) {
        console.log(error)
        next(error)
      }
    })
  }
  resendOtpPassBeforeLogin(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const token = req.cookies.changePassOtpTokenBeforeLogin
        const result = yield this.userCase.resendChangePassOtpBeforeLogin(token)
        if (result.activationToken) {
          res.cookie('changePassOtpTokenBeforeLogin', result.activationToken, {
            maxAge: 5 * 60 * 1000,
            httpOnly: true,
          })
        }
        res.status(result.statusCode).json(Object.assign({}, result))
      } catch (error) {
        console.log(error)
        next(error)
      }
    })
  }
  submitOtpChangePassBeforeLogin(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const token = req.cookies.changePassOtpTokenBeforeLogin
        const otp = req.body.otp
        const result = yield this.userCase.submitOtpBeforeLogin(token, otp)
        if (result.activationToken) {
          res.cookie('changePassTokenBeforeLogin', result.activationToken, {
            maxAge: 5 * 60 * 1000,
            httpOnly: true,
          })
        }
        res.status(result.statusCode).json(Object.assign({}, result))
      } catch (error) {
        console.log(error)
        next(error)
      }
    })
  }
  submitNewPasswordBeforeLogin(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const token = req.cookies.changePassTokenBeforeLogin
        const password = req.body.password
        const result = yield this.userCase.submitNewPasswordBeforeLogin(
          password,
          token
        )
        res.status(result.statusCode).json(Object.assign({}, result))
      } catch (error) {
        console.log(error)
        next(error)
      }
    })
  }
  //
  searchUsers(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const query = req.query.search
        const pageNo = parseInt(req.query.pageNo)
        const user = req.query.user
        const result = yield this.userCase.searchUsers(pageNo, query, user)
        res.status(result.statusCode).json(Object.assign({}, result))
      } catch (error) {
        console.log(error)
        next(error)
      }
    })
  }
  exploreNearByBooks(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const query = req.query.userId
        const result = yield this.userCase.exploreBooks(query)
        res.status(result.statusCode).json(Object.assign({}, result))
      } catch (error) {
        console.log(error)
        next(error)
      }
    })
  }
  getOtpForChangePassAfterLogin(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const userId = req.query.userId
        const email = req.query.email
        const result = yield this.userCase.otpChangePassAfterLogin(
          userId,
          email
        )
        if (result.activationToken) {
          res.cookie('changePassOtpTokenAfterLogin', result.activationToken, {
            maxAge: 2 * 60 * 1000,
            httpOnly: true,
          })
        }
        res.status(result.statusCode).json(Object.assign({}, result))
      } catch (error) {
        console.log(error)
        next(error)
      }
    })
  }
  resendForChangePassAfterLogin(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
      const userId = req.query.userId
      const changePassOtpCookie = req.cookies.changePassOtpTokenAfterLogin
      const result = yield this.userCase.otpResendPassAfterLogin(
        changePassOtpCookie,
        userId
      )
      if (result.activationToken) {
        res.cookie('changePassOtpTokenAfterLogin', result.activationToken, {
          maxAge: 2 * 60 * 1000,
          httpOnly: true,
        })
      }
      res.status(result.statusCode).json(Object.assign({}, result))
      try {
      } catch (error) {
        console.log(error)
        next(error)
      }
    })
  }
  submitChangePassOtpAfterLogin(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const changePassOtpCookie = req.cookies.changePassOtpTokenAfterLogin
        const otp = req.body.otp
        const result = yield this.userCase.submitChangePassOtpAfterLogin(
          changePassOtpCookie,
          otp
        )
        if (result.activationToken) {
          res.cookie('changePassTokenAfterLogin', result.activationToken, {
            maxAge: 7 * 60 * 1000,
            httpOnly: true,
          })
        }
        res.status(result.statusCode).json(Object.assign({}, result))
      } catch (error) {
        console.log(error)
        next(error)
      }
    })
  }
  submitOldPassWord(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const password = req.body.password
        const userId = req.query.userId
        const result = yield this.userCase.checkOldPassword(userId, password)
        if (result.activationToken) {
          res.cookie('changePassTokenAfterLogin', result.activationToken, {
            maxAge: 7 * 60 * 1000,
            httpOnly: true,
          })
        }
        res.status(result.statusCode).json(Object.assign({}, result))
      } catch (error) {
        console.log(error)
        next(error)
      }
    })
  }
  submitNewPassword(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const token = req.cookies.changePassTokenAfterLogin
        const password = req.body.password
        const result = yield this.userCase.submitNewPassword(token, password)
        res.status(result.statusCode).json(Object.assign({}, result))
      } catch (error) {
        console.log(error)
        next(error)
      }
    })
  }
  getDeposit(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const result = yield this.userCase.getDeposit(req)
        res.status(result.statusCode).json(Object.assign({}, result))
      } catch (error) {
        console.log(error)
        next(error)
      }
    })
  }
}
exports.default = UserController
