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
const redis_1 = require('../framework/config/redis')
class UserUseCase {
  constructor(
    iuserRepository,
    sendEmail,
    jwtToken,
    cloudinary,
    PaymentService
  ) {
    this.iUserRepository = iuserRepository
    this.sendEmail = sendEmail
    this.JwtToken = jwtToken
    this.Cloudinary = cloudinary
    this.Payments = PaymentService
  }
  registrationUser(user) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const email = user.email
        const isEmailExists = yield this.iUserRepository.findByEmail(email)
        if (isEmailExists) {
          return {
            status: false,
            message: 'Account already exists',
            statusCode: 409,
          }
        }
        const subject = 'Please provide this code for your registration'
        const code = Math.floor(100000 + Math.random() * 9000).toString()
        const sendEmail = yield this.sendEmail.sendEmail({
          email,
          subject,
          code,
        })
        const token = yield this.JwtToken.SignUpActivationToken(user, code)
        if (sendEmail) {
          return {
            status: true,
            statusCode: 200,
            message: 'Otp has send to your email ',
            activationToken: token,
          }
        }
        return {
          status: true,
          statusCode: 200,
        }
      } catch (error) {
        console.log(error)
        return {
          status: false,
          statusCode: 500,
          message: 'Internal server Error',
        }
      }
    })
  }
  checkUsername(username) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const isValid = yield this.iUserRepository.checkUsernameValid(username)
        if (isValid) {
          return {
            statusCode: 422,
            message: 'Username is not valid',
          }
        }
        return {
          statusCode: 200,
          message: 'Username is valid',
        }
      } catch (error) {
        console.log(error)
        return {
          statusCode: 500,
          message: 'Internal server Error',
        }
      }
    })
  }
  activateUser(token, otp) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const data = yield this.JwtToken.verifyOtpToken(token, otp)
        if ('user' in data) {
          const result = yield this.iUserRepository.createUser(data.user)
          if (!result) {
            return {
              statusCode: 500,
              message: 'error in creating the user',
            }
          } else {
            const { _id, role } = result
            const accessToken = yield this.JwtToken.SignInAccessToken({
              id: _id,
              role: role,
            })
            const refreshToken = yield this.JwtToken.SignInRefreshToken({
              id: _id,
              role: role,
            })
            return Object.assign(
              Object.assign(
                { statusCode: 200, message: 'User registered SuccessFully' },
                result
              ),
              { accessToken, refreshToken }
            )
          }
        } else {
          return Object.assign({ statusCode: 401 }, data)
        }
      } catch (error) {
        console.log(error)
        return {
          status: false,
          statusCode: 500,
          message: 'Internal server Error',
        }
      }
    })
  }
  resendOtp(token) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const otp = 'resend'
        const result = yield this.JwtToken.verifyOtpToken(token, otp)
        if ('user' in result) {
          const code = Math.floor(100000 + Math.random() * 9000).toString()
          const email = result.user.email
          const subject = 'Please provide the new code for the registration'
          const sendEmail = yield this.sendEmail.sendEmail({
            email,
            subject,
            code,
          })
          const user = result.user
          const token = yield this.JwtToken.SignUpActivationToken(user, code)
          if (sendEmail) {
            return {
              statusCode: 200,
              message: 'Otp has resend to the email',
              activationToken: token,
            }
          }
        }
        return Object.assign({ statusCode: 401 }, result)
      } catch (error) {
        return {
          status: false,
          statusCode: 500,
          message: 'Internal server Error',
        }
      }
    })
  }
  googleAuth(user) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const email = user.email
        const emailExists = yield this.iUserRepository.findByEmail(email)
        if (emailExists) {
          if (emailExists.isBlocked) {
            return {
              statusCode: 401,
              status: false,
              message: 'User Blocked contect admin',
            }
          }
          redis_1.redis.set(
            `user:${emailExists._id}`,
            JSON.stringify(emailExists)
          )
          const accessToken = yield this.JwtToken.SignInAccessToken({
            id: emailExists._id,
            role: emailExists.role,
          })
          const refreshToken = yield this.JwtToken.SignInRefreshToken({
            id: emailExists._id,
            role: emailExists.role,
          })
          const {
            _id,
            email,
            userName,
            isSubscribed,
            privacy,
            name,
            isGoogleSignUp,
            profile,
          } = emailExists
          return {
            statusCode: 200,
            message: 'User logged In',
            result: {
              _id,
              email,
              userName,
              isSubscribed,
              privacy,
              name,
              isGoogleSignUp,
              profile,
            },
            accessToken,
            refreshToken,
          }
        } else {
          const savedUser = yield this.iUserRepository.googleSignup(user)
          redis_1.redis.set(`user:${savedUser._id}`, JSON.stringify(savedUser))
          if (!savedUser) {
            return {
              statusCode: 500,
              status: false,
              message: 'Error in creating user',
            }
          }
          const {
            _id,
            email,
            userName,
            isSubscribed,
            privacy,
            name,
            isGoogleSignUp,
          } = savedUser
          const token = yield this.JwtToken.SignInAccessToken({
            id: savedUser._id,
            role: savedUser.role,
          })
          const refreshToken = yield this.JwtToken.SignInRefreshToken({
            id: savedUser._id,
            role: savedUser.role,
          })
          return {
            statusCode: 201,
            status: true,
            message: 'User registered Successfully',
            accessToken: token,
            refreshToken,
            result: {
              _id,
              email,
              userName,
              isSubscribed,
              privacy,
              name,
              isGoogleSignUp,
            },
          }
        }
      } catch (error) {
        console.log(error)
        return {
          status: false,
          statusCode: 500,
          message: 'Internal server Error',
        }
      }
    })
  }
  loginUser(user) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const { password, email } = user
        const emailExists = yield this.iUserRepository.findByEmail(user.email)
        if (emailExists) {
          if (emailExists.isBlocked) {
            return {
              statusCode: 401,
              status: false,
              message: 'User Blocked contect admin',
            }
          }
          const isValid = yield this.iUserRepository.loginUser(
            emailExists.password,
            password
          )
          if (isValid) {
            redis_1.redis.set(
              `user:${emailExists._id}`,
              JSON.stringify(emailExists)
            )
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
              message: 'User logged success fully',
              _id: emailExists._id,
            }
          } else {
            return {
              statusCode: 401,
              message: 'Invalid Credentials',
            }
          }
        }
        return {
          statusCode: 401,
          message: 'User dont exist',
        }
      } catch (error) {
        console.log(error)
        return {
          statusCode: 500,
          status: false,
          message: 'Internal server error',
        }
      }
    })
  }
  loginWithOtp(user) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const email = user.email
        const emailExists = yield this.iUserRepository.findByEmail(user.email)
        if (!emailExists) {
          return {
            statusCode: 401,
            message: 'Email provided is not registered',
          }
        }
        if (emailExists.isBlocked) {
          return {
            statusCode: 401,
            message: 'User Blocked contect admin',
          }
        }
        const subject = 'Please provide this code for your Login'
        const code = Math.floor(100000 + Math.random() * 9000).toString()
        const sendEmail = yield this.sendEmail.sendEmail({
          email,
          subject,
          code,
        })
        const token = yield this.JwtToken.SignUpActivationToken(user, code)
        if (!sendEmail) {
          return {
            statusCode: 500,
            message: 'Internal Server error',
          }
        }
        return {
          statusCode: 200,
          accessToken: token,
          message: 'Otp Has sent to the email',
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
  submitOtp(token, code) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const data = yield this.JwtToken.verifyOtpToken(token, code)
        if ('user' in data) {
          const email = data.user.email
          const emailExists = yield this.iUserRepository.findByEmail(email)
          if (emailExists) {
            redis_1.redis.set(
              `user:${emailExists._id}`,
              JSON.stringify(emailExists)
            )
            const refreshToken = yield this.JwtToken.SignInRefreshToken({
              id: emailExists._id,
              role: emailExists.role,
            })
            const accessToken = yield this.JwtToken.SignInAccessToken({
              id: emailExists._id,
              role: emailExists.role,
            })
            return {
              statusCode: 200,
              accessToken,
              refreshToken,
              _id: emailExists._id,
            }
          }
        }
        return Object.assign({ statusCode: 401 }, data)
      } catch (error) {
        return {
          statusCode: 500,
          message: 'Internal server error',
        }
      }
    })
  }
  //create post
  createPost(req) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const { files } = req
        const { description } = req.body
        const { id } = req.params
        const file = files.images
        const cloudRes = yield this.Cloudinary.cloudinaryUpload(file)
        if (Array.isArray(cloudRes)) {
          const imageUrlArray = cloudRes.map((document) => ({
            publicId: document.public_id,
            secure_url: document.secure_url,
          }))
          const post = yield this.iUserRepository.addPost(
            id,
            description,
            imageUrlArray,
            req
          )
          if (post) {
            return {
              statusCode: 201,
              message: 'Post added sucessfully',
            }
          }
          return {
            statusCode: 409,
            message: 'unexpected error occured',
          }
        } else {
          const imageUrlArray = [
            {
              publicId: cloudRes.public_id,
              secure_url: cloudRes.secure_url,
            },
          ]
          const post = yield this.iUserRepository.addPost(
            id,
            description,
            imageUrlArray,
            req
          )
          if (post) {
            return {
              statusCode: 201,
              message: 'Post added sucessfully',
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
  getPost(userId) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const data = yield this.iUserRepository.getPost(userId)
        if (data) {
          return {
            statusCode: 200,
            result: data,
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
  getUser(userId, req) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const user = yield this.iUserRepository.getUser(userId, req)
        if (user) {
          return {
            statusCode: 200,
            result: user,
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
          message: 'Internak server error',
        }
      }
    })
  }
  suggestUsers(req) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const user = yield this.iUserRepository.getSuggestion(req)
        if (user) {
          return {
            statusCode: 200,
            result: user,
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
          message: 'Internak server error',
        }
      }
    })
  }
  followUser(req) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const result = yield this.iUserRepository.followUser(req)
        if (result) {
          return {
            statusCode: 200,
            message: 'Follower User success fully',
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
          message: 'Internal sever error',
        }
      }
    })
  }
  unFollowUser(req) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const result = yield this.iUserRepository.unFollowUser(req)
        if (result) {
          return {
            statusCode: 200,
            message: 'unfollowed User success fully',
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
          message: 'Internal sever error',
        }
      }
    })
  }
  getPostData(req, id) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const response = yield this.iUserRepository.fetchPostData(req, id)
        if (response) {
          return {
            statusCode: 200,
            message: 'post fetched sucessfully',
            result: response,
          }
        } else {
          return {
            statusCode: 204,
          }
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
  likePost(req) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const result = yield this.iUserRepository.likePost(req)
        if (result) {
          return { statusCode: 200, message: 'Liked the post', result: result }
        }
        return {
          statusCode: 409,
          message: 'unexpected error occured',
        }
      } catch (error) {
        return {
          statusCode: 500,
          message: 'Internal  sever error',
        }
      }
    })
  }
  UnLikePost(req) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const result = yield this.iUserRepository.unlikePost(req)
        if (result) {
          return { statusCode: 200, message: 'uniLiked the post' }
        }
        return {
          statusCode: 409,
          message: 'unexpected error occured',
        }
      } catch (error) {
        return {
          statusCode: 500,
          message: 'Internal  sever error',
        }
      }
    })
  }
  verifyEditEmail(req) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const { email } = req.body
        const emailExist = yield this.iUserRepository.findByEmail(email)
        if (emailExist) {
          return {
            statusCode: 409,
            message: 'This email aready exixt please try another one',
          }
        }
        const subject = 'Please provide this code for your verification'
        const code = Math.floor(100000 + Math.random() * 9000).toString()
        const sendEmail = yield this.sendEmail.sendEmail({
          email,
          subject,
          code,
        })
        const token = yield this.JwtToken.SignUpActivationToken(
          { email: email },
          code
        )
        if (sendEmail) {
          return {
            status: true,
            statusCode: 200,
            message: 'Otp has send to your email ',
            activationToken: token,
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
          message: 'internal server error',
        }
      }
    })
  }
  verifyEmailEditOtp(token, otp) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const data = yield this.JwtToken.verifyOtpToken(token, otp)
        if ('user' in data) {
          return {
            statusCode: 200,
            message: 'Email success fully verified',
          }
        }
        return Object.assign({ statusCode: 401 }, data)
      } catch (error) {
        console.log(error)
        return {
          statusCode: 500,
          message: 'internal server error',
        }
      }
    })
  }
  editUserDetails(req) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const { files } = req
        const file = files.newProfile
        if (file) {
          const cloudRes = yield this.Cloudinary.cloudinaryUpload(file)
          const result = yield this.iUserRepository.updateUserDetails(
            req,
            cloudRes
          )
          if (result) {
            return {
              statusCode: 200,
              message: 'User details updated successfully',
            }
          }
          return {
            statusCode: 409,
            message: 'unexpected error occured',
          }
        } else {
          const result = yield this.iUserRepository.updateUserDetails(req, {})
          if (result) {
            return {
              statusCode: 200,
              message: 'User details updated successfully',
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
  getPostDetails(req) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const post = yield this.iUserRepository.getPostDetails(req)
        if (post) {
          return {
            statusCode: 200,
            result: post,
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
  addComment(req) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const comment = yield this.iUserRepository.addComment(req)
        if (comment) {
          return {
            statusCode: 200,
            message: 'added the comment',
            result: comment,
          }
        } else {
          return {
            statusCode: 409,
            message: 'unexpected error occured',
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
  addReply(req) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const result = yield this.iUserRepository.addReply(req)
        if (result) {
          return {
            statusCode: 200,
            result: result,
            message: 'comment added',
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
  getF(req) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const result = yield this.iUserRepository.getF(req)
        if (result) {
          return {
            statusCode: 200,
            result: result,
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
  postReport(req) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const file = req.files['images[]']
        if (file !== undefined) {
          const cloudRes = yield this.Cloudinary.cloudinaryUpload(file)
          if (Array.isArray(cloudRes)) {
            const imageUrlArray = cloudRes.map((document) => ({
              publicId: document.public_id,
              secure_url: document.secure_url,
            }))
            const response = yield this.iUserRepository.postReport(
              req,
              imageUrlArray
            )
            if (response) {
              return {
                statusCode: 200,
                message: 'Reported successfully',
              }
            } else {
              return {
                statusCode: 409,
                message:
                  'You have already reported on this wait until it get resolved',
              }
            }
          } else {
            const imageUrlArray = [
              {
                publicId: cloudRes.public_id,
                secure_url: cloudRes.secure_url,
              },
            ]
            const response = yield this.iUserRepository.postReport(
              req,
              imageUrlArray
            )
            if (response) {
              return {
                statusCode: 200,
                message: 'Reported successfully',
              }
            } else {
              return {
                statusCode: 409,
                message:
                  'You have already reported on this wait until it get resolved',
              }
            }
          }
        } else {
          const response = yield this.iUserRepository.postReport(req, [])
          if (response) {
            return {
              statusCode: 200,
              message: 'Reported successfully',
            }
          } else {
            return {
              statusCode: 409,
              message:
                'You have already reported on this wait until it get resolved',
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
  getBookshelf(userId) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const data = yield this.iUserRepository.getBookshelf(userId)
        if (data) {
          return {
            statusCode: 200,
            result: data,
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
  viewBook(bookId, userId) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const book = yield this.iUserRepository.getOneBook(bookId, userId)
        if (book) {
          return {
            statusCode: 200,
            result: book,
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
  editBook(req) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const response = yield this.iUserRepository.editBook(req)
        if (response) {
          return {
            statusCode: 200,
            message: 'Bookshelf edited successfully',
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
  removeBook(req) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const response = yield this.iUserRepository.removeBook(req)
        if (response) {
          return {
            statusCode: 200,
            message: 'Removed success fully',
          }
        } else {
          return {
            statusCode: 409,
            message: 'unexpected error occured',
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
  getRequestBook(req) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const { userId, bookId, ownerId } = req.query
        const isSubscribed =
          yield this.iUserRepository.checkIsSubscribed(userId)
        if (!isSubscribed) {
          return {
            statusCode: 403,
            message: 'Not subscribed',
          }
        }
        const result = yield this.iUserRepository.makeRequest(req)
        if (!result.status) {
          return {
            statusCode: 400,
            result: result,
          }
        } else {
          return {
            statusCode: 200,
            result: result,
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
  createOrder(amount, id) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const user = yield this.iUserRepository.findUserById(id)
        if (user) {
          const result = yield this.Payments.createOrder(amount, user)
          if (result) {
            return {
              statusCode: 200,
              result: result,
            }
          }
        } else {
          return {
            statusCode: 404,
            message: 'user creddentials not found',
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
  verifyPayment(orderId, paymentId, signature, userId) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const isSuccess = yield this.Payments.verifyPaymentSignature(
          orderId,
          paymentId,
          signature
        )
        if (isSuccess) {
          const result = yield this.iUserRepository.makeUserSubscribed(
            userId,
            paymentId
          )
          return {
            statusCode: 200,
            message: 'payment sucess',
            result: result,
          }
        } else {
          return {
            statusCode: 400,
            message: 'paymenr failed',
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
  getChat(req) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const { senderId, userId } = req.params
        if (senderId && userId) {
          const result = yield this.iUserRepository.getChat(senderId, userId)
          if (result) {
            return {
              statusCode: 200,
              result: result,
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
  getAllChat(req) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const result = yield this.iUserRepository.getAllChat(req)
        if (result) {
          return {
            statusCode: 200,
            result: result,
          }
        } else {
          return {
            statusCode: 204,
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
  sendMessage(req) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const result = yield this.iUserRepository.createMessage(req)
        if (result) {
          return {
            statusCode: 200,
            result: result,
          }
        } else {
          return {
            statusCode: 204,
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
  getAllMessages(chatId, pageNo) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const result = yield this.iUserRepository.getAllMessages(chatId, pageNo)
        if (result) {
          return {
            statusCode: 200,
            result: result,
          }
        } else {
          return {
            statusCode: 204,
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
  makeMsgRead(messageId) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const result = yield this.iUserRepository.makeMsgRead(messageId)
        if (result) {
          return {
            statusCode: 200,
          }
        }
        return {
          statusCode: 204,
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
  declineRequest(req) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const response = yield this.iUserRepository.declineRequest(req)
        if (response) {
          return {
            statusCode: 200,
            result: response,
          }
        } else {
          return {
            statusCode: 204,
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
  addStory(req) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const { files } = req
        const file = files.images
        const { userId } = req.params
        const cloudRes = yield this.Cloudinary.cloudinaryUpload(file)
        if (cloudRes) {
          const imageUrl = {
            public_id:
              cloudRes === null || cloudRes === void 0
                ? void 0
                : cloudRes.public_id,
            secure_url:
              cloudRes === null || cloudRes === void 0
                ? void 0
                : cloudRes.secure_url,
          }
          const response = yield this.iUserRepository.addStory(userId, imageUrl)
          if (response) {
            return {
              statusCode: 201,
              result: response,
            }
          } else {
          }
        }
        return {
          statusCode: 204,
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
  getStories(req) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const response = yield this.iUserRepository.getStories(req)
        if (response) {
          return {
            statusCode: 200,
            result: response,
          }
        }
        return {
          statusCode: 204,
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
  makeStoryViewed(req) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const storyId = req.body.storyId
        const userId = req.body.userId
        const result = yield this.iUserRepository.makeStoryViewed(
          storyId,
          userId
        )
        if (result) {
          return { statusCode: 200 }
        }
        return {
          statusCode: 204,
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
  acceptRequest(req) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const result = yield this.iUserRepository.acceptRequest(req)
        if (result.status == true) {
          return {
            statusCode: 200,
            result: result,
          }
        } else {
          return {
            message: result.message.toString(),
            statusCode: 404,
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
  getLendedBooks(userId, pageNo) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const result = yield this.iUserRepository.getLendedBooks(userId, pageNo)
        if (result) {
          return {
            statusCode: 200,
            result: result,
          }
        }
        return {
          statusCode: 204,
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
  getBorrowedBooks(userId, pageNo) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const result = yield this.iUserRepository.getBorrowedBooks(
          userId,
          pageNo
        )
        if (result) {
          return {
            statusCode: 200,
            result: result,
          }
        }
        return {
          statusCode: 204,
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
  getNotifications(userId, pageNo, unRead) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const result = yield this.iUserRepository.getNotifications(
          userId,
          pageNo,
          unRead
        )
        if (result) {
          return {
            statusCode: 200,
            result: result,
          }
        }
        return {
          statusCode: 204,
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
  giveBackBook(req) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const result = yield this.iUserRepository.giveBookBack(req)
        if (result) {
          return {
            statusCode: 200,
            result: result,
          }
        }
        return {
          statusCode: 204,
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
  collectBook(req) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const result = yield this.iUserRepository.collectBook(req)
        if (result) {
          return {
            statusCode: 200,
            result: result,
          }
        } else {
          return {
            statusCode: 204,
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
  //change password before login
  verifyChangePassEmail(email) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const emailExists = yield this.iUserRepository.findByEmail(email)
        if (!emailExists) {
          return {
            statusCode: 401,
            message: 'Email does not exist',
          }
        }
        if (
          emailExists === null || emailExists === void 0
            ? void 0
            : emailExists.isGoogleSignUp
        ) {
          return {
            statusCode: 401,
            message: "Google signup user, you cant't do this action",
          }
        }
        const subject = 'Please provide this code for your verification'
        const code = Math.floor(100000 + Math.random() * 9000).toString()
        const sendEmail = yield this.sendEmail.sendEmail({
          email,
          subject,
          code,
        })
        const user = emailExists._id ? emailExists._id : ''
        const token = yield this.JwtToken.signChangePassTokenOtp(
          user,
          code,
          email
        )
        if (sendEmail && token) {
          return {
            status: true,
            statusCode: 200,
            message: 'Otp has send to your email ',
            activationToken: token,
          }
        }
        return {
          statusCode: 409,
          message: 'Un expected error occured',
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
  resendChangePassOtpBeforeLogin(token) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        if (token == 'undefined') {
          return {
            statusCode: 401,
            message: 'Token is expired',
          }
        }
        const otp = 'resend'
        const result = yield this.JwtToken.verifyOtpToken(token, otp)
        if ('user' in result) {
          const code = Math.floor(100000 + Math.random() * 9000).toString()
          console.log(result)
          const email = result.email
          const subject = 'Please provide the new code for the registration'
          const sendEmail = yield this.sendEmail.sendEmail({
            email,
            subject,
            code,
          })
          const token = yield this.JwtToken.signChangePassTokenOtp(
            '',
            code,
            email
          )
          if (sendEmail && token) {
            return {
              statusCode: 200,
              message: 'Otp has resend to the email',
              activationToken: token,
            }
          }
        }
        return Object.assign({ statusCode: 401 }, result)
      } catch (error) {
        return {
          status: false,
          statusCode: 500,
          message: 'Internal server Error',
        }
      }
    })
  }
  submitOtpBeforeLogin(token, code) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const data = yield this.JwtToken.verifyOtpToken(token, code)
        if ('user' in data) {
          const email = data.email
          const token = yield this.JwtToken.signChangePassToken(email)
          if (token) {
            return { statusCode: 200, result: token, activationToken: token }
          }
        }
        return Object.assign({ statusCode: 401 }, data)
      } catch (error) {
        return {
          statusCode: 500,
          message: 'Internal server error',
        }
      }
    })
  }
  submitNewPasswordBeforeLogin(password, token) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const isValid = yield this.validatePassword(password)
        if (isValid !== true) {
          return {
            statusCode: 401,
            message: isValid,
          }
        }
        if (!token) {
          return {
            statusCode: 401,
            message: 'Token is missing',
          }
        }
        const user = yield this.JwtToken.verifyChangePassToken(token)
        if ('user' in user) {
          const result = yield this.iUserRepository.changePassWord(
            password,
            user.user
          )
          if (result) {
            return {
              statusCode: 200,
              message: 'password changed successfully',
            }
          }
        } else {
          return {
            statusCode: 401,
            message: user.message,
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
  //
  searchUsers(pageNo, query, user) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const response = yield this.iUserRepository.searchUsers(
          query,
          pageNo,
          user
        )
        if (response) {
          return {
            statusCode: 200,
            result: response,
          }
        } else {
          return {
            statusCode: 204,
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
  exploreBooks(userId) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const result = yield this.iUserRepository.exploreBooks(userId)
        if (result) {
          return {
            statusCode: 200,
            result: result,
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
  otpChangePassAfterLogin(userId, email) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const user = yield this.iUserRepository.findByEmailAndUserId(
          userId,
          email
        )
        if (user === null || user === void 0 ? void 0 : user.isGoogleSignUp) {
          return {
            statusCode: 400,
            message: 'this is a google signuped account',
          }
        }
        if (user) {
          const subject = 'Please provide this code for your change password'
          const code = Math.floor(100000 + Math.random() * 9000).toString()
          const sendEmail = yield this.sendEmail.sendEmail({
            email,
            subject,
            code,
          })
          const token = yield this.JwtToken.signChangePassTokenOtp(
            userId,
            code,
            user.email
          )
          if (token && sendEmail) {
            return {
              statusCode: 200,
              result: token,
              activationToken: token,
            }
          }
        }
        return {
          statusCode: 400,
          message: 'Cant generate otp',
        }
      } catch (error) {
        return {
          statusCode: 500,
          message: 'Internal server error',
        }
      }
    })
  }
  otpResendPassAfterLogin(token, userId) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const otp = 'resend'
        const result = yield this.JwtToken.verifyOtpToken(token, otp)
        if ('user' in result) {
          const code = Math.floor(100000 + Math.random() * 9000).toString()
          const email = result.email
          const subject = 'Please provide the new code for the registration'
          const sendEmail = yield this.sendEmail.sendEmail({
            email,
            subject,
            code,
          })
          const token = yield this.JwtToken.signChangePassTokenOtp(
            userId,
            code,
            email
          )
          if (sendEmail && token) {
            return {
              statusCode: 200,
              message: 'Otp has resend to the email',
              activationToken: token,
            }
          }
        }
        return Object.assign({ statusCode: 401 }, result)
      } catch (error) {
        return {
          statusCode: 500,
          message: 'Internal server error',
        }
      }
    })
  }
  submitChangePassOtpAfterLogin(otpToken, otp) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const result = yield this.JwtToken.verifyOtpToken(otpToken, otp)
        if ('user' in result) {
          const email = result.email
          const user = result.user
          const token = yield this.JwtToken.signChangePassToken(email)
          if (token) {
            return { statusCode: 200, result: token, activationToken: token }
          }
        } else {
          return {
            statusCode: 400,
            result: result,
          }
        }
        return {
          statusCode: 409,
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
  validatePassword(password) {
    return __awaiter(this, void 0, void 0, function* () {
      const hasCapitalLetter = /[A-Z]/.test(password)
      const hasSpecialCharacter = /[!@#$%^&*(),.?":{}|<>]/.test(password)
      const hasNumber = /[0-9]/.test(password)
      const hasAlphabet = /[a-zA-Z]/.test(password)
      if (!hasCapitalLetter) {
        return 'Uppercase is missing'
      }
      if (!hasSpecialCharacter) {
        return 'Special charecter is missing [$%^&]'
      }
      if (!hasNumber) {
        return 'Number is missing'
      }
      if (!hasAlphabet) {
        return 'Alphabets is missing'
      }
      if (password.length < 8) {
        return 'Password must hav 8 character'
      }
      return true
    })
  }
  checkOldPassword(userId, password) {
    return __awaiter(this, void 0, void 0, function* () {
      console.log(password)
      try {
        const isValid = yield this.validatePassword(password)
        if (isValid !== true) {
          return {
            statusCode: 400,
            message: isValid,
          }
        }
        const result = yield this.iUserRepository.checkOldPassword(
          password,
          userId
        )
        if (result) {
          const email = result.email
          if (result.isGoogleSignUp) {
            return {
              statusCode: 400,
              message: 'You can do this action',
            }
          }
          const token = yield this.JwtToken.signChangePassToken(email)
          if (token) {
            return { statusCode: 200, result: token, activationToken: token }
          }
        } else {
          return {
            statusCode: 400,
            message: 'Password does not match',
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
  submitNewPassword(token, password) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        if (!token) {
          return {
            statusCode: 400,
            message: 'Token is missing',
          }
        }
        const user = yield this.JwtToken.verifyChangePassToken(token)
        if ('user' in user) {
          const result = yield this.iUserRepository.changePassWord(
            password,
            user.user
          )
          if (result) {
            return {
              statusCode: 200,
              message: 'password changed successfully',
            }
          }
        } else {
          return {
            statusCode: 400,
            message: user.message,
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
  getDeposit(req) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const user = yield this.iUserRepository.getDeposit(req)
        if (user) {
          return {
            statusCode: 200,
            result: user,
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
  addOrderFunds(userId, email) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const user = yield this.iUserRepository.findByEmailAndUserId(
          userId,
          email
        )
        if (!(user === null || user === void 0 ? void 0 : user.isSubscribed)) {
          return {
            statusCode: 400,
            message: 'user is not subscribed',
          }
        }
        const amount = 1000 - Number(user.cautionDeposit)
        if (user) {
          const result = yield this.Payments.createAddFundsOrder(amount, user)
          if (result) {
            return {
              statusCode: 200,
              result: Object.assign(Object.assign({}, result), { amount }),
            }
          }
        } else {
          return {
            statusCode: 400,
            message: 'User credentials not found',
          }
        }
        return {
          statusCode: 409,
          message: 'usnexpected error occured',
        }
      } catch (error) {
        console.log(error)
        console.log(error)
        return {
          statusCode: 500,
          message: 'Internal server error',
        }
      }
    })
  }
  verifyaddFundsPayment(orderId, paymentId, signature, userId, amount) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const isSuccess = yield this.Payments.verifyPaymentSignature(
          orderId,
          paymentId,
          signature
        )
        if (isSuccess) {
          const user = yield this.iUserRepository.updateCautionDeposit(
            userId,
            amount
          )
          if (user) {
            return {
              statusCode: 200,
              message: 'user caution deposit updated',
            }
          } else {
            return {
              statusCode: 400,
            }
          }
        } else {
          return {
            statusCode: 400,
            message: 'Payment is unsuccess',
          }
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
exports.default = UserUseCase
