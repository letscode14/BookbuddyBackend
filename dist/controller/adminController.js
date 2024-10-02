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
class AdminController {
  constructor(adminCase) {
    this.adminCase = adminCase
  }
  loginAdmin(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const { email, password } = req.body.adminDetails
        const result = yield this.adminCase.loginAdmin(email, password)
        if (result.accessToken) {
          res.cookie('adminAccessToken', result.accessToken, {
            maxAge: 10000,
          })
          res.cookie('adminRefreshToken', result.refreshToken, {
            maxAge: 30 * 24 * 60 * 60 * 10000,
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
  logoutAdmin(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        res.clearCookie('adminAccessToken')
        res.clearCookie('adminRefreshToken')
        res.status(200).json({ message: 'Admin logged Out success Fully' })
      } catch (error) {
        console.log(error)
        next(error)
      }
    })
  }
  getAllusers(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const user = yield this.adminCase.getAllUsers(req)
        res
          .status(res.statusCode)
          .json({ user: user.result, totalPage: user.totalPage })
      } catch (error) {
        console.log(error)
        next(error)
      }
    })
  }
  blockUser(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const result = yield this.adminCase.blockUser(req)
        res.status(result.statusCode).json(Object.assign({}, result))
      } catch (error) {
        console.log(error)
        next(error)
      }
    })
  }
  getAllPost(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const response = yield this.adminCase.getAllPost(req)
        res.status(response.statusCode).json(Object.assign({}, response))
      } catch (error) {
        console.log(error)
        next(error)
      }
    })
  }
  getPostReports(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const response = yield this.adminCase.getPostReports(req)
        res.status(response.statusCode).json(Object.assign({}, response))
      } catch (error) {
        console.log(error)
        next(error)
      }
    })
  }
  removeReport(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const response = yield this.adminCase.removeReport(req)
        res.status(response.statusCode).json(Object.assign({}, response))
      } catch (error) {
        console.log(error)
        next(error)
      }
    })
  }
  //badge
  addBadge(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const response = yield this.adminCase.addBadge(req)
        res.status(response.statusCode).json(Object.assign({}, response))
      } catch (error) {
        console.log(error)
        next(error)
      }
    })
  }
  getSingleBadge(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const badgeId = req.query.badgeId
        const response = yield this.adminCase.getSingleBadge(badgeId)
        res.status(response.statusCode).json(Object.assign({}, response))
      } catch (error) {
        console.log(error)
        next(error)
      }
    })
  }
  editBadge(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
      const response = yield this.adminCase.editBadge(req)
      res.status(response.statusCode).json(Object.assign({}, response))
      try {
      } catch (error) {
        console.log(error)
        next(error)
      }
    })
  }
  getBadge(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const response = yield this.adminCase.getBadge()
        res.status(response.statusCode).json(Object.assign({}, response))
      } catch (error) {
        console.log(error)
        next(error)
      }
    })
  }
  getLendedTransactions(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const response = yield this.adminCase.getLendedTransactions(req)
        res.status(response.statusCode).json(Object.assign({}, response))
      } catch (error) {
        console.log(error)
        next(error)
      }
    })
  }
  getBorrowedTransactions(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const response = yield this.adminCase.getBorrowedTransactions(req)
        res.status(response.statusCode).json(Object.assign({}, response))
      } catch (error) {
        console.log(error)
        next(error)
      }
    })
  }
  getSingleUser(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const response = yield this.adminCase.getSingleUser(req)
        res.status(response.statusCode).json(Object.assign({}, response))
      } catch (error) {
        console.log(error)
        next(error)
      }
    })
  }
  getReportedPost(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const response = yield this.adminCase.getReportedPost(req)
        res.status(response.statusCode).json(Object.assign({}, response))
      } catch (error) {
        console.log(error)
        next(error)
      }
    })
  }
  getUserStatistics(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const response = yield this.adminCase.getUserStatistics()
        res.status(response.statusCode).json(Object.assign({}, response))
      } catch (error) {
        console.log(error)
        next(error)
      }
    })
  }
  getPeriodUserStatistics(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const response = yield this.adminCase.getPeriodUserStatistics(req)
        res.status(response.statusCode).json(Object.assign({}, response))
      } catch (error) {
        console.log(error)
        next(error)
      }
    })
  }
  getHighLendScoreUser(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const response = yield this.adminCase.getHighLendscoreUsers(req)
        res.status(response.statusCode).json(Object.assign({}, response))
      } catch (error) {
        console.log(error)
        next(error)
      }
    })
  }
  getPostStatistics(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const response = yield this.adminCase.getPostStatistics()
        res.status(response.statusCode).json(Object.assign({}, response))
      } catch (error) {
        console.log(error)
        next(error)
      }
    })
  }
  getPeriodPostStatistics(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const response = yield this.adminCase.getPeriodPostStatistics(req)
        res.status(response.statusCode).json(Object.assign({}, response))
      } catch (error) {
        console.log(error)
        next(error)
      }
    })
  }
  getHighBoostedPost(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const response = yield this.adminCase.getHighBoostedPost(req)
        res.status(response.statusCode).json(Object.assign({}, response))
      } catch (error) {
        console.log(error)
        next(error)
      }
    })
  }
  getPost(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const postId = req.query.postId
        const response = yield this.adminCase.getPost(postId)
        res.status(response.statusCode).json(Object.assign({}, response))
      } catch (error) {
        console.log(error)
        next(error)
      }
    })
  }
  removePost(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const postId = req.body.postId
        const result = yield this.adminCase.banPost(postId)
        res.status(result.statusCode).json(Object.assign({}, result))
      } catch (error) {
        console.log(error)
        next(error)
      }
    })
  }
  //transaction statistics
  getTransactionStatistics(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const response = yield this.adminCase.getTransactionStatistics()
        res.status(response.statusCode).json(Object.assign({}, response))
      } catch (error) {
        console.log(error)
        next(error)
      }
    })
  }
  getPeriodTransactionStatistics(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const response =
          yield this.adminCase.getPeriodTransactionStatistics(req)
        res.status(response.statusCode).json(Object.assign({}, response))
      } catch (error) {
        console.log(error)
        next(error)
      }
    })
  }
  getPeriodRequestStatistics(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const response = yield this.adminCase.getPeriodRequestStatistics(req)
        res.status(response.statusCode).json(Object.assign({}, response))
      } catch (error) {
        console.log(error)
        next(error)
      }
    })
  }
  makeRefund(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const response = yield this.adminCase.makeRefund(req)
        res.status(response.statusCode).json(Object.assign({}, response))
      } catch (error) {
        console.log(error)
        next(error)
      }
    })
  }
}
exports.default = AdminController
