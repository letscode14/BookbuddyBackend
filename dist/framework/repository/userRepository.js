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
const userModel_1 = __importDefault(require('../databases/userModel'))
const bcryptjs_1 = __importDefault(require('bcryptjs'))
const postModel_1 = __importDefault(require('../databases/postModel'))
const mongodb_1 = require('mongodb')
const reportsModel_1 = __importDefault(require('../databases/reportsModel'))
const bookShelfModel_1 = __importDefault(require('../databases/bookShelfModel'))
const redis_1 = require('../config/redis')
const badgeModel_1 = __importDefault(require('../databases/badgeModel'))
const lendScoreModel_1 = __importDefault(require('../databases/lendScoreModel'))
const chatModel_1 = __importDefault(require('../databases/chatModel'))
const messageModel_1 = __importDefault(require('../databases/messageModel'))
const notificationModel_1 = __importDefault(
  require('../databases/notificationModel')
)
const requestModel_1 = __importDefault(require('../databases/requestModel'))
const storyModel_1 = __importDefault(require('../databases/storyModel'))
const agenda_1 = __importDefault(require('../config/agenda'))
const mongoose_1 = __importDefault(require('mongoose'))
const socketService_1 = require('../services/socketService')
const deductionModel_1 = __importDefault(require('../databases/deductionModel'))
class UserRepository {
  findByEmailAndUserId(id, email) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const user = yield userModel_1.default.findOne(
          { _id: new mongodb_1.ObjectId(id), email: email },
          {
            _id: 1,
            email: 1,
            isGoogleSignUp: 1,
            cautionDeposit: 1,
            isSubscribed: 1,
            name: 1,
            contact: 1,
          }
        )
        if (user) {
          return user
        } else return null
      } catch (error) {
        console.log(error)
        return null
      }
    })
  }
  BlockedUser() {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const cacheKey = 'blockedUsers'
        const cachedData = yield redis_1.redis.get(cacheKey)
        if (cachedData) {
          return JSON.parse(cachedData)
        }
        const blockedUsers = yield userModel_1.default
          .find({ isBlocked: true })
          .select('_id')
          .lean()
        yield redis_1.redis.set(
          cacheKey,
          JSON.stringify(blockedUsers),
          'EX',
          86400
        )
        return blockedUsers
      } catch (error) {
        console.log(error)
        return null
      }
    })
  }
  findByEmail(email) {
    return __awaiter(this, void 0, void 0, function* () {
      const user = yield userModel_1.default
        .findOne({ email })
        .select('-followers -following -reportCount -reportsMade')
      if (user) {
        return user
      } else {
        return null
      }
    })
  }
  findUserById(id) {
    return __awaiter(this, void 0, void 0, function* () {
      return yield userModel_1.default.findById(id).select('-password')
    })
  }
  checkUsernameValid(username) {
    return __awaiter(this, void 0, void 0, function* () {
      return yield userModel_1.default.findOne({ userName: username })
    })
  }
  createUser(user) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const { name, userName, password, email } = user
        const savedUser = yield userModel_1.default.create({
          name,
          email,
          password,
          userName,
        })
        if (savedUser) {
          const {
            email,
            _id,
            role,
            profile,
            isDeleted,
            isSubscribed,
            isGoogleSignUp,
            name,
            userName,
          } = savedUser
          return {
            email,
            _id,
            role,
            profile,
            isDeleted,
            isSubscribed,
            isGoogleSignUp,
            name,
            userName,
          }
        }
        return null
      } catch (error) {
        console.log(error)
        return null
      }
    })
  }
  googleSignup(user) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const { name, userName, email, profileUrl } = user
        const generatedPassword =
          Math.random().toString(36).slice(-8) +
          Math.random().toString(36).slice(-8)
        const savedUser = yield userModel_1.default.create({
          name,
          userName,
          email,
          profile: { profileUrl: profileUrl, publicId: '' },
          password: generatedPassword,
          isGoogleSignUp: true,
        })
        return savedUser.toObject()
      } catch (error) {
        console.log(error)
        return null
      }
    })
  }
  loginUser(hashPass, password) {
    return __awaiter(this, void 0, void 0, function* () {
      return bcryptjs_1.default.compare(password, hashPass)
    })
  }
  addPost(id, description, images, req) {
    return __awaiter(this, void 0, void 0, function* () {
      var _a, _b, _c
      try {
        let bookshelf
        if (
          (_a = req.body) === null || _a === void 0 ? void 0 : _a.addToBookshelf
        ) {
          const {
            author,
            ShelfDescription,
            bookName,
            limit,
            location,
            address,
            lng,
            lat,
            price,
          } = req.body
          bookshelf = yield bookShelfModel_1.default.findOneAndUpdate(
            { userId: new mongodb_1.ObjectId(id) },
            {
              $push: {
                shelf: {
                  author: author,
                  bookName: bookName,
                  description: ShelfDescription,
                  imageUrl: images[0],
                  limit: limit,
                  location: {
                    address: address,
                    lat: lat,
                    lng: lng,
                  },
                  price: Number(price),
                },
              },
            },
            { upsert: true, new: true }
          )
        }
        const lastAddedBookId =
          (_b =
            bookshelf === null || bookshelf === void 0
              ? void 0
              : bookshelf.shelf[bookshelf.shelf.length - 1]) === null ||
          _b === void 0
            ? void 0
            : _b._id
        const savedPost = yield postModel_1.default.create({
          userId: new mongodb_1.ObjectId(id),
          description,
          imageUrls: images,
          isAddedToBookShelf: (
            (_c = req.body) === null || _c === void 0
              ? void 0
              : _c.addToBookshelf
          )
            ? new mongodb_1.ObjectId(lastAddedBookId)
            : null,
        })
        if (savedPost) {
          return savedPost
        }
        return null
      } catch (error) {
        console.log(error)
      }
    })
  }
  getPost(id) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const post = yield postModel_1.default.find({
          userId: new mongodb_1.ObjectId(id),
          isDeleted: false,
          isRemoved: false,
        })
        if (post) return post
        else return null
      } catch (error) {
        console.log(error)
        return null
      }
    })
  }
  getUser(id, req) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
          return null
        }
        const user = yield userModel_1.default
          .findById(id)
          .populate({
            path: 'lendscore',
            select: 'lendScore badgeId',
            populate: {
              path: 'badgeId',
              select: 'name iconUrl',
              model: 'Badge',
            },
          })
          .select('-password -reportsMade -reportCount')
        if (user) {
          const followersLength = user.followers.length
          const followingLength = user.following.length
          const followingMap = {}
          const followersMap = {}
          user.following.forEach((following) => {
            followingMap[following.userId.toString()] = true
          })
          user.followers.forEach((follower) => {
            followersMap[follower.userId.toString()] = true
          })
          const userObject = user.toObject()
          delete userObject.following
          delete userObject.followers
          const postLength = yield postModel_1.default.countDocuments({
            isRemoved: false,
            isDeleted: false,
            userId: new mongodb_1.ObjectId(id),
          })
          return {
            user: userObject,
            followersLength,
            followingLength,
            followingMap,
            followersMap,
            postLength,
          }
        }
        return null
      } catch (error) {
        console.log(error)
        return null
      }
    })
  }
  getSuggestion(req) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const id = req.query.id
        const limit = 2
        let queue = req.session.suggestionQueue || []
        yield userModel_1.default.findByIdAndUpdate(id, {
          $set: { updateAt: new Date() },
        })
        function refillQueue() {
          return __awaiter(this, void 0, void 0, function* () {
            const user = yield userModel_1.default
              .findById(id)
              .populate('following.userId', 'userName')
              .select('-password')
            if (!user) {
              return []
            }
            const followersIds = user.following.map(
              (following) => following.userId
            )
            if (followersIds.length === 0) {
              return yield userModel_1.default
                .find(
                  {
                    _id: { $ne: new mongodb_1.ObjectId(id) },
                  },
                  {
                    _id: 1,
                    createdAt: 1,
                    isSubscribed: 1,
                    profile: 1,
                    userName: 1,
                    name: 1,
                  }
                )
                .sort({ createdAt: -1 })
            }
            const followingOfFollowers = yield userModel_1.default.find({
              _id: { $in: followersIds },
            })
            const secondDegreeFollowerIds = new Set()
            followingOfFollowers.forEach((follower) => {
              follower.following.forEach((f) => {
                if (!followersIds.includes(f.userId)) {
                  secondDegreeFollowerIds.add(f.userId.toString())
                }
              })
            })
            secondDegreeFollowerIds.delete(id)
            if (secondDegreeFollowerIds.size === 0) {
              const followersId = user.followers.map((doc) => doc.userId)
              return yield userModel_1.default.find(
                {
                  _id: { $in: followersId },
                },
                {
                  _id: 1,
                  createdAt: 1,
                  isSubscribed: 1,
                  profile: 1,
                  userName: 1,
                  name: 1,
                }
              )
            }
            return yield userModel_1.default
              .find({
                _id: { $in: Array.from(secondDegreeFollowerIds) },
              })
              .select('isSubscribed userName profile name _id')
              .populate('followers.userId', 'userName isSubscribed')
              .select('-password -followers -following')
          })
        }
        if (queue.length === 0) {
          queue = yield refillQueue()
          req.session.suggestionQueue = queue
        }
        const responseUsers = []
        for (let i = 0; i < limit && queue.length > 0; i++) {
          responseUsers.push(queue.pop())
        }
        req.session.suggestionQueue = queue
        return responseUsers
      } catch (error) {
        console.log(error)
        return null
      }
    })
  }
  followUser(req) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const { userId, target } = req.body
        if (!userId || !target) {
          return false
        }
        const user = yield userModel_1.default.findByIdAndUpdate(userId, {
          $addToSet: { following: { userId: new mongodb_1.ObjectId(target) } },
        })
        yield userModel_1.default.findByIdAndUpdate(target, {
          $addToSet: { followers: { userId: new mongodb_1.ObjectId(userId) } },
        })
        const message = `${user === null || user === void 0 ? void 0 : user.userName} has started following you`
        yield this.createNotification(target, message, 'User', userId, userId)
        return true
      } catch (error) {
        console.log(error)
        return false
      }
    })
  }
  unFollowUser(req) {
    return __awaiter(this, void 0, void 0, function* () {
      const { userId, target } = req.body
      if (!userId || !target) {
        return false
      }
      try {
        yield userModel_1.default.findByIdAndUpdate(userId, {
          $pull: { following: { userId: new mongodb_1.ObjectId(target) } },
        })
        yield userModel_1.default.findByIdAndUpdate(target, {
          $pull: { followers: { userId: new mongodb_1.ObjectId(userId) } },
        })
        return true
      } catch (error) {
        console.log(error)
        return false
      }
    })
  }
  fetchPostData(req, id) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const { pageNo } = req.query
        const limit = 2
        const skip = (Number(pageNo) - 1) * limit
        if (!id) {
          throw new Error('User ID is required')
        }
        const user = yield userModel_1.default
          .findById(id, { followers: 1, _id: 1, following: 1 })
          .populate('followers.userId', '_id')
          .populate('following.userId', '_id')
          .exec()
        const followerIds = user.followers.map(
          (follower) => follower.userId._id
        )
        const followingIds = user.following.map(
          (following) => following.userId._id
        )
        const userIds = [...new Set([...followingIds, user._id])]
        const totalCount = yield postModel_1.default.countDocuments({
          userId: { $in: userIds },
          isDeleted: false,
          isRemoved: false,
        })
        const posts = yield postModel_1.default
          .find({
            userId: { $in: userIds },
            isDeleted: false,
            isRemoved: false,
          })
          .populate('userId', 'userName email profile isSubscribed')
          .populate('likes', 'userName')
          .populate('comments.author', 'userName  profile isSubscribed')
          .populate('comments.replies.author', 'userName profile isSubscribed')
          .sort({ createdAt: -1 })
          .limit(limit)
          .skip(skip)
          .exec()
        const totalPage = Math.ceil(totalCount / limit)
        return posts.length > 0
          ? {
              post: posts,
              hasMore: Number(pageNo) == totalPage ? false : true,
            }
          : null
      } catch (error) {
        console.log(error)
        return null
      }
    })
  }
  likePost(req) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const { postId, userId } = req.body
        const result = yield postModel_1.default.findByIdAndUpdate(
          postId,
          {
            $addToSet: { likes: userId },
          },
          { new: true }
        )
        if (result) {
          yield result.populate({
            path: 'likes',
            select: 'userName profile',
          })
          const postOwner = result.userId
          const imageUrl =
            result.imageUrls.length > 0 ? result.imageUrls[0].secure_url : null
          const latestLike =
            result.likes.length > 0
              ? result.likes[result.likes.length - 1]
              : null
          const userName = result.likes[result.likes.length - 1]
          const message = `${userName.userName} has like you post`
          if (postOwner.toString() !== userId) {
            const notification = yield this.createNotification(
              postOwner.toString(),
              message,
              'Post',
              userId,
              postId
            )
            return { notification }
          } else {
            return { notification: {} }
          }
        }
        return null
      } catch (error) {
        console.log(error)
        return null
      }
    })
  }
  unlikePost(req) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const { postId, userId } = req.body
        const result = yield postModel_1.default.findByIdAndUpdate(
          postId,
          {
            $pull: { likes: userId },
          },
          { new: true }
        )
        if (result) {
          return true
        }
        return false
      } catch (error) {
        console.log(error)
        return false
      }
    })
  }
  updateUserDetails(req, cloudRes) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const {
          age,
          contact,
          newAdded,
          email,
          gender,
          name,
          privacy,
          userName,
          userId,
          profileUrl,
          publicId,
        } = req.body
        const defualt =
          'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png'
        let profile
        if (newAdded == 'true') {
          profile = {
            profileUrl: cloudRes.secure_url,
            publicId: cloudRes.public_id,
          }
        } else if (profileUrl == '') {
          profile = {
            profileUrl: defualt,
            publicId: '',
          }
        } else {
          profile = {
            profileUrl: profileUrl,
            publicId: publicId,
          }
        }
        const updatedUser = yield userModel_1.default
          .findByIdAndUpdate(
            userId,
            {
              age,
              contact,
              userName,
              email,
              gender,
              name,
              privacy: privacy == 'public' ? false : true,
              profile,
            },
            { new: true }
          )
          .select('-password -followers -following')
        if (updatedUser) {
          redis_1.redis.set(
            `user:${updatedUser._id}`,
            JSON.stringify(updatedUser)
          )
          return true
        }
        return null
      } catch (error) {
        console.log(error)
        return null
      }
    })
  }
  getPostDetails(req) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const { postId } = req.query
        const post = yield postModel_1.default
          .findOne({
            _id: new mongodb_1.ObjectId(
              postId === null || postId === void 0 ? void 0 : postId.toString()
            ),
            isRemoved: false,
          })
          .populate('likes', 'userName')
          .populate('userId', 'profile userName')
          .populate('comments.author', 'profile userName')
          .populate('comments.replies.author', 'profile userName')
          .lean()
        if (post) {
          return post
        }
        return null
      } catch (error) {
        console.log(error)
        return null
      }
    })
  }
  addComment(req) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const { postId, userId, comment } = req.body
        const post = yield postModel_1.default.findByIdAndUpdate(
          postId,
          {
            $push: {
              comments: {
                author: new mongodb_1.ObjectId(userId),
                content: comment,
              },
            },
          },
          { new: true }
        )
        if (post) {
          yield post.populate(
            'comments.author',
            'userName profile isSubscribed'
          )
          const newComment = post.comments[post.comments.length - 1]
          const user = post.comments[0].toObject()
          const message = `${user.author.userName} commented on your post .${comment}`
          yield this.createNotification(
            post.userId.toString(),
            message,
            'Post',
            userId,
            postId
          )
          return newComment
        } else {
          return null
        }
      } catch (error) {
        console.log(error)
        return null
      }
    })
  }
  addReply(req) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const { userId, commentId, content, postId, authorId } = req.body
        const post = yield postModel_1.default
          .findOneAndUpdate(
            {
              _id: postId,
              'comments._id': commentId,
            },
            {
              $push: {
                'comments.$.replies': {
                  content: content,
                  author: new mongodb_1.ObjectId(userId),
                },
              },
            },
            { new: true }
          )
          .populate('comments.replies.author', 'userName profile isSubscribed')
        if (post) {
          const updatedComment = post.comments.find((comment) => {
            if (comment._id == commentId) {
              return comment
            }
          })
          const newReply =
            updatedComment === null || updatedComment === void 0
              ? void 0
              : updatedComment.replies[updatedComment.replies.length - 1]
          if (newReply && newReply.author && 'userName' in newReply.author) {
            const message = `${newReply.author.userName} has commented on the Post .${content}`
            if (post.userId !== userId) {
              yield this.createNotification(
                post.userId.toString(),
                message,
                'Post',
                userId,
                postId
              )
            }
            const Replymessage = `${newReply.author.userName} replied to your comment .${newReply.content}`
            yield this.createNotification(
              authorId,
              Replymessage,
              'Post',
              userId,
              postId
            )
          }
          return newReply
        }
        return null
      } catch (error) {
        console.log(error)
        return null
      }
    })
  }
  getF(req) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const { userId, query, pageNo, currentUser } = req.query
        const limit = 10
        const skip = (Number(pageNo) - 1) * limit
        const data = yield userModel_1.default.findById(currentUser, {
          _id: 1,
          followers: 1,
          following: 1,
        })
        const followersMapCurrent = {}
        data === null || data === void 0
          ? void 0
          : data.followers.map((followers) => {
              followersMapCurrent[followers.userId.toString()] = true
            })
        const followingMap = {}
        data === null || data === void 0
          ? void 0
          : data.following.map((following) => {
              followingMap[following.userId.toString()] = true
            })
        let response
        if (query == 'followers') {
          const followers = yield userModel_1.default.aggregate([
            { $match: { _id: new mongodb_1.ObjectId(userId) } },
            {
              $unwind: '$followers',
            },
            {
              $lookup: {
                from: 'users',
                pipeline: [
                  {
                    $project: {
                      _id: 1,
                      profile: 1,
                      name: 1,
                      userName: 1,
                    },
                  },
                ],
                localField: 'followers.userId',
                foreignField: '_id',
                as: 'followers.userId',
              },
            },
            { $unwind: '$followers.userId' },
            {
              $group: {
                _id: '$_id',
                followers: { $push: '$followers' },
              },
            },
            {
              $project: {
                totalCount: { $size: '$followers' },
                followers: {
                  $slice: ['$followers', skip, limit],
                },
              },
            },
          ])
          response = followers[0]
          response.totalCount = Math.ceil(
            (response === null || response === void 0
              ? void 0
              : response.totalCount) / limit
          )
          response.followingMapCurrent = followingMap
          response.followersMapCurrent = followersMapCurrent
        } else {
          const followers = yield userModel_1.default.aggregate([
            { $match: { _id: new mongodb_1.ObjectId(userId) } },
            {
              $unwind: '$following',
            },
            {
              $lookup: {
                from: 'users',
                pipeline: [
                  {
                    $project: {
                      _id: 1,
                      profile: 1,
                      name: 1,
                      userName: 1,
                    },
                  },
                ],
                localField: 'following.userId',
                foreignField: '_id',
                as: 'following.userId',
              },
            },
            { $unwind: '$following.userId' },
            {
              $group: {
                _id: '$_id',
                following: { $push: '$following' },
              },
            },
            {
              $project: {
                totalCount: { $size: '$following' },
                following: {
                  $slice: ['$following', skip, limit],
                },
              },
            },
          ])
          response = followers[0]
          response.totalCount = Math.ceil(response.totalCount / limit)
          response.followingMapCurrent = followingMap
          response.followersMapCurrent = followersMapCurrent
        }
        if (response) {
          return response
        }
        return null
      } catch (error) {
        console.log(error)
        return null
      }
    })
  }
  postReport(req, images) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const { culprit, type, contentId, reportedBy, reason, bookAmount } =
          req.body
        if (!culprit || !type || !contentId || !reportedBy || !reason) {
          return null
        }
        const report = yield reportsModel_1.default.findOne({
          reportedBy: new mongodb_1.ObjectId(reportedBy),
          targetId: new mongodb_1.ObjectId(contentId),
          targetType: type,
          status: { $in: ['Pending', 'Reviewed'] },
          isRemoved: false,
        })
        if (report) {
          return null
        }
        if (type == 'Post') {
          yield postModel_1.default.updateOne(
            { _id: contentId },
            { $inc: { reportCount: 1 } }
          )
        }
        const reported = yield reportsModel_1.default.create({
          reportedBy,
          targetType: type,
          targetId: contentId,
          reason,
          damageImages: images,
          bookAmount: bookAmount ? bookAmount : null,
        })
        if (type === 'Lended') {
          yield bookShelfModel_1.default.findOneAndUpdate(
            {
              userId: new mongodb_1.ObjectId(reportedBy),
              'lended._id': contentId,
            },
            { $push: { 'lended.$.reportsMade': reported._id } },
            { new: true }
          )
        }
        if (type == 'Borrowed') {
          yield bookShelfModel_1.default.findOneAndUpdate(
            {
              userId: new mongodb_1.ObjectId(reportedBy),
              'borrowed._id': contentId,
            },
            { $push: { 'borrowed.$.reportsMade': reported._id } },
            { new: true }
          )
        }
        if (reported) {
          yield userModel_1.default.findByIdAndUpdate(culprit, {
            $push: { reportCount: reported._id },
          })
          yield userModel_1.default.findByIdAndUpdate(reportedBy, {
            $push: { reportsMade: reported._id },
          })
        }
        if (reported) {
          return true
        }
        return false
      } catch (error) {
        console.log(error)
        return false
      }
    })
  }
  getBookshelf(userId) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const bookshelf = yield bookShelfModel_1.default.aggregate([
          {
            $match: {
              userId: new mongodb_1.ObjectId(userId),
            },
          },
          {
            $project: {
              shelf: {
                $filter: {
                  input: '$shelf',
                  as: 'item',
                  cond: {
                    $and: [
                      { $eq: ['$$item.isRemoved', false] },
                      { $eq: ['$$item.isDeleted', false] },
                    ],
                  },
                },
              },
              userId: 1,
            },
          },
        ])
        if (bookshelf.length) {
          return bookshelf[0]
        }
        return null
      } catch (error) {
        console.log(error)
        return null
      }
    })
  }
  getOneBook(bookId, userId) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const userObjectId = new mongodb_1.ObjectId(userId)
        const bookObjectId = new mongodb_1.ObjectId(bookId)
        const result = yield bookShelfModel_1.default.aggregate([
          {
            $match: {
              userId: userObjectId,
              'shelf._id': bookObjectId,
            },
          },
          {
            $project: {
              shelf: {
                $filter: {
                  input: '$shelf',
                  as: 'item',
                  cond: { $eq: ['$$item._id', bookObjectId] },
                },
              },
            },
          },
        ])
        if (result[0].shelf) return result[0].shelf[0]
        else return null
      } catch (error) {
        console.log(error)
        return null
      }
    })
  }
  editBook(req) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const {
          bookName,
          author,
          description,
          location,
          limit,
          ID,
          userId,
          _id,
        } = req.body
        const editedShelf = yield bookShelfModel_1.default.findOneAndUpdate(
          {
            userId: new mongodb_1.ObjectId(userId),
            'shelf._id': new mongodb_1.ObjectId(_id),
          },
          {
            $set: {
              'shelf.$.bookName': bookName,
              'shelf.$.author': author,
              'shelf.$.location': location,
              'shelf.$.description': description,
              'shelf.$.limit': limit,
            },
          },
          { new: true }
        )
        if (editedShelf) {
          return true
        }
        return false
      } catch (error) {
        console.log(error)
        return false
      }
    })
  }
  removeBook(req) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const { shelfId, userId } = req.body
        const updatedBookshelf =
          yield bookShelfModel_1.default.findOneAndUpdate(
            {
              userId: new mongodb_1.ObjectId(userId),
              'shelf._id': new mongodb_1.ObjectId(shelfId),
            },
            {
              $set: { 'shelf.$.isDeleted': true },
            },
            { new: true }
          )
        const updatedPost = yield postModel_1.default.findOneAndUpdate(
          {
            isAddedToBookShelf: new mongodb_1.ObjectId(shelfId),
            userId: new mongodb_1.ObjectId(userId),
          },
          { $set: { isAddedToBookShelf: null } },
          { new: true }
        )
        if (updatedBookshelf && updatedPost) {
          return true
        }
        return false
      } catch (error) {
        console.log(error)
        return false
      }
    })
  }
  checkIsSubscribed(userId) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const user = yield userModel_1.default.findOne({
          _id: new mongodb_1.ObjectId(userId),
          isSubscribed: true,
        })
        if (user) {
          return true
        }
        return false
      } catch (error) {
        return false
      }
    })
  }
  makeUserSubscribed(userId, paymentId) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const badge = yield badgeModel_1.default.findOne({
          minScore: { $gte: 10 },
        })
        if (badge) {
          const lendScore = yield lendScoreModel_1.default.create({
            badgeId: new mongodb_1.ObjectId(badge._id),
            userId: new mongodb_1.ObjectId(userId),
            lendScore: 10,
          })
          yield lendScore.populate('badgeId', 'iconUrl name')
          yield userModel_1.default.findByIdAndUpdate(userId, {
            $set: {
              isSubscribed: true,
              lendscore: new mongodb_1.ObjectId(lendScore._id),
              cautionDeposit: 1000,
              paymentId: paymentId,
            },
          })
          return {
            badge: badge.iconUrl.secureUrl,
            lendScore: lendScore,
          }
        }
        return null
      } catch (error) {
        console.log(error)
        return null
      }
    })
  }
  getChat(senderId, userId) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const chat = yield chatModel_1.default
          .findOne({
            participants: { $all: [senderId, userId] },
            sender: { $in: [senderId] },
            isDeleted: false,
          })
          .populate('participants', 'userName profile name isSubscribed')
        if (chat) {
          yield messageModel_1.default.updateMany(
            {
              chatId: new mongodb_1.ObjectId(chat._id),
              senderId: new mongodb_1.ObjectId(userId),
            },
            { $set: { status: true } }
          )
          return chat
        } else {
          const partChat = yield chatModel_1.default.findOne({
            participants: { $all: [senderId, userId] },
          })
          if (partChat) {
            const updatedChat = yield chatModel_1.default
              .findOneAndUpdate(
                {
                  participants: { $all: [senderId, userId] },
                },
                { $push: { sender: new mongodb_1.ObjectId(senderId) } },
                { new: true }
              )
              .populate('participants', 'userName profile name isSubscribed')
            return updatedChat
          } else {
            const newChat = yield chatModel_1.default.create({
              participants: [
                new mongodb_1.ObjectId(senderId),
                new mongodb_1.ObjectId(userId),
              ],
              sender: [new mongodb_1.ObjectId(senderId)],
              isDeleted: false,
            })
            yield messageModel_1.default.updateMany(
              {
                chatId: new mongodb_1.ObjectId(newChat._id),
                senderId: new mongodb_1.ObjectId(userId),
              },
              { $set: { status: true } }
            )
            yield newChat.populate(
              'participants',
              'userName profile name isSubscribed'
            )
            return newChat
          }
        }
      } catch (error) {
        console.log(error)
        return null
      }
    })
  }
  getAllChat(req) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const { pageNo } = req.query
        const { userId } = req.params
        const limit = 12
        const skip = (Number(pageNo) - 1) * limit
        const chats = yield chatModel_1.default
          .find({
            participants: { $in: [new mongodb_1.ObjectId(userId)] },
            sender: { $in: [new mongodb_1.ObjectId(userId)] },
            isDeleted: false,
          })
          .sort({ 'lastMessage.timeStamp': -1 })
          .limit(limit)
          .skip(skip)
          .populate('participants', 'userName profile name isSubscribed')
          .populate('lastMessage.messageId', 'content senderId type')
        if (chats) {
          const chatIds = yield Promise.all(
            chats.map((c) =>
              __awaiter(this, void 0, void 0, function* () {
                var _a
                if (
                  ((_a = c.lastMessage.messageId) === null || _a === void 0
                    ? void 0
                    : _a.type) == 'request'
                ) {
                  yield c.lastMessage.messageId.populate('content')
                }
                return c._id
              })
            )
          )
          const unReadMesg = yield messageModel_1.default.find({
            chatId: { $in: chatIds },
            senderId: { $ne: new mongodb_1.ObjectId(userId) },
            status: false,
          })
          const messageMap = {}
          chats.forEach((chat) => {
            var _a, _b
            const unReadMessages = unReadMesg.filter(
              (m) =>
                m.chatId !== undefined &&
                m.chatId.toString() == chat._id.toString()
            )
            if (
              ((_a = unReadMessages[unReadMessages.length - 1]) === null ||
              _a === void 0
                ? void 0
                : _a.type) == 'request'
            ) {
              messageMap[chat._id.toString()] = {
                mCount: unReadMessages.length || 0,
                content: 'Request',
              }
            } else {
              messageMap[chat._id.toString()] = {
                mCount: unReadMessages.length || 0,
                content:
                  ((_b = unReadMessages[unReadMessages.length - 1]) === null ||
                  _b === void 0
                    ? void 0
                    : _b.content) || '',
              }
            }
          })
          return {
            chats,
            messageMap,
          }
        }
        return null
      } catch (error) {
        console.log(error)
        return null
      }
    })
  }
  createMessage(req) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const { senderId, chatId, content, isRequestForBook } = req.body
        let newChatfromUser = false
        const chat = yield chatModel_1.default.findById(chatId)
        if (chat) {
          const receiver =
            chat === null || chat === void 0
              ? void 0
              : chat.participants.find(
                  (participant) => participant.toString() !== senderId
                )
          if (chat.sender.length == 1 && chat.lastMessage.messageId == null) {
            if (receiver) {
              newChatfromUser = true
              yield chatModel_1.default.findByIdAndUpdate(chatId, {
                $push: { sender: receiver },
              })
            }
          }
        }
        const message = yield messageModel_1.default.create({
          type: isRequestForBook ? 'request' : 'message',
          chatId: new mongodb_1.ObjectId(chatId),
          senderId: new mongodb_1.ObjectId(senderId),
          content: isRequestForBook ? new mongodb_1.ObjectId(content) : content,
        })
        if (message) {
          yield chatModel_1.default.findByIdAndUpdate(chatId, {
            $set: {
              updatedAt: new Date().getTime(),
              lastMessage: {
                messageId: new mongodb_1.ObjectId(message._id),
                timeStamp: new Date().getTime(),
              },
            },
          })
        }
        if (message) {
          yield message.populate('chatId', 'participants senderId')
          yield message.populate('senderId', 'userName profile')
          if (isRequestForBook) {
            yield message.populate('content')
            yield message.populate({
              path: 'content',
              populate: {
                path: 'madeBy',
                select: 'userName',
              },
            })
          }
          return { message, isNewChat: newChatfromUser }
        }
        return null
      } catch (error) {
        console.log(error)
        return null
      }
    })
  }
  getAllMessages(chatId, pageNo) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const limit = 25
        const skip = (Number(pageNo) - 1) * limit
        const messages = yield messageModel_1.default
          .find({
            chatId,
            isDeleted: false,
          })
          .populate('senderId', 'userName profile')
          .sort({ timeStamp: -1 })
          .limit(limit)
          .skip(skip)
        if (messages) {
          yield Promise.all(
            messages.map((m) =>
              __awaiter(this, void 0, void 0, function* () {
                if (m.type === 'request') {
                  yield m.populate('content')
                  yield m.populate({
                    path: 'content',
                    populate: {
                      path: 'madeBy',
                      select: 'userName',
                    },
                  })
                }
              })
            )
          )
          const totalCount = yield messageModel_1.default.countDocuments({
            chatId,
            isDeleted: false,
          })
          const messageMap = messages.reduce((acc, m) => {
            acc[m._id] = false
            return acc
          }, {})
          const totalPage = Math.ceil(totalCount / limit)
          return {
            messageMap,
            messages,
            hasMore: Number(pageNo) == totalPage ? false : true,
          }
        }
        return null
      } catch (error) {
        console.log(error)
        return null
      }
    })
  }
  createNotification(userId, message, type, actionBy, contentId) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const oldNotification = yield notificationModel_1.default.findOne({
          type: type,
          content: message,
          ownerId: new mongodb_1.ObjectId(userId),
          contentId: new mongodb_1.ObjectId(contentId),
          actionBy: new mongodb_1.ObjectId(actionBy),
        })
        if (oldNotification) {
          const notification =
            yield notificationModel_1.default.findOneAndUpdate(
              {
                type: type,
                content: message,
                ownerId: new mongodb_1.ObjectId(userId),
                contentId: new mongodb_1.ObjectId(contentId),
                actionBy: new mongodb_1.ObjectId(actionBy),
              },
              { $set: { createdAt: new Date() } },
              { new: true }
            )
          if (notification) {
            const modelName =
              notification.type === 'Post'
                ? 'Post'
                : notification.type == 'User'
                  ? 'User'
                  : notification.type == 'Request'
                    ? 'Requests'
                    : ''
            const selectFields =
              notification.type == 'Post'
                ? 'imageUrls'
                : notification.type == 'User'
                  ? 'userName profile'
                  : notification.type == 'Request'
                    ? ''
                    : ''
            yield notification.populate({
              path: 'contentId',
              model: modelName,
              select: selectFields,
            })
            yield notification.populate({
              path: 'actionBy',
              model: 'User',
              select: 'userName profile',
            })
            return notification
          }
          return null
        } else {
          const notification = yield notificationModel_1.default.create({
            type: type,
            content: message,
            ownerId: new mongodb_1.ObjectId(userId),
            contentId: new mongodb_1.ObjectId(contentId),
            actionBy: new mongodb_1.ObjectId(actionBy),
          })
          if (notification) {
            const modelName =
              notification.type === 'Post'
                ? 'Post'
                : notification.type == 'User'
                  ? 'User'
                  : notification.type == 'Request'
                    ? 'Requests'
                    : ''
            const selectFields =
              notification.type == 'Post'
                ? 'imageUrls'
                : notification.type == 'User'
                  ? 'userName profile'
                  : notification.type == 'Request'
                    ? ''
                    : ''
            yield notification.populate({
              path: 'contentId',
              model: modelName,
              select: selectFields,
            })
            yield notification.populate({
              path: 'actionBy',
              model: 'User',
              select: 'userName profile',
            })
            return notification
          }
          return null
        }
      } catch (error) {
        console.log(error)
        return null
      }
    })
  }
  makeMsgRead(messageId) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const updatedMsg = yield messageModel_1.default.findByIdAndUpdate(
          messageId,
          {
            $set: { status: true },
          },
          { new: true }
        )
        if (updatedMsg) {
          return true
        }
        return false
      } catch (error) {
        console.log(error)
        return false
      }
    })
  }
  makeRequest(req) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const { userId, bookId, ownerId } = req.query
        const user = yield userModel_1.default
          .findOne({
            _id: new mongodb_1.ObjectId(
              userId === null || userId === void 0 ? void 0 : userId.toString()
            ),
          })
          .populate('lendscore')
          .select('-password -following -followers -reportsMade -reportCount')
        if (user.isSubscribed == false) {
          return {
            status: false,
            message: 'You have to subscribe to do this action',
          }
        }
        if (user.isSubscribed && user.cautionDeposit < 50) {
          return {
            status: false,
            message:
              'Your caution deposit have exceeded please do the payment for further actions',
          }
        }
        const bookshelf = yield bookShelfModel_1.default.findOne({
          userId: new mongodb_1.ObjectId(
            ownerId === null || ownerId === void 0 ? void 0 : ownerId.toString()
          ),
          'shelf._id': new mongodb_1.ObjectId(
            bookId === null || bookId === void 0 ? void 0 : bookId.toString()
          ),
        })
        let book
        if (
          bookshelf === null || bookshelf === void 0
            ? void 0
            : bookshelf.isRestricted
        ) {
          return {
            status: false,
            message: 'You restricted to  access bookshelf features ',
          }
        }
        if (bookshelf) {
          book = bookshelf.shelf.find((s) => s._id == bookId)
          if (
            (book === null || book === void 0 ? void 0 : book.status) !==
            'Available'
          ) {
            return {
              status: false,
              message: 'Book is not available at this time',
            }
          }
        }
        const request = yield requestModel_1.default.findOne({
          'book._id': new mongodb_1.ObjectId(
            bookId === null || bookId === void 0 ? void 0 : bookId.toString()
          ),
          stage: { $in: ['collect', 'approved', 'times up', 'requested'] },
          isPending: true,
        })
        if (request) {
          return {
            status: false,
            message: 'You already have a request on this book',
          }
        }
        const newRequest = yield requestModel_1.default.create({
          madeBy: new mongodb_1.ObjectId(
            userId === null || userId === void 0 ? void 0 : userId.toString()
          ),
          book: book,
          expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        })
        const runAt = new Date(Date.now() + 30 * 1000)
        yield agenda_1.default.schedule(runAt, 'requestExpiry', {
          requestId: newRequest._id.toString(),
        })
        if (newRequest) {
          const message = `${user.userName} has requested for book`
          const notification = yield this.createNotification(
            ownerId,
            message,
            'Requests',
            userId,
            newRequest._id
          )
          const io = (0, socketService_1.getIO)()
          if (io) {
            io.to(ownerId).emit('newnotification', {
              notification,
            })
          }
          const chat = yield chatModel_1.default.findOne({
            participants: { $all: [ownerId, userId] },
            sender: { $in: [userId, ownerId] },
            isDeleted: false,
          })
          if (chat) {
            return {
              status: true,
              book: book ? book : null,
              requestedUser: {
                userName:
                  user === null || user === void 0 ? void 0 : user.userName,
                profileUrl:
                  user === null || user === void 0 ? void 0 : user.profile,
                requestId: newRequest._id.toString(),
                chatId: chat._id.toString(),
              },
            }
          } else {
            const newChat = yield chatModel_1.default.create({
              participants: [
                new mongodb_1.ObjectId(userId),
                new mongodb_1.ObjectId(ownerId),
              ],
              sender: [
                new mongodb_1.ObjectId(userId),
                new mongodb_1.ObjectId(ownerId),
              ],
              isDeleted: false,
            })
            return {
              status: true,
              book: book ? book : null,
              requestedUser: {
                userName:
                  user === null || user === void 0 ? void 0 : user.userName,
                profileUrl:
                  user === null || user === void 0 ? void 0 : user.profile,
                requestId: newRequest._id.toString(),
                chatId: newChat._id.toString(),
              },
            }
          }
        }
        return {
          status: false,
          message: 'Unexpected error occured',
        }
      } catch (error) {
        console.log(error)
        return {
          status: false,
          message: 'internal server error',
        }
      }
    })
  }
  declineRequest(req) {
    return __awaiter(this, void 0, void 0, function* () {
      const { senderId, requestId, messageId, chatId } = req.body
      try {
        const request = yield requestModel_1.default.findByIdAndUpdate(
          requestId,
          {
            $set: { stage: 'declined', isCancelled: true, isPending: false },
          }
        )
        const newMessage = yield messageModel_1.default.create({
          type: 'request',
          chatId: new mongodb_1.ObjectId(chatId),
          senderId: new mongodb_1.ObjectId(senderId),
          content: new mongodb_1.ObjectId(requestId),
        })
        if (newMessage) {
          yield newMessage.populate('chatId', 'participants senderId')
          yield newMessage.populate('senderId', 'userName profile')
          yield newMessage.populate('content')
          yield newMessage.populate({
            path: 'content',
            populate: {
              path: 'madeBy',
              select: 'userName',
            },
          })
          yield chatModel_1.default.findByIdAndUpdate(chatId, {
            $set: {
              'lastMessage.messageId': new mongodb_1.ObjectId(
                newMessage === null || newMessage === void 0
                  ? void 0
                  : newMessage._id
              ),
              'lastMessage.timeStamp': new Date().getTime(),
            },
          })
          const { userName } = newMessage.senderId
          const message = `${userName} has declined your request`
          if (request) {
            const notification = yield this.createNotification(
              request === null || request === void 0
                ? void 0
                : request.madeBy.toString(),
              message,
              'Requests',
              senderId,
              request._id.toString()
            )
            const io = (0, socketService_1.getIO)()
            if (io) {
              io.to(request.madeBy.toString()).emit('newnotification', {
                notification,
              })
            }
          }
          yield agenda_1.default.cancel({ 'data.requestId': requestId })
          return newMessage
        }
        return null
      } catch (error) {
        console.log(error)
        return null
      }
    })
  }
  addStory(userId, imageUrls) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const story = yield storyModel_1.default
          .findOneAndUpdate(
            {
              userId: new mongodb_1.ObjectId(userId),
            },
            {
              $push: {
                stories: { imageUrl: imageUrls },
              },
            },
            { new: true, upsert: true }
          )
          .lean()
        if (story && story.stories.length > 0) {
          const latestStory = story.stories[story.stories.length - 1]
          const runAt = new Date(Date.now() + 2 * 60 * 60 * 1000)
          yield agenda_1.default.schedule(runAt, 'removeStory', {
            userId: userId,
            storyId: latestStory._id,
          })
          return latestStory
        } else {
          return null
        }
      } catch (error) {
        console.log(error)
        return null
      }
    })
  }
  removeStory(userId, id) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const stories = yield storyModel_1.default.findOneAndUpdate(
          {
            userId: new mongodb_1.ObjectId(userId),
          },
          {
            $pull: { stories: { _id: new mongodb_1.ObjectId(id) } },
          }
        )
        if (stories) {
          return true
        }
        return false
      } catch (error) {
        console.log(error)
        return false
      }
    })
  }
  getStories(req) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const { userId, pageNo } = req.query
        const limit = 6
        const skip = (Number(pageNo) - 1) * limit
        const user = yield userModel_1.default
          .findById(userId)
          .populate('following.userId', '_id')
          .exec()
        const followingIds = user.following.map(
          (following) => following.userId._id
        )
        const u = new mongodb_1.ObjectId(user._id)
        const stories = yield storyModel_1.default
          .find({
            userId: { $in: [...followingIds] },
            stories: { $ne: [] },
          })
          .sort({ 'stories.addedOn': -1 })
          .populate('userId', 'userName profile')
          .limit(limit)
          .skip(skip)
          .exec()
        let ownStorie = yield storyModel_1.default
          .findOne({
            userId: u,
          })
          .populate('userId', 'userName profile')
        if (!ownStorie) {
          ownStorie = yield storyModel_1.default
            .findOneAndUpdate(
              {
                userId: u,
              },
              {},
              { new: true }
            )
            .populate('userId', 'userName profile')
        }
        const updatedStories = [ownStorie, ...stories]
        const totalCount = yield storyModel_1.default.countDocuments({
          userId: { $in: [u, ...followingIds] },
          stories: { $ne: [] },
        })
        const totalPage = Math.ceil(totalCount / limit)
        if (stories) {
          return {
            stories: updatedStories,
            hasMore: Number(pageNo) == totalPage ? false : true,
          }
        }
        return null
      } catch (error) {
        console.log(error)
        return null
      }
    })
  }
  makeStoryViewed(storyId, userId) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const uStory = yield storyModel_1.default.findOneAndUpdate(
          {
            'stories._id': new mongodb_1.ObjectId(storyId),
          },
          {
            $set: {
              [`stories.$.views.${userId}`]: true,
            },
          },
          {
            new: true,
          }
        )
        if (uStory) {
          return true
        }
        return false
      } catch (error) {
        console.log(error)
        return false
      }
    })
  }
  makeRequestExpirey(requestId) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const updatedRequets = yield requestModel_1.default.findByIdAndUpdate(
          requestId,
          {
            $set: { stage: 'expired', isCancelled: true, isPending: false },
          }
        )
        if (updatedRequets) {
          return true
        }
        return false
      } catch (error) {
        console.log(error)
        return false
      }
    })
  }
  acceptRequest(req) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        function calculateKeepingTime(limitDays) {
          const currentDate = new Date()
          const futureDate = new Date(currentDate)
          futureDate.setDate(currentDate.getDate() + limitDays)
          return futureDate
        }
        const { requestId, userId, requestedUser, messageId, chatId } = req.body
        const reqUser = yield userModel_1.default
          .findById(requestedUser)
          .select('-password -following -followers -reportsMade -reportCount')
        if (
          !(reqUser === null || reqUser === void 0
            ? void 0
            : reqUser.isSubscribed)
        ) {
          return {
            status: false,
            message: 'This user is not verified',
          }
        }
        if (
          (reqUser === null || reqUser === void 0
            ? void 0
            : reqUser.isSubscribed) &&
          reqUser.cautionDeposit < 50
        ) {
          return {
            status: false,
            message: 'This user is restricted',
          }
        }
        const request = yield requestModel_1.default.findById(requestId)
        if (
          (request === null || request === void 0 ? void 0 : request.stage) !==
          'requested'
        ) {
          return {
            status: false,
            message: 'This request is not valid',
          }
        }
        const requestUserBookshelf = yield bookShelfModel_1.default.findOne({
          userId: new mongodb_1.ObjectId(requestedUser),
        })
        if (requestUserBookshelf) {
          if (requestUserBookshelf && requestUserBookshelf.isRestricted) {
            return {
              status: false,
              message: 'This user is restricted to have transactions',
            }
          }
        }
        const { limit, _id } = request.book
        const bookshelf = yield bookShelfModel_1.default.findOne({
          userId: new mongodb_1.ObjectId(userId),
          'shelf._id': new mongodb_1.ObjectId(_id),
        })
        const b =
          bookshelf === null || bookshelf === void 0
            ? void 0
            : bookshelf.shelf.find((book) => book && book._id.toString() == _id)
        if (b === null || b === void 0 ? void 0 : b.isDeleted) {
          return {
            status: false,
            message: 'This book is deleted  by you',
          }
        }
        if (b === null || b === void 0 ? void 0 : b.isRemoved) {
          return {
            status: false,
            message:
              'This book has removed by our team please contact admin for futher ',
          }
        }
        const lendScore = yield lendScoreModel_1.default
          .findOne({
            userId: new mongodb_1.ObjectId(userId),
          })
          .populate('badgeId')
        if (lendScore) {
          const { limit } =
            lendScore === null || lendScore === void 0
              ? void 0
              : lendScore.badgeId
          if (
            (lendScore === null || lendScore === void 0
              ? void 0
              : lendScore.totalBooksLended) >= limit
          ) {
            return {
              status: false,
              message: 'You have reached  your lending limit',
            }
          }
        }
        const keepingTime = calculateKeepingTime(Number(limit))
        const session = yield mongoose_1.default.startSession()
        try {
          session.startTransaction()
          const borrowed = yield bookShelfModel_1.default.findOneAndUpdate(
            { userId: new mongodb_1.ObjectId(requestedUser) },
            {
              $push: {
                borrowed: {
                  requestId: new mongodb_1.ObjectId(requestId),
                  from: new mongodb_1.ObjectId(userId),
                  keepingTime: keepingTime,
                  remainingDays: limit,
                },
              },
            },
            { upsert: true, session, new: true }
          )
          const lendeded = yield bookShelfModel_1.default.findOneAndUpdate(
            { userId: new mongodb_1.ObjectId(userId) },
            {
              $push: {
                lended: {
                  requestId: new mongodb_1.ObjectId(requestId),
                  lendedTo: new mongodb_1.ObjectId(requestedUser),
                  earnedScore: 10,
                  keepingTime: keepingTime,
                  remainingDays: limit,
                },
              },
            },
            { upsert: true, session, new: true }
          )
          yield bookShelfModel_1.default.findOneAndUpdate(
            {
              userId: new mongodb_1.ObjectId(userId),
              'shelf._id': new mongodb_1.ObjectId(_id),
            },
            {
              $set: {
                'shelf.$.status': 'Lended',
              },
            },
            { upsert: true, session }
          )
          yield lendScoreModel_1.default.findOneAndUpdate(
            { userId: new mongodb_1.ObjectId(userId) },
            { $inc: { totalBooksLended: 1, lendScore: 10 } },
            { session, new: true }
          )
          yield lendScoreModel_1.default.findOneAndUpdate(
            { userId: new mongodb_1.ObjectId(requestedUser) },
            { $inc: { totalBooksBorrowed: 1 } },
            { session }
          )
          yield requestModel_1.default.findByIdAndUpdate(
            requestId,
            { $set: { stage: 'approved', isAccepted: true } },
            { session }
          )
          const createdMessages = yield messageModel_1.default.create(
            [
              {
                type: 'request',
                chatId: new mongodb_1.ObjectId(chatId),
                senderId: new mongodb_1.ObjectId(userId),
                content: new mongodb_1.ObjectId(requestId),
              },
            ],
            { session }
          )
          const newMessage = createdMessages[0]
          if (newMessage) {
            yield newMessage.populate('chatId', 'participants senderId')
            yield newMessage.populate('senderId', 'userName profile')
            yield newMessage.populate('content')
            yield newMessage.populate({
              path: 'content',
              populate: {
                path: 'madeBy',
                select: 'userName',
              },
            })
            yield chatModel_1.default.findByIdAndUpdate(
              chatId,
              {
                $set: {
                  'lastMessage.messageId': new mongodb_1.ObjectId(
                    newMessage._id
                  ),
                  'lastMessage.timeStamp': new Date().getTime(),
                },
              },
              { session }
            )
          }
          const borrowId = borrowed.borrowed[borrowed.borrowed.length - 1]._id
          const lendedId = lendeded.lended[lendeded.lended.length - 1]._id
          yield session.commitTransaction()
          const { userName } = newMessage.senderId
          const message = `${userName} has accepted the request for book`
          const notification = yield this.createNotification(
            requestedUser,
            message,
            'Requests',
            userId,
            requestId
          )
          const io = (0, socketService_1.getIO)()
          if (io) {
            io.to(requestedUser).emit('newnotification', {
              notification,
            })
          }
          yield agenda_1.default.every(
            '*/20 * * * * *',
            'updateRemainingDays',
            {
              borrowId: borrowId && borrowId.toString(),
              lendedId: lendedId && lendedId.toString(),
            }
          )
          yield agenda_1.default.cancel({ 'data.requestId': requestId })
          return { status: true, message: newMessage }
        } catch (error) {
          console.error(error)
          yield session.abortTransaction()
          throw error
        } finally {
          yield session.endSession()
        }
      } catch (error) {
        console.log(error)
        return {
          status: false,
          message: "can't process the request right now",
        }
      }
    })
  }
  getLendedBooks(userId, pageNo) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const limit = 8
        const startIndex = (pageNo - 1) * limit
        const result = yield bookShelfModel_1.default.aggregate([
          { $match: { userId: new mongodb_1.ObjectId(userId) } },
          { $unwind: '$lended' },
          {
            $lookup: {
              from: 'requests',
              localField: 'lended.requestId',
              foreignField: '_id',
              as: 'lended.requestDetails',
            },
          },
          { $unwind: '$lended.requestDetails' },
          {
            $lookup: {
              from: 'users',
              localField: 'lended.lendedTo',
              foreignField: '_id',
              as: 'lended.lUser',
            },
          },
          { $unwind: '$lended.lUser' },
          {
            $project: {
              _id: 1,
              userId: 1,
              'lended._id': 1,
              'lended.requestId': 1,
              'lended.earnedScore': 1,
              'lended.isReturned': 1,
              'lended.remainingDays': 1,
              'lended.keepingTime': 1,
              'lended.lUser._id': 1,
              'lended.lUser.userName': 1,
              'lended.lUser.profile': 1,
              'lended.requestDetails': 1,
              'lended.lendedOn': 1,
              'lended.hasMadeRefund': 1,
            },
          },
          { $skip: startIndex },
          { $limit: limit },
          {
            $group: {
              _id: '$_id',
              userId: { $first: '$userId' },
              lended: { $push: '$lended' },
            },
          },
          {
            $project: {
              _id: 0,
              userId: 1,
              lended: 1,
            },
          },
        ])
        const totalCountResult = yield bookShelfModel_1.default.aggregate([
          { $match: { userId: new mongodb_1.ObjectId(userId) } },
          { $unwind: '$lended' },
          { $count: 'totalCount' },
        ])
        if (result.length > 0) {
          const totalCount =
            totalCountResult.length > 0 ? totalCountResult[0].totalCount : 0
          return {
            lended: result[0].lended,
            hasMore: Math.ceil(totalCount / limit) == pageNo ? false : true,
          }
        }
        return null
      } catch (error) {
        console.log(error)
        return null
      }
    })
  }
  getBorrowedBooks(userId, pageNo) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const limit = 8
        const startIndex = (pageNo - 1) * limit
        const result = yield bookShelfModel_1.default.aggregate([
          { $match: { userId: new mongodb_1.ObjectId(userId) } },
          { $unwind: '$borrowed' },
          {
            $lookup: {
              from: 'requests',
              localField: 'borrowed.requestId',
              foreignField: '_id',
              as: 'borrowed.requestDetails',
            },
          },
          { $unwind: '$borrowed.requestDetails' },
          {
            $lookup: {
              from: 'users',
              localField: 'borrowed.from',
              foreignField: '_id',
              as: 'borrowed.lUser',
            },
          },
          { $unwind: '$borrowed.lUser' },
          {
            $project: {
              _id: 1,
              userId: 1,
              'borrowed._id': 1,
              'borrowed.requestId': 1,
              'borrowed.from': 1,
              'borrowed.isReturned': 1,
              'borrowed.remainingDays': 1,
              'borrowed.keepingTime': 1,
              'borrowed.lUser._id': 1,
              'borrowed.lUser.userName': 1,
              'borrowed.lUser.profile': 1,
              'borrowed.requestDetails': 1,
              'borrowed.borrowedOn': 1,
            },
          },
          { $skip: startIndex },
          { $limit: limit },
          {
            $group: {
              _id: '$_id',
              userId: { $first: '$userId' },
              borrowed: { $push: '$borrowed' },
            },
          },
          {
            $project: {
              _id: 0,
              userId: 1,
              borrowed: 1,
            },
          },
        ])
        const totalCountResult = yield bookShelfModel_1.default.aggregate([
          { $match: { userId: new mongodb_1.ObjectId(userId) } },
          { $unwind: '$borrowed' },
          { $count: 'totalCount' },
        ])
        if (result.length > 0) {
          const totalCount =
            totalCountResult.length > 0 ? totalCountResult[0].totalCount : 0
          return {
            borrowed: result[0].borrowed,
            hasMore: Math.ceil(totalCount / limit) == pageNo ? false : true,
          }
        }
        return null
      } catch (error) {
        console.log(error)
        return null
      }
    })
  }
  updateRemainingDays(borrowId, lendedId) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        yield bookShelfModel_1.default.updateOne(
          {
            'lended._id': new mongodb_1.ObjectId(lendedId),
          },
          { $inc: { 'lended.$.remainingDays': -1 } }
        )
        yield bookShelfModel_1.default.updateOne(
          {
            'borrowed._id': new mongodb_1.ObjectId(borrowId),
          },
          { $inc: { 'borrowed.$.remainingDays': -1 } }
        )
        const lendedDoc = yield bookShelfModel_1.default.findOne(
          { 'lended._id': new mongodb_1.ObjectId(lendedId) },
          { 'lended.$': 1, userId: 1 }
        )
        if (lendedDoc && lendedDoc.lended && lendedDoc.lended.length > 0) {
          const lended = lendedDoc.lended[0]
          if (lended.remainingDays === 2) {
            const message = `Two days remaining for the book you lended`
            const notification = yield this.createNotification(
              lended.lendedTo.toString(),
              message,
              'Requests',
              lendedDoc.userId.toString(),
              lended.requestId.toString()
            )
            const io = (0, socketService_1.getIO)()
            if (io)
              io.to(lended.lendedTo.toString()).emit('newnotification', {
                notification,
              })
            console.log(
              `Lended document with ID ${lendedId} has only 2 days remaining.`
            )
          } else if (lended.remainingDays <= 0) {
            yield agenda_1.default.cancel({
              'data.lendedId': lendedId,
              'data.borrowId': borrowId,
            })
            const request = yield requestModel_1.default.findByIdAndUpdate(
              lended.requestId,
              { $set: { isPending: false } }
            )
            const newRequest = yield requestModel_1.default.create({
              madeBy: new mongodb_1.ObjectId(
                request === null || request === void 0 ? void 0 : request.madeBy
              ),
              book:
                request === null || request === void 0 ? void 0 : request.book,
              expiresAt:
                request === null || request === void 0
                  ? void 0
                  : request.expiresAt,
              stage: 'times up',
              isAccepted: true,
              isCancelled: false,
            })
            const user = yield bookShelfModel_1.default.findOneAndUpdate(
              { 'lended._id': new mongodb_1.ObjectId(lendedId) },
              {
                $set: {
                  'lended.$.requestId': new mongodb_1.ObjectId(newRequest._id),
                },
              },
              { new: true, projection: { userId: 1 } }
            )
            yield bookShelfModel_1.default.updateOne(
              {
                'borrowed._id': new mongodb_1.ObjectId(borrowId),
              },
              {
                $set: {
                  'borrowed.$.requestId': new mongodb_1.ObjectId(
                    newRequest._id
                  ),
                },
              }
            )
            const chatId = yield chatModel_1.default.findOne({
              participants: {
                $all: [
                  new mongodb_1.ObjectId(
                    user === null || user === void 0
                      ? void 0
                      : user.userId.toString()
                  ),
                  new mongodb_1.ObjectId(
                    request === null || request === void 0
                      ? void 0
                      : request.madeBy.toString()
                  ),
                ],
              },
            })
            const newMessage = yield messageModel_1.default.create({
              type: 'request',
              chatId: new mongodb_1.ObjectId(
                chatId === null || chatId === void 0 ? void 0 : chatId._id
              ),
              senderId: new mongodb_1.ObjectId(
                user === null || user === void 0
                  ? void 0
                  : user.userId.toString()
              ),
              content: new mongodb_1.ObjectId(
                newRequest === null || newRequest === void 0
                  ? void 0
                  : newRequest._id
              ),
            })
            if (newMessage) {
              yield newMessage.populate('chatId', 'participants senderId')
              yield newMessage.populate('senderId', 'userName profile')
              yield newMessage.populate('content')
              yield newMessage.populate({
                path: 'content',
                populate: {
                  path: 'madeBy',
                  select: 'userName',
                },
              })
              yield chatModel_1.default.findByIdAndUpdate(chatId, {
                $set: {
                  'lastMessage.messageId': new mongodb_1.ObjectId(
                    newMessage === null || newMessage === void 0
                      ? void 0
                      : newMessage._id
                  ),
                  'lastMessage.timeStamp': new Date().getTime(),
                },
              })
              const message = `Time to give back the book`
              const notification = yield this.createNotification(
                newRequest.madeBy.toString(),
                message,
                'Requests',
                (user === null || user === void 0 ? void 0 : user.userId)
                  ? user === null || user === void 0
                    ? void 0
                    : user.userId.toString()
                  : '',
                newRequest._id
              )
              const io = (0, socketService_1.getIO)()
              if (io) {
                io.to(newRequest.madeBy.toString()).emit(
                  'message recieved',
                  newMessage
                )
                io.to(newRequest.madeBy.toString()).emit('newnotification', {
                  notification,
                })
              }
              console.log(
                `Lended document with ID ${lendedId} has reached zero days. Time up.`
              )
            }
          }
        }
        return {
          status: 'false',
          message: '',
        }
      } catch (error) {
        console.log(error)
        return {
          status: 'error',
          message: '',
        }
      }
    })
  }
  getNotifications(userId, pageNo, unRead) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const limit = 10
        const skip = (Number(pageNo) - 1) * limit
        if (unRead) {
          const notification = yield notificationModel_1.default
            .find({
              ownerId: new mongodb_1.ObjectId(userId),
              read: false,
            })
            .sort({
              createdAt: -1,
            })
          if (notification) {
            return { hasMore: false, notifications: notification }
          }
        } else {
          yield notificationModel_1.default.updateMany(
            { ownerId: new mongodb_1.ObjectId(userId) },
            { read: true }
          )
          const totalCount = yield notificationModel_1.default.countDocuments({
            ownerId: new mongodb_1.ObjectId(userId),
          })
          const noti = yield notificationModel_1.default
            .find({
              ownerId: new mongodb_1.ObjectId(userId),
            })
            .populate({
              path: 'actionBy',
              model: 'User',
              select: 'userName profile',
            })
            .limit(limit)
            .skip(skip)
            .sort({ createdAt: -1 })
          for (const notification of noti) {
            const selectFields =
              notification.type === 'Post'
                ? 'imageUrls'
                : notification.type == 'User'
                  ? 'name userName profile'
                  : notification.type == 'Requests'
                    ? ''
                    : 'text'
            const model =
              notification.type == 'Post'
                ? 'Post'
                : notification.type == 'User'
                  ? 'User'
                  : notification.type == 'Requests'
                    ? 'Requests'
                    : ''
            yield notification.populate({
              path: 'contentId',
              model: model,
              select: selectFields,
            })
          }
          const totalPage = Math.ceil(totalCount / limit)
          return {
            notifications: noti,
            hasMore: Number(pageNo) == totalPage ? false : true,
          }
        }
        return null
      } catch (error) {
        console.log(error)
        return null
      }
    })
  }
  giveBookBack(req) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const { userId, requestId, sendTo, borrowId } = req.body
        const request = yield requestModel_1.default.findByIdAndUpdate(
          requestId,
          {
            $set: { isPending: false },
          },
          { new: true }
        )
        const newCollectRequest = yield requestModel_1.default.create({
          madeBy: new mongodb_1.ObjectId(
            request === null || request === void 0 ? void 0 : request.madeBy
          ),
          book: request === null || request === void 0 ? void 0 : request.book,
          expiresAt:
            request === null || request === void 0 ? void 0 : request.expiresAt,
          stage: 'collect',
          isAccepted: true,
          isCancelled: false,
        })
        yield bookShelfModel_1.default.findOneAndUpdate(
          {
            userId: new mongodb_1.ObjectId(userId),
            'borrowed._id': new mongodb_1.ObjectId(borrowId),
          },
          { $set: { 'borrowed.$.requestId': newCollectRequest._id } }
        )
        yield bookShelfModel_1.default.findOneAndUpdate(
          {
            userId: new mongodb_1.ObjectId(sendTo),
            'lended.requestId': new mongodb_1.ObjectId(requestId),
          },
          { $set: { 'lended.$.requestId': newCollectRequest._id } }
        )
        const chatId = yield chatModel_1.default.findOne({
          participants: {
            $all: [
              new mongodb_1.ObjectId(userId),
              new mongodb_1.ObjectId(sendTo),
            ],
          },
        })
        const newMessage = yield messageModel_1.default.create({
          type: 'request',
          chatId: new mongodb_1.ObjectId(
            chatId === null || chatId === void 0 ? void 0 : chatId._id
          ),
          senderId: new mongodb_1.ObjectId(userId),
          content: new mongodb_1.ObjectId(
            newCollectRequest === null || newCollectRequest === void 0
              ? void 0
              : newCollectRequest._id
          ),
        })
        if (newMessage) {
          yield newMessage.populate('chatId', 'participants senderId')
          yield newMessage.populate('senderId', 'userName profile')
          yield newMessage.populate('content')
          yield newMessage.populate({
            path: 'content',
            populate: {
              path: 'madeBy',
              select: 'userName',
            },
          })
          yield chatModel_1.default.findByIdAndUpdate(chatId, {
            $set: {
              'lastMessage.messageId': new mongodb_1.ObjectId(
                newMessage === null || newMessage === void 0
                  ? void 0
                  : newMessage._id
              ),
              'lastMessage.timeStamp': new Date().getTime(),
            },
          })
          return newMessage
        }
        return null
      } catch (error) {
        console.log(error)
        return null
      }
    })
  }
  collectBook(req) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const { requestId, userId, requestedUser, messageId, chatId } = req.body
        const request = yield requestModel_1.default.findByIdAndUpdate(
          requestId,
          {
            stage: 'transaction complete',
            isPending: false,
          }
        )
        if (request) {
          const session = yield mongoose_1.default.startSession()
          try {
            session.startTransaction()
            const ownerBookShelf =
              yield bookShelfModel_1.default.findOneAndUpdate(
                {
                  'lended.requestId': new mongodb_1.ObjectId(requestId),
                  'shelf._id': new mongodb_1.ObjectId(request.book._id),
                },
                {
                  $set: {
                    'shelf.$.status': 'Available',
                  },
                },
                { session, new: true }
              )
            yield bookShelfModel_1.default.findOneAndUpdate(
              {
                'lended.requestId': new mongodb_1.ObjectId(requestId),
              },
              {
                $set: {
                  'lended.$.isReturned': true,
                },
              },
              { session, new: true }
            )
            const requestedUserShelf =
              yield bookShelfModel_1.default.findOneAndUpdate(
                {
                  userId: new mongodb_1.ObjectId(requestedUser),
                  'borrowed.requestId': new mongodb_1.ObjectId(request._id),
                },
                { $set: { 'borrowed.$.isReturned': true } },
                { session }
              )
            const createdMessages = yield messageModel_1.default.create(
              [
                {
                  type: 'request',
                  chatId: new mongodb_1.ObjectId(chatId),
                  senderId: new mongodb_1.ObjectId(userId),
                  content: new mongodb_1.ObjectId(request._id),
                },
              ],
              { session }
            )
            const newMessage = createdMessages[0]
            if (newMessage) {
              yield newMessage.populate('chatId', 'participants senderId')
              yield newMessage.populate('senderId', 'userName profile')
              yield newMessage.populate('content')
              yield newMessage.populate({
                path: 'content',
                populate: {
                  path: 'madeBy',
                  select: 'userName',
                },
              })
              yield chatModel_1.default.findByIdAndUpdate(
                chatId,
                {
                  $set: {
                    'lastMessage.messageId': new mongodb_1.ObjectId(
                      newMessage._id
                    ),
                    'lastMessage.timeStamp': new Date().getTime(),
                  },
                },
                { session }
              )
            }
            yield session.commitTransaction()
            return newMessage
          } catch (error) {
            console.log(error)
            yield session.abortTransaction()
          } finally {
            yield session.endSession()
          }
        }
        return null
      } catch (error) {
        console.log(error)
        return null
      }
    })
  }
  searchUsers(query, pageNo, user) {
    return __awaiter(this, void 0, void 0, function* () {
      if (!query || pageNo < 1) {
        return null
      }
      try {
        const limit = 10
        const skip = (pageNo - 1) * limit
        const pipeline = [
          {
            $search: {
              index: 'default',
              text: {
                query: query,
                path: ['userName', 'name'],
                fuzzy: {
                  maxEdits: 2,
                  prefixLength: 1,
                },
              },
            },
          },
          {
            $match: {
              _id: { $ne: new mongodb_1.ObjectId(user) },
            },
          },
          {
            $facet: {
              users: [
                { $skip: skip },
                { $limit: limit },
                {
                  $project: {
                    userName: 1,
                    name: 1,
                    profile: 1,
                    _id: 1,
                    isSubscribed: 1,
                  },
                },
              ],
              totalCount: [{ $count: 'count' }],
            },
          },
          {
            $project: {
              users: 1,
              hasMore: {
                $gt: [{ $arrayElemAt: ['$totalCount.count', 0] }, limit + skip],
              },
            },
          },
        ]
        const result = yield userModel_1.default.aggregate(pipeline)
        if (result.length === 0) {
          return { users: [], hasMore: false }
        }
        const { users, hasMore } = result[0]
        return {
          users: users,
          hasMore: hasMore,
        }
      } catch (error) {
        console.log(error)
        return null
      }
    })
  }
  exploreBooks(userId) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const user = yield userModel_1.default.findById(userId, {
          following: 1,
          followers: 1,
        })
        if (user) {
          const followingUserIds = user.following.map((followingUser) =>
            followingUser.userId.toString()
          )
          const followerUserIds = user.followers.map((followerUser) =>
            followerUser.userId.toString()
          )
          const allUserIds = [
            ...new Set([...followingUserIds, ...followerUserIds]),
          ].map((id) => new mongodb_1.ObjectId(id))
          const bookshelf = yield bookShelfModel_1.default.aggregate([
            { $match: { userId: { $in: allUserIds } } },
            { $unwind: '$shelf' },
            {
              $lookup: {
                from: 'users',
                localField: 'userId',
                foreignField: '_id',
                as: 'shelf.userData',
              },
            },
            { $unwind: '$shelf.userData' },
            {
              $project: {
                _id: 1,
                'shelf._id': 1,
                'shelf.author': 1,
                'shelf.bookName': 1,
                'shelf.description': 1,
                'shelf.imageUrl': 1,
                'shelf.limit': 1,
                'shelf.isDeleted': 1,
                'shelf.status': 1,
                'shelf.location': 1,
                'shelf.addedOn': 1,
                'shelf.ID': 1,
                'shelf.isRemoved': 1,
                'shelf.userData': {
                  _id: '$shelf.userData._id',
                  userName: '$shelf.userData.userName',
                  profile: '$shelf.userData.profile',
                },
              },
            },
          ])
          if (bookshelf) {
            return { books: bookshelf, hasMore: false }
          }
        }
        return null
      } catch (error) {
        console.log(error)
        return null
      }
    })
  }
  checkOldPassword(password, userId) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const user = yield userModel_1.default.findById(userId, {
          password: 1,
          email: 1,
          isGoogleSignUp: 1,
        })
        if (user) {
          const isValid = yield bcryptjs_1.default.compare(
            password,
            user.password
          )
          if (isValid) {
            return user
          }
        }
        return null
      } catch (error) {
        console.log(error)
        return null
      }
    })
  }
  changePassWord(password, email) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const hashedPassword = yield bcryptjs_1.default.hash(password, 10)
        const user = yield userModel_1.default.findOneAndUpdate(
          { email: email },
          { $set: { password: hashedPassword } },
          { new: true, projection: { username: 1, _id: 0 } }
        )
        if (user) {
          return user
        }
        return null
      } catch (error) {
        console.log(error)
        return null
      }
    })
  }
  getDeposit(req) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const { userId } = req.query
        const user = yield userModel_1.default.findById(userId, {
          cautionDeposit: 1,
        })
        const deductions = yield deductionModel_1.default.findOne({
          userId: new mongodb_1.ObjectId(userId),
        })
        if (user) {
          return {
            cautionDeposit: user.cautionDeposit,
            recentDeduction: (
              deductions === null || deductions === void 0
                ? void 0
                : deductions.deductions
            )
              ? deductions.deductions
              : [],
          }
        }
        return { cautionDeposit: 0, recentDeduction: [] }
      } catch (error) {
        return { cautionDeposit: 0, recentDeduction: [] }
      }
    })
  }
  updateCautionDeposit(userId, amount) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const user = yield userModel_1.default.findByIdAndUpdate(userId, {
          $inc: { cautionDeposit: amount },
        })
        if (user) {
          return true
        } else {
          return false
        }
      } catch (error) {
        console.log(error)
        return false
      }
    })
  }
  updateBadge() {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const badges = yield badgeModel_1.default
          .find({})
          .sort({ minScore: -1 })
        if (badges.length === 0) {
          console.log('No badges found.')
          return
        }
        const bulkOps = []
        const cursor = lendScoreModel_1.default.find({}).cursor()
        for (
          let lendScore = yield cursor.next();
          lendScore != null;
          lendScore = yield cursor.next()
        ) {
          let qualifiedBadge = null
          for (const badge of badges) {
            if (lendScore.lendScore >= badge.minScore) {
              qualifiedBadge = badge
              break
            }
          }
          if (qualifiedBadge) {
            bulkOps.push({
              updateOne: {
                filter: { _id: lendScore._id },
                update: {
                  $set: { badgeId: new mongodb_1.ObjectId(qualifiedBadge._id) },
                },
              },
            })
          }
        }
        if (bulkOps.length > 0) {
          yield lendScoreModel_1.default.bulkWrite(bulkOps)
          console.log('LendScore documents updated successfully.')
        } else {
          console.log('No LendScore documents need updating.')
        }
      } catch (error) {
        console.log(error)
      }
    })
  }
}
exports.default = UserRepository
