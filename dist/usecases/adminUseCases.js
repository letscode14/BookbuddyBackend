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
class AdminUseCase {
  constructor(
    iAdminRepository,
    JwtToken,
    cloudinary,
    sendEmail,
    paymentService
  ) {
    this.JwtToken = JwtToken
    this.iAdminRepository = iAdminRepository
    this.Cloudinary = cloudinary
    this.sendEmail = sendEmail
    this.paymentService = paymentService
  }
  loginAdmin(email, password) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const emailExists = yield this.iAdminRepository.findByEmail(email)
        if (!emailExists) {
          return {
            statusCode: 401,
            message: 'Admin Not Found',
          }
        }
        const hash = emailExists.password
        const pass = yield this.iAdminRepository.loginAdmin(password, hash)
        if (!pass) {
          return {
            statusCode: 401,
            message: 'Invalid Credentials',
          }
        }
        const accessToken = yield this.JwtToken.SignInAccessToken({
          id: emailExists._id,
          role: emailExists.role,
        })
        const refreshToken = yield this.JwtToken.SignInRefreshToken({
          id: emailExists._id,
          role: emailExists.role,
        })
        return {
          statusCode: 200,
          accessToken,
          refreshToken,
          message: 'Admin logged Successfully',
          _id: emailExists._id,
        }
      } catch (error) {
        console.log(error)
        return {
          statusCode: 500,
          message: 'Internal server error',
        }
      }
    })
  }
  getAllUsers(req) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const result = yield this.iAdminRepository.fetchUsers(req)
        if (result) {
          return {
            statusCode: 200,
            result: result.users,
            totalPage: result.totalPages,
          }
        }
        return {
          statusCode: 204,
          message: 'NOt users ',
        }
      } catch (error) {
        console.log(error)
        return {
          statusCode: 500,
          message: 'internal server error',
        }
      }
    })
  }
  blockUser(req) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const { action } = req.body
        const result = yield this.iAdminRepository.blockUser(req)
        if (result) {
          return {
            statusCode: 200,
            message:
              action == 'Block'
                ? 'User Blocked successfully'
                : 'User Unblocked successfully',
          }
        }
        return {
          statusCode: 409,
          message: 'unkown conflict',
        }
      } catch (error) {
        console.log(error)
        return {
          statusCode: 500,
          message: 'Internal Server error',
        }
      }
    })
  }
  getAllPost(req) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const post = yield this.iAdminRepository.getAllPost(req)
        if (post) {
          return Object.assign({ statusCode: 200 }, post)
        }
        return {
          statusCode: 409,
          message: 'Unexpected error occured',
        }
      } catch (error) {
        console.log(error)
        return {
          statusCode: 500,
          message: 'Internal server error',
        }
      }
    })
  }
  getPostReports(req) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const response = yield this.iAdminRepository.getPostReports(req)
        if (response) {
          return {
            statusCode: 200,
            result: response,
          }
        }
        return {
          statusCode: 409,
          message: 'unexpected error occured',
        }
      } catch (error) {
        console.log(error)
        return {
          statusCode: 500,
          message: 'Internal server error',
        }
      }
    })
  }
  removeReport(req) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const response = yield this.iAdminRepository.removeReport(req)
        if (response) {
          return {
            statusCode: 200,
            message: 'report removed',
          }
        }
        return {
          statusCode: 409,
          message: 'unexpected error occured',
        }
      } catch (error) {
        console.log(error)
        return {
          statusCode: 500,
          message: 'Internal server error',
        }
      }
    })
  }
  addBadge(req) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const { files } = req
        const file = files.icon
        const { badgeName } = req.body
        const isAvail = yield this.iAdminRepository.findBadgeByName(badgeName)
        if (isAvail) {
          return {
            statusCode: 400,
            message: 'Badge already present',
          }
        }
        const cloudRes = yield this.Cloudinary.cloudinaryUpload(file)
        if (cloudRes) {
          const doc = {
            public_id: cloudRes.public_id,
            secure_url: cloudRes.secure_url,
          }
          const badge = yield this.iAdminRepository.createBadge(req, doc)
          if (badge) {
            return {
              statusCode: 200,
              message: 'New badge created success fully',
              result: badge,
            }
          } else {
            return {
              statusCode: 409,
              message: 'unexpected error occured',
            }
          }
        }
        return {
          statusCode: 409,
          message: 'unexpected error occured',
        }
      } catch (error) {
        console.log(error)
        return {
          statusCode: 500,
          message: 'Internal server error',
        }
      }
    })
  }
  getSingleBadge(badgeId) {
    return __awaiter(this, void 0, void 0, function* () {
      const result = yield this.iAdminRepository.getSingleBadge(badgeId)
      if (result) {
        return {
          statusCode: 200,
          result: result,
        }
      }
      try {
        return {
          statusCode: 400,
          message: 'unexpected error occured',
        }
      } catch (error) {
        return {
          statusCode: 500,
          message: 'Internal server error',
        }
      }
    })
  }
  editBadge(req) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const { badgeName } = req.body
        const { isChanged } = req.query
        const isAvail = yield this.iAdminRepository.findBadgeByName(badgeName)
        if (isAvail == true && isChanged == 'true') {
          return {
            statusCode: 400,
            message: 'Badge name already exists',
          }
        }
        const result = yield this.iAdminRepository.editBadge(req)
        if (result) {
          return {
            statusCode: 200,
            message: 'Badge edited successfully',
          }
        }
        return {
          statusCode: 400,
          message: 'unexpected error occured',
        }
      } catch (error) {
        return {
          statusCode: 500,
          message: 'Internal server error',
        }
      }
    })
  }
  getBadge() {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const badges = yield this.iAdminRepository.getBadge()
        if (badges) {
          return {
            statusCode: 200,
            message: 'fecthed',
            result: badges,
          }
        } else {
          return {
            statusCode: 204,
            message: 'not badges',
          }
        }
      } catch (error) {
        console.log(error)
        return {
          statusCode: 500,
          message: 'Internal server error',
        }
      }
    })
  }
  getLendedTransactions(req) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const result = yield this.iAdminRepository.getLendedTransactions(req)
        if (result) {
          return {
            statusCode: 200,
            message: 'fetched',
            result: result,
          }
        } else {
          return {
            statusCode: 204,
            message: 'not badges',
          }
        }
      } catch (error) {
        console.log(error)
        return {
          statusCode: 500,
          message: 'Internal server error',
        }
      }
    })
  }
  getBorrowedTransactions(req) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const result = yield this.iAdminRepository.getBorrowedTransactions(req)
        if (result) {
          return {
            statusCode: 200,
            message: 'fetched',
            result: result,
          }
        } else {
          return {
            statusCode: 204,
            message: 'not badges',
          }
        }
      } catch (error) {
        console.log(error)
        return {
          statusCode: 500,
          message: 'Internal server error',
        }
      }
    })
  }
  getSingleUser(req) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const result = yield this.iAdminRepository.getSingleUser(req)
        if (result) {
          return {
            statusCode: 200,
            message: 'fetched',
            result: result,
          }
        } else {
          return {
            statusCode: 204,
            message: 'no content',
          }
        }
      } catch (error) {
        console.log(error)
        return {
          statusCode: 500,
          message: 'Internal server error',
        }
      }
    })
  }
  getReportedPost(req) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const result = yield this.iAdminRepository.getReportedPost(req)
        if (result) {
          return {
            statusCode: 200,
            message: 'fetched',
            result: result,
          }
        } else {
          return {
            statusCode: 204,
            message: 'no content',
          }
        }
      } catch (error) {
        console.log(error)
        return {
          statusCode: 500,
          message: 'Internal server error',
        }
      }
    })
  }
  getUserStatistics() {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const result = yield this.iAdminRepository.getUserStatistics()
        if (result) {
          return {
            statusCode: 200,
            result: result,
          }
        } else {
          return {
            statusCode: 204,
            message: 'no content',
          }
        }
      } catch (error) {
        console.log(error)
        return {
          statusCode: 500,
          message: 'Internal server error',
        }
      }
    })
  }
  getPeriodUserStatistics(req) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const result = yield this.iAdminRepository.getPeriodUserStatistics(req)
        if (result) {
          return {
            statusCode: 200,
            result: result,
          }
        } else {
          return {
            statusCode: 204,
            message: 'no content',
          }
        }
      } catch (error) {
        console.log(error)
        return {
          statusCode: 500,
          message: 'Internal server error',
        }
      }
    })
  }
  getHighLendscoreUsers(req) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const result = yield this.iAdminRepository.getHighLendscoreUser(req)
        if (result) {
          return {
            statusCode: 200,
            result: result,
          }
        } else {
          return {
            statusCode: 204,
            message: 'no content',
          }
        }
      } catch (error) {
        console.log(error)
        return {
          statusCode: 500,
          message: 'Internal server error',
        }
      }
    })
  }
  getPostStatistics() {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const result = yield this.iAdminRepository.getPostStatistics()
        if (result) {
          return {
            statusCode: 200,
            result: result,
          }
        } else {
          return {
            statusCode: 204,
            message: 'no content',
          }
        }
      } catch (error) {
        console.log(error)
        return {
          statusCode: 500,
          message: 'Internal server error',
        }
      }
    })
  }
  getPeriodPostStatistics(req) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const result = yield this.iAdminRepository.getPeriodPostStatistics(req)
        if (result) {
          return {
            statusCode: 200,
            result: result,
          }
        } else {
          return {
            statusCode: 204,
            message: 'no content',
          }
        }
      } catch (error) {
        console.log(error)
        return {
          statusCode: 500,
          message: 'Internal server error',
        }
      }
    })
  }
  getHighBoostedPost(req) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const result = yield this.iAdminRepository.getHighBoostedPost(req)
        if (result) {
          return {
            statusCode: 200,
            result: result,
          }
        } else {
          return {
            statusCode: 204,
            message: 'no content',
          }
        }
      } catch (error) {
        console.log(error)
        return {
          statusCode: 500,
          message: 'Internal server error',
        }
      }
    })
  }
  getPost(postId) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const result = yield this.iAdminRepository.getPost(postId)
        if (result) {
          return {
            statusCode: 200,
            result: result,
          }
        } else {
          return {
            statusCode: 204,
            message: 'no content',
          }
        }
      } catch (error) {
        console.log(error)
        return {
          statusCode: 500,
          message: 'Internal server error',
        }
      }
    })
  }
  banPost(postId) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const result = yield this.iAdminRepository.banPost(postId)
        if (result) {
          const { email } = result.userId
          const code = result.ID
          const subject = `One of your post has deleted for violation of terms and conditions  click this link to know about the post ${result.imageUrls[0].secure_url} `
          this.sendEmail.sendEmail({ email, subject, code })
          return {
            statusCode: 200,
            result: result,
          }
        }
        return {
          statusCode: 409,
          message: 'un expected error occured',
        }
      } catch (error) {
        console.log(error)
        return {
          statusCode: 500,
          message: 'Internal server error',
        }
      }
    })
  }
  //transactions statistics
  getTransactionStatistics() {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const result = yield this.iAdminRepository.getTransactionStatistics()
        if (result) {
          return {
            statusCode: 200,
            result: result,
          }
        } else {
          return {
            statusCode: 204,
            message: 'no content',
          }
        }
      } catch (error) {
        console.log(error)
        return {
          statusCode: 500,
          message: 'Internal server error',
        }
      }
    })
  }
  getPeriodTransactionStatistics(req) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const result =
          yield this.iAdminRepository.getPeriodTransactionStatistics(req)
        if (result) {
          return {
            statusCode: 200,
            result: result,
          }
        } else {
          return {
            statusCode: 204,
            message: 'no content',
          }
        }
      } catch (error) {
        console.log(error)
        return {
          statusCode: 500,
          message: 'Internal server error',
        }
      }
    })
  }
  getPeriodRequestStatistics(req) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const result =
          yield this.iAdminRepository.getPeriodRequestStatistics(req)
        if (result) {
          return {
            statusCode: 200,
            result: result,
          }
        } else {
          return {
            statusCode: 204,
            message: 'no content',
          }
        }
      } catch (error) {
        console.log(error)
        return {
          statusCode: 500,
          message: 'Internal server error',
        }
      }
    })
  }
  makeRefund(req) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const { culpritId, beneficiaryId, lendId } = req.body
        let bookId
        const lendedTransaction =
          yield this.iAdminRepository.getLendedSingleTransaction(lendId)
        const request =
          lendedTransaction === null || lendedTransaction === void 0
            ? void 0
            : lendedTransaction.requestId
        bookId = request.book._id
        if (
          lendedTransaction === null || lendedTransaction === void 0
            ? void 0
            : lendedTransaction.hasMadeRefund
        ) {
          return {
            statusCode: 400,
            message: 'This transaction has already made a refund',
          }
        }
        const user = yield this.iAdminRepository.getPaymentId(beneficiaryId)
        const book = yield this.iAdminRepository.getBook(bookId)
        if (book && user) {
          const price = book.price
          console.log(
            price,
            user === null || user === void 0 ? void 0 : user.paymentId
          )
          const response = yield this.paymentService.createRefund(
            user === null || user === void 0 ? void 0 : user.paymentId,
            price,
            `Refund for the book ${book.ID}`,
            user === null || user === void 0 ? void 0 : user._id
          )
          if (response) {
            const email = user.email
            const subject = `Refund of rs${price} for book ${book.bookName} is initiated`
            yield this.sendEmail.sendEmail({
              email,
              subject,
              code: `BookID: ${book.ID}`,
            })
            const reduce = yield this.iAdminRepository.reduceCautionDeposit(
              culpritId,
              Number(price),
              `Deducted for dispute for book ${book.bookName}`,
              lendId
            )
            if (reduce) {
              return {
                statusCode: 200,
                message: 'Refund has initiated success fully',
              }
            }
          }
        }
        return {
          statusCode: 204,
        }
      } catch (error) {
        return {
          statusCode: 500,
          message: 'Internal server error',
        }
      }
    })
  }
}
exports.default = AdminUseCase
