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
const adminModel_1 = __importDefault(require('../databases/adminModel'))
const bcryptjs_1 = __importDefault(require('bcryptjs'))
const redis_1 = require('../config/redis')
const userModel_1 = __importDefault(require('../databases/userModel'))
const postModel_1 = __importDefault(require('../databases/postModel'))
const reportsModel_1 = __importDefault(require('../databases/reportsModel'))
const mongodb_1 = require('mongodb')
const badgeModel_1 = __importDefault(require('../databases/badgeModel'))
const bookShelfModel_1 = __importDefault(require('../databases/bookShelfModel'))
const moment_1 = __importDefault(require('moment'))
const requestModel_1 = __importDefault(require('../databases/requestModel'))
const deductionModel_1 = __importDefault(require('../databases/deductionModel'))
class AdminRepository {
  constructor() {
    this.generateMonthsOfYear = () => {
      const start = (0, moment_1.default)().startOf('year')
      const months = []
      for (let i = 0; i < 12; i++) {
        const month = start.clone().add(i, 'months').format('MMMM YYYY')
        months.push({ month, count: 0 })
      }
      return months
    }
    this.getCurrentMonthRange = () => {
      const start = new Date()
      start.setDate(1)
      start.setHours(0, 0, 0, 0)
      const end = new Date()
      end.setMonth(end.getMonth() + 1)
      end.setDate(0)
      end.setHours(23, 59, 59, 999)
      return { start, end }
    }
  }
  findByEmail(email) {
    return __awaiter(this, void 0, void 0, function* () {
      return adminModel_1.default.findOne({ email })
    })
  }
  loginAdmin(password, hash) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        return bcryptjs_1.default.compare(password, hash)
      } catch (error) {
        console.log(error)
        return false
      }
    })
  }
  fetchUsers(req) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const { fetch, page } = req.query
        const limit = 2
        const skip = (Number(page) - 1) * limit
        let users
        let totalCount
        let totalPages
        switch (fetch) {
          case 'all':
            users = yield userModel_1.default
              .find()
              .select('-password')
              .populate('lendscore', 'lendScore')
              .limit(limit)
              .skip(skip)
            totalCount = yield userModel_1.default.countDocuments()
            totalPages = Math.ceil(totalCount / limit)
            return { users, totalPages }
            break
          case 'Blocked':
            users = yield userModel_1.default
              .find({ isBlocked: true })
              .select('-password')
              .populate('lendscore', 'lendScore')
              .limit(limit)
              .skip(skip)
            totalCount = yield userModel_1.default.countDocuments({
              isBlocked: true,
            })
            totalPages = Math.floor(totalCount / limit)
            return { users, totalPages }
            break
          case 'Blocked':
            users = yield userModel_1.default
              .find({ isDeleted: true })
              .select('-password')
              .populate('lendscore', 'lendScore')
              .limit(limit)
              .skip(skip)
            totalCount = yield userModel_1.default.countDocuments({
              isDeleted: true,
            })
            totalPages = Math.ceil(totalCount / limit)
            return { users, totalPages }
            break
        }
        return null
      } catch (error) {
        console.log(error)
        return { users: [], totalPages: 0 }
      }
    })
  }
  blockUser(req) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const { userId, action } = req.body
        if (action === 'Block') {
          const blocked = yield userModel_1.default.findByIdAndUpdate(
            userId,
            { $set: { isBlocked: true } },
            { new: true }
          )
          yield this.updateRedisBlockedUsers()
          return true
        } else if (action === 'Unblock') {
          const unblocked = yield userModel_1.default.findByIdAndUpdate(
            userId,
            { $set: { isBlocked: false } },
            { new: true }
          )
          yield this.updateRedisBlockedUsers()
          return true
        }
        return false
      } catch (error) {
        console.log(error)
        return false
      }
    })
  }
  updateRedisBlockedUsers() {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const blockedUsers = yield userModel_1.default
          .find({ isBlocked: true })
          .select('_id')
          .lean()
        yield redis_1.redis.set(
          'blockedUsers',
          JSON.stringify(blockedUsers),
          'EX',
          3600
        )
      } catch (error) {
        console.error('Error updating Redis with blocked users:', error)
        throw new Error('Failed to update Redis with blocked users')
      }
    })
  }
  getAllPost(req) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const { fetch, pageNo } = req.query
        const limit = 1
        const skip = (Number(pageNo) - 1) * limit
        let posts
        let totalPage
        let totalCount
        switch (fetch) {
          case 'all':
            let pipeline = [
              {
                $lookup: {
                  from: 'reports',
                  let: { postId: '$_id' },
                  pipeline: [
                    {
                      $match: {
                        $expr: {
                          $eq: ['$targetId', '$$postId'],
                        },
                        status: { $in: ['Pending', 'Reviewed'] },
                        isRemoved: false,
                      },
                    },
                  ],
                  as: 'reports',
                },
              },
              {
                $lookup: {
                  from: 'users',
                  localField: 'userId',
                  foreignField: '_id',
                  pipeline: [
                    {
                      $project: {
                        _id: 0,
                        userName: 1,
                      },
                    },
                  ],
                  as: 'user',
                },
              },
              {
                $unwind: '$user',
              },
              {
                $sort: { createdAt: -1 },
              },
            ]
            posts = yield postModel_1.default
              .aggregate(pipeline)
              .skip(skip)
              .limit(limit)
            totalCount = yield postModel_1.default.countDocuments()
            totalPage = Math.ceil(totalCount / limit)
            return { post: posts, totalPage }
          case 'Reported':
            let pipeline2 = [
              {
                $lookup: {
                  from: 'reports',
                  let: { postId: '$_id' },
                  pipeline: [
                    {
                      $match: {
                        $expr: {
                          $eq: ['$targetId', '$$postId'],
                        },
                        status: { $in: ['Pending', 'Reviewed'] },
                        isRemoved: false,
                      },
                    },
                  ],
                  as: 'reports',
                },
              },
              {
                $lookup: {
                  from: 'users',
                  localField: 'userId',
                  foreignField: '_id',
                  pipeline: [
                    {
                      $project: {
                        _id: 0,
                        userName: 1,
                      },
                    },
                  ],
                  as: 'user',
                },
              },
              {
                $unwind: '$user',
              },
              {
                $match: {
                  'reports.0': { $exists: true },
                },
              },
              {
                $sort: { createdAt: -1 },
              },
              {
                $facet: {
                  metadata: [{ $count: 'totalCount' }],
                  data: [{ $skip: skip }, { $limit: limit }],
                },
              },
            ]
            const result = yield postModel_1.default.aggregate(pipeline2)
            posts = result[0].data
            totalCount =
              result[0].metadata.length > 0
                ? result[0].metadata[0].totalCount
                : 0
            totalPage = Math.ceil(totalCount / limit)
            return { post: posts, totalPage }
          case 'Deleted':
            let pipeline3 = [
              { $match: { isDeleted: true } },
              {
                $lookup: {
                  from: 'reports',
                  let: { postId: '$_id' },
                  pipeline: [
                    {
                      $match: {
                        $expr: {
                          $eq: ['$targetId', '$$postId'],
                        },
                        status: { $in: ['Pending', 'Reviewed'] },
                        isRemoved: false,
                      },
                    },
                  ],
                  as: 'reports',
                },
              },
              {
                $lookup: {
                  from: 'users',
                  localField: 'userId',
                  foreignField: '_id',
                  pipeline: [
                    {
                      $project: {
                        _id: 0,
                        userName: 1,
                      },
                    },
                  ],
                  as: 'user',
                },
              },
              {
                $unwind: '$user',
              },
              {
                $sort: { createdAt: -1 },
              },
            ]
            posts = yield postModel_1.default
              .aggregate(pipeline3)
              .skip(skip)
              .limit(limit)
            totalCount = yield postModel_1.default.countDocuments({
              isDeleted: true,
            })
            totalPage = Math.ceil(totalCount / limit)
            return { post: posts, totalPage }
          case 'Removed':
            let pipeline4 = [
              { $match: { isRemoved: true } },
              {
                $lookup: {
                  from: 'reports',
                  let: { postId: '$_id' },
                  pipeline: [
                    {
                      $match: {
                        $expr: {
                          $eq: ['$targetId', '$$postId'],
                        },
                        status: { $in: ['Pending', 'Reviewed'] },
                        isRemoved: false,
                      },
                    },
                  ],
                  as: 'reports',
                },
              },
              {
                $lookup: {
                  from: 'users',
                  localField: 'userId',
                  foreignField: '_id',
                  pipeline: [
                    {
                      $project: {
                        _id: 0,
                        userName: 1,
                      },
                    },
                  ],
                  as: 'user',
                },
              },
              {
                $unwind: '$user',
              },
              {
                $sort: { createdAt: -1 },
              },
            ]
            posts = yield postModel_1.default
              .aggregate(pipeline4)
              .skip(skip)
              .limit(limit)
            totalCount = yield postModel_1.default.countDocuments({
              isRemoved: true,
            })
            totalPage = Math.ceil(totalCount / limit)
            return { post: posts, totalPage }
        }
        return null
      } catch (error) {
        console.log(error)
        return null
      }
    })
  }
  getPostReports(req) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const targetId = req.query.targetId
        const pageNo = req.query.pageNo
        const limit = 5
        const skip = (Number(pageNo) - 1) * limit
        const reports = yield reportsModel_1.default
          .find({
            targetId: new mongodb_1.ObjectId(targetId),
            isRemoved: false,
          })
          .populate('reportedBy', 'userName email')
          .limit(limit)
          .skip(skip)
          .sort({ reportedOn: -1 })
        const totalCount = yield reportsModel_1.default.countDocuments({
          targetId: new mongodb_1.ObjectId(targetId),
          isRemoved: false,
        })
        const totalPage = Math.ceil(totalCount / limit)
        if (reports) {
          return {
            reports: reports,
            hasMore: totalPage == Number(pageNo) ? false : true,
          }
        }
        return null
      } catch (error) {
        console.log(error)
        return null
      }
    })
  }
  removeReport(req) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const { rId } = req.body
        const removeReport = yield reportsModel_1.default.findByIdAndUpdate(
          rId,
          {
            $set: { isRemoved: true, status: 'Removed' },
          },
          { new: true }
        )
        if (removeReport) {
          if (removeReport.targetType == 'Borrowed') {
            yield bookShelfModel_1.default.findOneAndUpdate(
              {
                'borrowed._id': new mongodb_1.ObjectId(removeReport.targetId),
              },
              {
                $pull: {
                  'borrowed.$.reportsMade': removeReport._id,
                },
              }
            )
            const result = yield bookShelfModel_1.default.findOne(
              {
                'borrowed._id': new mongodb_1.ObjectId(removeReport.targetId),
              },
              {
                'borrowed.$': 1,
              }
            )
            if (result && result.borrowed && result.borrowed.length > 0) {
              const borrowedItem = result.borrowed[0].from
              const user = yield userModel_1.default.findOneAndUpdate(
                {
                  _id: new mongodb_1.ObjectId(borrowedItem.toString()),
                },
                { $pull: { reportCount: removeReport._id } },
                { new: true }
              )
              if (user) {
                return true
              }
            }
          }
          if (removeReport.targetType === 'Lended') {
            yield bookShelfModel_1.default.findOneAndUpdate(
              {
                'lended._id': new mongodb_1.ObjectId(removeReport.targetId),
              },
              {
                $pull: {
                  'lended.$.reportsMade': removeReport._id,
                },
              }
            )
            const result = yield bookShelfModel_1.default.findOne(
              {
                'lended._id': new mongodb_1.ObjectId(removeReport.targetId),
              },
              {
                'lended.$': 1,
              }
            )
            if (result && result.lended && result.lended.length > 0) {
              const lendedItem = result.lended[0].lendedTo
              const user = yield userModel_1.default.findOneAndUpdate(
                {
                  _id: new mongodb_1.ObjectId(lendedItem.toString()),
                },
                { $pull: { reportCount: removeReport._id } },
                { new: true }
              )
              if (user) {
                return true
              }
            }
          }
          if (
            (removeReport === null || removeReport === void 0
              ? void 0
              : removeReport.targetType) == 'Post'
          ) {
            yield removeReport.populate('targetId', 'userId')
          }
          if (removeReport.targetType == 'Post') {
            const { userId } = removeReport.targetId
            const user = yield userModel_1.default.findOneAndUpdate(
              {
                _id: new mongodb_1.ObjectId(userId),
              },
              { $pull: { reportCount: removeReport._id } },
              { new: true }
            )
            if (user) {
              return true
            }
          }
        }
        return false
      } catch (error) {
        console.log(error)
        return false
      }
    })
  }
  findBadgeByName(badge) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const isAvail = yield badgeModel_1.default.findOne({ name: badge })
        if (isAvail) return true
        else return false
      } catch (error) {
        console.log(error)
        return false
      }
    })
  }
  createBadge(req, doc) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const { badgeName, minScore, borrowLimit } = req.body
        const badge = yield badgeModel_1.default.create({
          name: badgeName,
          minScore: Number(minScore),
          iconUrl: {
            publicId: doc.public_id,
            secureUrl: doc.secure_url,
          },
          limit: Number(borrowLimit),
        })
        if (badge) {
          return badge
        }
        return false
      } catch (error) {
        console.log(error)
        return false
      }
    })
  }
  //get
  getSingleBadge(badgeId) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const badge = yield badgeModel_1.default.findById(badgeId)
        if (badge) {
          return badge
        }
        return null
      } catch (error) {
        console.log(error)
        return null
      }
    })
  }
  editBadge(req) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const badgeId = req.query.badgeId
        const { badgeName, minScore, borrowLimit } = req.body
        if (!badgeName || !minScore || !borrowLimit || !badgeId) return null
        const badge = yield badgeModel_1.default.findByIdAndUpdate(badgeId, {
          $set: {
            badgeName: badgeName,
            minScore: Number(minScore),
            limit: Number(borrowLimit),
          },
        })
        if (badge) {
          return badge
        } else {
          return null
        }
      } catch (error) {
        console.log(error)
        return null
      }
    })
  }
  getBadge() {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const badges = yield badgeModel_1.default.find()
        if (badges) {
          return badges
        }
        return null
      } catch (error) {
        console.log(error)
        return null
      }
    })
  }
  getLendedTransactions(req) {
    return __awaiter(this, void 0, void 0, function* () {
      const { pageNo, filter } = req.query
      try {
        const limit = 10
        const startIndex = (Number(pageNo) - 1) * limit
        const totalDocuments = yield bookShelfModel_1.default.aggregate([
          { $unwind: '$borrowed' },
          { $count: 'totalDocuments' },
        ])
        const totalCount =
          totalDocuments.length > 0 ? totalDocuments[0].totalDocuments : 0
        const result = yield bookShelfModel_1.default.aggregate([
          {
            $lookup: {
              from: 'users',
              localField: 'userId',
              foreignField: '_id',
              as: 'userDetails',
            },
          },
          { $unwind: '$userDetails' },
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
            $addFields: {
              'lended.userName': '$userDetails.userName',
              'lended.profile': '$userDetails.profile',
              'lended.userId': '$userDetails._id',
            },
          },
          {
            $project: {
              _id: 0,
              lended: {
                _id: 1,
                userName: 1,
                profile: 1,
                userId: 1,
                'lUser.userName': 1,
                'lUser.profile': 1,
                'lUser._id': 1,
                requestId: 1,
                earnedScore: 1,
                isReturned: 1,
                remainingDays: 1,
                keepingTime: 1,
                requestDetails: 1,
                lendedOn: 1,
              },
            },
          },
          { $skip: startIndex },
          { $limit: limit },
          {
            $group: {
              _id: null,
              lended: { $push: '$lended' },
            },
          },
          {
            $project: {
              _id: 0,
              lended: 1,
            },
          },
        ])
        return {
          lended: result.length > 0 ? result[0].lended : [],
          hasMore:
            Math.ceil(totalCount / limit) == Number(pageNo) ? false : true,
        }
      } catch (error) {
        console.log(error)
        return null
      }
    })
  }
  getBorrowedTransactions(req) {
    return __awaiter(this, void 0, void 0, function* () {
      const { pageNo, filter } = req.query
      try {
        const limit = 10
        const startIndex = (Number(pageNo) - 1) * limit
        const totalDocuments = yield bookShelfModel_1.default.aggregate([
          { $unwind: '$lended' },
          { $count: 'totalDocuments' },
        ])
        const totalCount =
          totalDocuments.length > 0 ? totalDocuments[0].totalDocuments : 0
        const result = yield bookShelfModel_1.default.aggregate([
          {
            $lookup: {
              from: 'users',
              localField: 'userId',
              foreignField: '_id',
              as: 'userDetails',
            },
          },
          { $unwind: '$userDetails' },
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
            $addFields: {
              'borrowed.userName': '$userDetails.userName',
              'borrowed.profile': '$userDetails.profile',
              'borrowed.userId': '$userDetails._id',
            },
          },
          {
            $project: {
              _id: 0,
              borrowed: {
                _id: 1,
                userName: 1,
                profile: 1,
                userId: 1,
                'lUser.userName': 1,
                'lUser.profile': 1,
                'lUser._id': 1,
                requestId: 1,
                isReturned: 1,
                remainingDays: 1,
                keepingTime: 1,
                requestDetails: 1,
                borrowedOn: 1,
              },
            },
          },
          { $skip: startIndex },
          { $limit: limit },
          {
            $group: {
              _id: null,
              borrowed: { $push: '$borrowed' },
            },
          },
          {
            $project: {
              _id: 0,
              borrowed: 1,
            },
          },
        ])
        return {
          borrowed: result.length > 0 ? result[0].borrowed : [],
          hasMore:
            Math.ceil(totalCount / limit) == Number(pageNo) ? false : true,
        }
      } catch (error) {
        console.log(error)
        return null
      }
    })
  }
  getSingleUser(req) {
    return __awaiter(this, void 0, void 0, function* () {
      var _a
      try {
        const userId = req.query.userId
        const user = yield userModel_1.default.aggregate([
          {
            $match: {
              _id: new mongodb_1.ObjectId(
                userId === null || userId === void 0
                  ? void 0
                  : userId.toString()
              ),
            },
          },
          {
            $lookup: {
              from: 'lendscores',
              let: { lendscoreId: '$lendscore' },
              pipeline: [
                { $match: { $expr: { $eq: ['$_id', '$$lendscoreId'] } } },
              ],
              as: 'lendscoreDetails',
            },
          },
          {
            $unwind: {
              path: '$lendscoreDetails',
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $lookup: {
              from: 'badges',
              let: { badgeId: '$lendscoreDetails.badgeId' },
              pipeline: [{ $match: { $expr: { $eq: ['$_id', '$$badgeId'] } } }],
              as: 'badgeDetails',
            },
          },
          {
            $unwind: {
              path: '$badgeDetails',
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $addFields: {
              numFollowers: { $size: '$followers' },
              numFollowing: { $size: '$following' },
              numReports: { $size: '$reportCount' },
            },
          },
          {
            $project: {
              _id: 1,
              userName: 1,
              isSubscribed: 1,
              isBlocked: 1,
              privacy: 1,
              name: 1,
              profile: 1,
              numFollowers: 1,
              numFollowing: 1,
              numReports: 1,
              lendscoreDetails: 1,
              badgeDetails: 1,
            },
          },
        ])
        const books = yield bookShelfModel_1.default.aggregate([
          {
            $match: {
              userId: new mongodb_1.ObjectId(
                userId === null || userId === void 0
                  ? void 0
                  : userId.toString()
              ),
            },
          },
          {
            $addFields: {
              postLength: { $size: '$shelf' },
            },
          },
          {
            $project: {
              postLength: 1,
            },
          },
        ])
        const obj = {
          user: user[0],
          postLength: yield postModel_1.default.countDocuments({
            userId: new mongodb_1.ObjectId(
              userId === null || userId === void 0 ? void 0 : userId.toString()
            ),
          }),
          books:
            ((_a = books[0]) === null || _a === void 0
              ? void 0
              : _a.postLength) || 0,
        }
        return obj
      } catch (error) {
        console.log(error)
        return null
      }
    })
  }
  getReportedPost(req) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const { pageNo, userId } = req.query
        const limit = 1
        const skip = (Number(pageNo) - 1) * limit
        const reportedPost = yield userModel_1.default.aggregate([
          {
            $match: {
              _id: new mongodb_1.ObjectId(
                userId === null || userId === void 0
                  ? void 0
                  : userId.toString()
              ),
            },
          },
          {
            $lookup: {
              from: 'reports',
              let: { reportIds: '$reportCount' },
              pipeline: [
                { $match: { $expr: { $in: ['$_id', '$$reportIds'] } } },
                {
                  $match: {
                    targetType: 'Post',
                    isRemoved: false,
                    status: { $ne: 'Resolved' },
                  },
                },
              ],
              as: 'reportDetails',
            },
          },
          {
            $unwind: {
              path: '$reportDetails',
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $project: {
              _id: 0,
              targetId: '$reportDetails.targetId',
            },
          },
        ])
        const targetIds = reportedPost.map((report) => report.targetId)
        if (targetIds.length > 0) {
          const posts = yield postModel_1.default
            .find(
              { _id: { $in: targetIds } },
              {
                imageUrls: 1,
                _id: 1,
                userId: 1,
                description: 1,
                isAddedToBookShelf: 1,
                ID: 1,
                reportCount: 1,
              }
            )
            .skip(skip)
            .limit(limit)
          const totalCount = yield postModel_1.default.countDocuments({
            _id: { $in: targetIds },
          })
          const typedPosts = posts
          if (typedPosts.length > 0)
            return {
              post: typedPosts,
              hasMore:
                Math.ceil(totalCount / limit) == Number(pageNo) ? false : true,
            }
          else return null
        } else {
          return null
        }
      } catch (error) {
        console.log(error)
        return null
      }
    })
  }
  getUserStatistics() {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const userStats = yield userModel_1.default.aggregate([
          {
            $facet: {
              totalUsers: [{ $count: 'count' }],
              verifiedUsers: [
                { $match: { isSubscribed: true, cautionDeposit: { $gt: 0 } } },
                { $count: 'count' },
              ],
              blockedUsers: [
                { $match: { isBlocked: true } },
                { $count: 'count' },
              ],
              newUsers: [
                {
                  $match: {
                    createdAt: {
                      $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                    },
                  },
                },
                { $count: 'count' },
              ],
              reportedUsers: [
                {
                  $match: {
                    $expr: { $gt: [{ $size: '$reportCount' }, 0] },
                  },
                },
                { $count: 'count' },
              ],
            },
          },
        ])
        const formatCount = (arr) => (arr.length > 0 ? arr[0].count : 0)
        return {
          totalUsers: formatCount(userStats[0].totalUsers),
          verified: formatCount(userStats[0].verifiedUsers),
          blockedUsers: formatCount(userStats[0].blockedUsers),
          newUsers: formatCount(userStats[0].newUsers),
          reportedUser: formatCount(userStats[0].reportedUsers),
        }
      } catch (error) {
        console.log(error)
        return {
          totalUsers: 0,
          blockedUsers: 0,
          verified: 0,
          newUsers: 0,
          reportedUser: 0,
        }
      }
    })
  }
  getPeriodUserStatistics(req) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const query = req.query.filter
        if (query == 'days') {
          const { start, end } = this.getCurrentMonthRange()
          const usersPerDay = yield userModel_1.default.aggregate([
            {
              $match: {
                createdAt: { $gte: start, $lte: end },
              },
            },
            {
              $project: {
                day: {
                  $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
                },
              },
            },
            {
              $group: {
                _id: '$day',
                count: { $sum: 1 },
              },
            },
            {
              $sort: { _id: 1 },
            },
          ])
          const result = []
          let currentDate = new Date(start)
          while (currentDate <= end) {
            const dateStr = currentDate.toISOString().split('T')[0]
            const existingDay = usersPerDay.find((day) => day._id === dateStr)
            result.push({
              date: dateStr,
              users: existingDay ? existingDay.count : 0,
            })
            currentDate.setDate(currentDate.getDate() + 1)
          }
          return result
        } else if (query == 'months') {
          let stats = []
          const allMonths = this.generateMonthsOfYear()
          const aggregatedData = yield userModel_1.default.aggregate([
            {
              $match: {
                createdAt: {
                  $gte: (0, moment_1.default)().startOf('year').toDate(),
                  $lte: (0, moment_1.default)().endOf('year').toDate(),
                },
              },
            },
            {
              $group: {
                _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
                totalUsers: { $sum: 1 },
              },
            },
          ])
          stats = allMonths.map((month) => {
            const monthKey = (0, moment_1.default)(
              month.month,
              'MMMM YYYY'
            ).format('YYYY-MM')
            const data = aggregatedData.find((d) => d._id === monthKey)
            return {
              month: month.month,
              users: data ? data.totalUsers : 0,
            }
          })
          return stats
        } else if (query == 'years') {
          const currentYear = new Date().getFullYear()
          const startYear = currentYear - 10
          const usersPerYear = yield userModel_1.default.aggregate([
            {
              $match: {
                createdAt: {
                  $gte: new Date(startYear, 0, 1),
                  $lte: new Date(currentYear + 1, 0, 0),
                },
              },
            },
            {
              $project: {
                year: { $year: '$createdAt' },
              },
            },
            {
              $group: {
                _id: '$year',
                count: { $sum: 1 },
              },
            },
            {
              $sort: { _id: 1 },
            },
          ])
          const result = []
          for (let year = startYear; year <= currentYear; year++) {
            const existingYear = usersPerYear.find((y) => y._id === year)
            result.push({
              year,
              users: existingYear ? existingYear.count : 0,
            })
          }
          return result
        }
        return {}
      } catch (error) {
        console.log(error)
        return {}
      }
    })
  }
  getHighLendscoreUser(req) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const pageNo = parseInt(req.query.pageNo)
        const limit = 1
        const topUsers = yield userModel_1.default
          .aggregate([
            {
              $match: {
                lendscore: { $ne: null },
              },
            },
            {
              $lookup: {
                from: 'lendscores',
                localField: 'lendscore',
                foreignField: '_id',
                as: 'lendscoreDetails',
              },
            },
            {
              $unwind: {
                path: '$lendscoreDetails',
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $lookup: {
                from: 'badges',
                localField: 'lendscoreDetails.badgeId',
                foreignField: '_id',
                as: 'badgeDetails',
              },
            },
            {
              $unwind: {
                path: '$badgeDetails',
                preserveNullAndEmptyArrays: true,
              },
            },
            { $sort: { 'lendscoreDetails.badgeScore': -1 } },
            { $skip: (pageNo - 1) * limit },
            { $limit: limit },
            {
              $project: {
                userName: 1,
                name: 1,
                email: 1,
                profile: 1,
                lendscoreDetails: 1,
                badgeDetails: 1,
              },
            },
          ])
          .exec()
        const totalCount = yield userModel_1.default.countDocuments({
          lendscore: { $ne: null },
        })
        if (topUsers) {
          return {
            users: topUsers,
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
  getPostStatistics() {
    return __awaiter(this, void 0, void 0, function* () {
      var _a, _b, _c, _d
      try {
        const results = yield postModel_1.default.aggregate([
          {
            $facet: {
              totalPost: [{ $count: 'count' }],
              removedPost: [
                { $match: { isRemoved: true } },
                { $count: 'count' },
              ],
              reportedPost: [
                { $match: { reportCount: { $gt: { $size: 0 } } } },
                { $count: 'count' },
              ],
              postAddedToBookshelf: [
                { $match: { isAddedToBookShelf: { $ne: null } } },
                { $count: 'count' },
              ],
            },
          },
          {
            $project: {
              totalPost: { $arrayElemAt: ['$totalPost.count', 0] },
              removedPost: { $arrayElemAt: ['$removedPost.count', 0] },
              reportedPost: { $arrayElemAt: ['$reportedPost.count', 0] },
              postAddedToBookshelf: {
                $arrayElemAt: ['$postAddedToBookshelf.count', 0],
              },
            },
          },
        ])
        const stats = {
          totalPost:
            ((_a = results[0]) === null || _a === void 0
              ? void 0
              : _a.totalPost) || 0,
          removedPost:
            ((_b = results[0]) === null || _b === void 0
              ? void 0
              : _b.removedPost) || 0,
          reportedPost:
            ((_c = results[0]) === null || _c === void 0
              ? void 0
              : _c.reportedPost) || 0,
          postAddedToBookshelf:
            ((_d = results[0]) === null || _d === void 0
              ? void 0
              : _d.postAddedToBookshelf) || 0,
        }
        return stats
      } catch (error) {
        console.log(error)
        return {
          totalPost: 0,
          removedPost: 0,
          reportedPost: 0,
          postAddedToBookshelf: 0,
        }
      }
    })
  }
  getPeriodPostStatistics(req) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const filter = req.query.filter
        if (filter == 'days') {
          const { start, end } = this.getCurrentMonthRange()
          const postsPerDay = yield postModel_1.default.aggregate([
            {
              $match: {
                createdAt: { $gte: start, $lte: end },
              },
            },
            {
              $project: {
                day: {
                  $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
                },
              },
            },
            {
              $group: {
                _id: '$day',
                count: { $sum: 1 },
              },
            },
            {
              $sort: { _id: 1 },
            },
          ])
          const result = []
          let currentDate = new Date(start)
          while (currentDate <= end) {
            const dateStr = currentDate.toISOString().split('T')[0]
            const existingDay = postsPerDay.find((day) => day._id === dateStr)
            result.push({
              date: dateStr,
              posts: existingDay ? existingDay.count : 0,
            })
            currentDate.setDate(currentDate.getDate() + 1)
          }
          return result
        } else if (filter == 'months') {
          let stats = []
          const allMonths = this.generateMonthsOfYear()
          const aggregatedData = yield postModel_1.default.aggregate([
            {
              $match: {
                createdAt: {
                  $gte: (0, moment_1.default)().startOf('year').toDate(),
                  $lte: (0, moment_1.default)().endOf('year').toDate(),
                },
              },
            },
            {
              $group: {
                _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
                totalPosts: { $sum: 1 },
              },
            },
          ])
          stats = allMonths.map((month) => {
            const monthKey = (0, moment_1.default)(
              month.month,
              'MMMM YYYY'
            ).format('YYYY-MM')
            const data = aggregatedData.find((d) => d._id === monthKey)
            return {
              month: month.month,
              posts: data ? data.totalPosts : 0,
            }
          })
          return stats
        } else if (filter == 'years') {
          const currentYear = new Date().getFullYear()
          const startYear = currentYear - 10
          const postsPerYear = yield postModel_1.default.aggregate([
            {
              $match: {
                createdAt: {
                  $gte: new Date(startYear, 0, 1),
                  $lte: new Date(currentYear + 1, 0, 0),
                },
              },
            },
            {
              $project: {
                year: { $year: '$createdAt' },
              },
            },
            {
              $group: {
                _id: '$year',
                count: { $sum: 1 },
              },
            },
            {
              $sort: { _id: 1 },
            },
          ])
          const result = []
          for (let year = startYear; year <= currentYear; year++) {
            const existingYear = postsPerYear.find((y) => y._id === year)
            result.push({
              year,
              posts: existingYear ? existingYear.count : 0,
            })
          }
          return result
        }
        return {}
      } catch (error) {
        console.log(error)
        return {}
      }
    })
  }
  getHighBoostedPost(req) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const limit = 20
        const highBoostedPosts = yield postModel_1.default.aggregate([
          {
            $match: {
              isRemoved: false,
              isDeleted: false,
            },
          },
          {
            $addFields: {
              totalEngagement: {
                $add: [{ $size: '$likes' }, { $size: '$comments' }],
              },
            },
          },
          {
            $sort: { totalEngagement: -1 },
          },
          {
            $limit: limit,
          },
          {
            $project: {
              imageUrls: 1,
              description: 1,
              isAddedToBookShelf: 1,
              totalEngagement: 1,
              likesCount: { $size: '$likes' },
              commentsCount: { $size: '$comments' },
              ID: 1,
            },
          },
        ])
        return { post: highBoostedPosts, hasMore: false }
      } catch (error) {
        console.log(error)
        return null
      }
    })
  }
  getPost(postId) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const post = yield postModel_1.default.findById(postId)
        if (post) {
          yield post.populate('userId', 'userName profile name')
          yield post.populate('comments.author', 'userName profile name')
          yield post.populate(
            'comments.replies.author',
            'userName profile name'
          )
          return post
        }
        return null
      } catch (error) {
        console.log(error)
        return null
      }
    })
  }
  banPost(posId) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        console.log(posId)
        if (!posId) {
          return null
        }
        console.log(posId)
        const post = yield postModel_1.default.findByIdAndUpdate(posId, {
          $set: { isRemoved: true },
        })
        if (post) {
          yield post.populate('userId', 'email')
          return post
        }
        return null
      } catch (error) {
        console.log(error)
        return null
      }
    })
  }
  getTransactionStatistics() {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const result = yield bookShelfModel_1.default.aggregate([
          {
            $match: {
              $or: [
                { lended: { $exists: true, $not: { $size: 0 } } },
                { borrowed: { $exists: true, $not: { $size: 0 } } },
              ],
            },
          },
          { $unwind: { path: '$lended', preserveNullAndEmptyArrays: true } },
          { $unwind: { path: '$borrowed', preserveNullAndEmptyArrays: true } },
          {
            $group: {
              _id: null,
              totalLended: {
                $sum: { $cond: [{ $ifNull: ['$lended._id', false] }, 1, 0] },
              },
              completedLended: {
                $sum: {
                  $cond: [{ $ifNull: ['$lended.isReturned', false] }, 1, 0],
                },
              },
              reportedLended: {
                $sum: {
                  $cond: [
                    {
                      $gt: [
                        { $size: { $ifNull: ['$lended.reportsMade', []] } },
                        0,
                      ],
                    },
                    1,
                    0,
                  ],
                },
              },
              totalBorrowed: {
                $sum: { $cond: [{ $ifNull: ['$borrowed._id', false] }, 1, 0] },
              },
              completedBorrowed: {
                $sum: {
                  $cond: [{ $ifNull: ['$borrowed.isReturned', false] }, 1, 0],
                },
              },
              reportedBorrowed: {
                $sum: {
                  $cond: [
                    {
                      $gt: [
                        { $size: { $ifNull: ['$borrowed.reportsMade', []] } },
                        0,
                      ],
                    },
                    1,
                    0,
                  ],
                },
              },
            },
          },
          {
            $project: {
              _id: 0,
              totalTransactions: { $add: ['$totalLended', '$totalBorrowed'] },
              completedTransactions: {
                $add: ['$completedLended', '$completedBorrowed'],
              },
              reportedTransactions: {
                $add: ['$reportedLended', '$reportedBorrowed'],
              },
            },
          },
        ])
        return (
          result[0] || {
            totalTransactions: 0,
            completedTransactions: 0,
            reportedTransactions: 0,
          }
        )
      } catch (error) {
        console.log(error)
        return {
          totalTransactions: 0,
          completedTransactions: 0,
          reportedTransactions: 0,
        }
      }
    })
  }
  getPeriodTransactionStatistics(req) {
    return __awaiter(this, void 0, void 0, function* () {
      const filter = req.query.filter
      function getCurrentYearRange() {
        const now = new Date()
        const start = new Date(Date.UTC(now.getFullYear(), 0, 1))
        const end = new Date(Date.UTC(now.getFullYear() + 1, 0, 1))
        end.setUTCHours(23, 59, 59, 999)
        return { start, end }
      }
      function getCurrentMonthRange() {
        const now = new Date()
        const start = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1))
        const end = new Date(Date.UTC(now.getFullYear(), now.getMonth() + 1, 0))
        end.setUTCHours(23, 59, 59, 999)
        return { start, end }
      }
      if (filter === 'days') {
        const { start, end } = getCurrentMonthRange()
        const pipeline = [
          { $unwind: '$lended' },
          {
            $match: {
              'lended.lendedOn': {
                $gte: new Date(start),
                $lt: new Date(end),
              },
            },
          },
          {
            $group: {
              _id: { $dayOfMonth: '$lended.lendedOn' },
              count: { $sum: 1 },
            },
          },
          {
            $sort: { _id: 1 },
          },
          {
            $project: {
              _id: 1,
              day: '$_id',
              count: 1,
            },
          },
        ]
        const transactionsPerDay =
          yield bookShelfModel_1.default.aggregate(pipeline)
        const result = []
        let currentDate = new Date(start)
        while (currentDate < end) {
          const dayOfMonth = currentDate.getDate()
          const existingDay = transactionsPerDay.find(
            (day) => day._id === dayOfMonth
          )
          result.push({
            date: currentDate.toISOString().split('T')[0],
            transactions: existingDay ? existingDay.count : 0,
          })
          currentDate.setDate(currentDate.getDate() + 1)
        }
        return { transactions: result }
      }
      if (filter === 'months') {
        const { start, end } = getCurrentYearRange()
        const pipeline = [
          { $unwind: '$lended' },
          {
            $match: {
              'lended.lendedOn': {
                $gte: new Date(start),
                $lt: new Date(end),
              },
            },
          },
          {
            $group: {
              _id: { $month: '$lended.lendedOn' },
              count: { $sum: 1 },
            },
          },
          {
            $sort: { _id: 1 },
          },
          {
            $project: {
              _id: 1,
              month: '$_id',
              count: 1,
            },
          },
        ]
        const transactionsPerMonth =
          yield bookShelfModel_1.default.aggregate(pipeline)
        const result = []
        for (let month = 1; month <= 12; month++) {
          const existingMonth = transactionsPerMonth.find(
            (m) => m._id === month
          )
          result.push({
            month: month,
            transactions: existingMonth ? existingMonth.count : 0,
          })
        }
        return { transactions: result }
      }
      if (filter === 'years') {
        const startYear = new Date().getFullYear() - 5
        const start = new Date(Date.UTC(startYear, 0, 1))
        const end = new Date(Date.UTC(new Date().getFullYear() + 1, 0, 1))
        end.setUTCHours(23, 59, 59, 999)
        const pipeline = [
          { $unwind: '$lended' },
          {
            $match: {
              'lended.lendedOn': {
                $gte: new Date(start),
                $lt: new Date(end),
              },
            },
          },
          {
            $group: {
              _id: { $year: '$lended.lendedOn' },
              count: { $sum: 1 },
            },
          },
          {
            $sort: { _id: 1 },
          },
          {
            $project: {
              _id: 1,
              year: '$_id',
              count: 1,
            },
          },
        ]
        const transactionsPerYear =
          yield bookShelfModel_1.default.aggregate(pipeline)
        const result = []
        let currentYear = startYear
        while (currentYear <= new Date().getFullYear()) {
          const existingYear = transactionsPerYear.find(
            (y) => y._id === currentYear
          )
          result.push({
            year: currentYear,
            transactions: existingYear ? existingYear.count : 0,
          })
          currentYear++
        }
        return { transactions: result }
      }
      return {}
    })
  }
  getPeriodRequestStatistics(req) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        function getCurrentYearRange() {
          const now = new Date()
          const start = new Date(Date.UTC(now.getFullYear(), 0, 1))
          const end = new Date(Date.UTC(now.getFullYear(), 11, 31))
          end.setUTCHours(23, 59, 59, 999)
          return { start, end }
        }
        function getPastTenYearsRange() {
          const now = new Date()
          const start = new Date(Date.UTC(now.getFullYear() - 10, 0, 1))
          const end = new Date(Date.UTC(now.getFullYear(), 11, 31))
          end.setUTCHours(23, 59, 59, 999)
          return { start, end }
        }
        function getCurrentMonthRange() {
          const now = new Date()
          const start = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1))
          const end = new Date(
            Date.UTC(now.getFullYear(), now.getMonth() + 1, 0)
          )
          end.setUTCHours(23, 59, 59, 999)
          return { start, end }
        }
        const filter = req.query.filter
        console.log(filter)
        let pipeline = []
        let finalResults = []
        let result = []
        let currentDate
        if (filter == 'days') {
          const { start, end } = getCurrentMonthRange()
          pipeline = [
            { $match: { requestedOn: { $gte: start, $lt: end } } },
            {
              $group: {
                _id: {
                  day: { $dayOfMonth: '$requestedOn' },
                  stage: '$stage',
                },
                count: { $sum: 1 },
              },
            },
            { $sort: { '_id.day': 1, '_id.stage': 1 } },
            {
              $group: {
                _id: '$_id.day',
                stages: {
                  $push: {
                    stage: '$_id.stage',
                    count: '$count',
                  },
                },
              },
            },
          ]
          const results = yield requestModel_1.default.aggregate(pipeline)
          finalResults = results.map((result) => {
            const stages = result.stages.reduce(
              (acc, { stage, count }) => {
                acc[stage] = count
                return acc
              },
              { requested: 0, expired: 0, approved: 0, transactionComplete: 0 }
            )
            return {
              day: result._id,
              stages,
            }
          })
          currentDate = new Date(start)
          while (currentDate < end) {
            const dayOfMonth = currentDate.getDate()
            const existingDay = finalResults.find(
              (day) => day.day === dayOfMonth
            )
            result.push({
              date: currentDate.toISOString().split('T')[0],
              requested: existingDay ? existingDay.stages.requested || 0 : 0,
              expired: existingDay ? existingDay.stages.expired || 0 : 0,
              approved: existingDay ? existingDay.stages.approved || 0 : 0,
              transactionComplete: existingDay
                ? existingDay.stages['transaction complete'] || 0
                : 0,
            })
            currentDate.setDate(currentDate.getDate() + 1)
          }
        } else if (filter == 'months') {
          const { start, end } = getCurrentYearRange()
          pipeline = [
            { $match: { requestedOn: { $gte: start, $lt: end } } },
            {
              $group: {
                _id: {
                  month: { $month: '$requestedOn' },
                  stage: '$stage',
                },
                count: { $sum: 1 },
              },
            },
            { $sort: { '_id.month': 1, '_id.stage': 1 } },
            {
              $group: {
                _id: '$_id.month',
                stages: {
                  $push: {
                    stage: '$_id.stage',
                    count: '$count',
                  },
                },
              },
            },
          ]
          const results = yield requestModel_1.default.aggregate(pipeline)
          finalResults = results.map((result) => {
            const stages = result.stages.reduce(
              (acc, { stage, count }) => {
                acc[stage] = count
                return acc
              },
              { requested: 0, expired: 0, approved: 0, transactionComplete: 0 }
            )
            return {
              month: result._id,
              stages,
            }
          })
          currentDate = new Date(start)
          while (currentDate <= end) {
            const monthOfYear = currentDate.getMonth() + 1
            const existingMonth = finalResults.find(
              (month) => month.month === monthOfYear
            )
            result.push({
              month: currentDate.toLocaleString('default', {
                month: 'long',
                year: 'numeric',
              }),
              requested: existingMonth
                ? existingMonth.stages.requested || 0
                : 0,
              expired: existingMonth ? existingMonth.stages.expired || 0 : 0,
              approved: existingMonth ? existingMonth.stages.approved || 0 : 0,
              transactionComplete: existingMonth
                ? existingMonth.stages['transaction complete'] || 0
                : 0,
            })
            currentDate.setMonth(currentDate.getMonth() + 1)
          }
        } else if (filter == 'years') {
          const { start, end } = getPastTenYearsRange()
          pipeline = [
            { $match: { requestedOn: { $gte: start, $lt: end } } },
            {
              $group: {
                _id: {
                  year: { $year: '$requestedOn' },
                  stage: '$stage',
                },
                count: { $sum: 1 },
              },
            },
            { $sort: { '_id.year': 1, '_id.stage': 1 } },
            {
              $group: {
                _id: '$_id.year',
                stages: {
                  $push: {
                    stage: '$_id.stage',
                    count: '$count',
                  },
                },
              },
            },
          ]
          const results = yield requestModel_1.default.aggregate(pipeline)
          finalResults = results.map((result) => {
            const stages = result.stages.reduce(
              (acc, { stage, count }) => {
                acc[stage] = count
                return acc
              },
              { requested: 0, expired: 0, approved: 0, transactionComplete: 0 }
            )
            return {
              year: result._id,
              stages,
            }
          })
          currentDate = new Date(start)
          while (currentDate <= end) {
            const year = currentDate.getFullYear()
            const existingYear = finalResults.find(
              (yearData) => yearData.year === year
            )
            result.push({
              year: year.toString(),
              requested: existingYear ? existingYear.stages.requested || 0 : 0,
              expired: existingYear ? existingYear.stages.expired || 0 : 0,
              approved: existingYear ? existingYear.stages.approved || 0 : 0,
              transactionComplete: existingYear
                ? existingYear.stages['transaction complete'] || 0
                : 0,
            })
            currentDate.setFullYear(currentDate.getFullYear() + 1)
          }
        }
        return result
      } catch (error) {
        console.log(error)
        return {}
      }
    })
  }
  getPaymentId(userId) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        return yield userModel_1.default.findById(userId, {
          cautionDeposit: 1,
          email: 1,
          paymentId: 1,
        })
      } catch (error) {
        console.log(error)
        return null
      }
    })
  }
  getLendedSingleTransaction(lendId) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const lended = yield bookShelfModel_1.default.findOne(
          { 'lended._id': new mongodb_1.ObjectId(lendId) },
          { 'lended.$': 1 }
        )
        const lendDoc = yield lended === null || lended === void 0
          ? void 0
          : lended.populate('lended.0.requestId')
        if (lendDoc) {
          return lendDoc.lended[0]
        }
        return null
      } catch (error) {
        console.log(error)
        return null
      }
    })
  }
  getBook(bookId) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const book = yield bookShelfModel_1.default.findOne(
          { 'shelf._id': new mongodb_1.ObjectId(bookId) },
          { 'shelf.$': 1 }
        )
        if (book) {
          return book.shelf[0]
        }
        return null
      } catch (error) {
        console.log(error)
        return null
      }
    })
  }
  reduceCautionDeposit(userId, amount, note, lendId) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const user = yield userModel_1.default.findByIdAndUpdate(userId, {
          $inc: { cautionDeposit: -Number(amount) },
        })
        const deduction = yield deductionModel_1.default.findOneAndUpdate(
          {
            userId: new mongodb_1.ObjectId(userId),
          },
          { $push: { deductions: { amount: Number(amount), note: note } } },
          { upsert: true, new: true }
        )
        yield bookShelfModel_1.default.findOneAndUpdate(
          { 'lended._id': new mongodb_1.ObjectId(lendId) },
          { $set: { 'lended.$.hasMadeRefund': true } }
        )
        if (deduction && user) {
          return true
        }
        return false
      } catch (error) {
        console.log(error)
        return false
      }
    })
  }
}
exports.default = AdminRepository
