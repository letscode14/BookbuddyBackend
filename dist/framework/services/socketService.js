'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
exports.getIO = exports.initSocketsever = void 0
const socket_io_1 = require('socket.io')
let io
const initSocketsever = (server) => {
  io = new socket_io_1.Server(server, {
    cors: {
      origin: 'http://localhost:5173',
    },
  })
  io.on('connection', (socket) => {
    console.log('socket connected', socket.id)
    socket.on('setup', (userId) => {
      socket.join(userId)
      console.log('user set uped on', userId)
      socket.emit('connected')
    })
    socket.on('join chat', (room) => {
      socket.join(room)
      console.log('user joined room', room)
    })
    socket.on('new message', (newMessage) => {
      var chat = newMessage.chatId
      if (!(chat === null || chat === void 0 ? void 0 : chat.participants))
        return console.log('not users found on the chat')
      chat.participants.forEach((id) => {
        if (id === newMessage.senderId) return
        socket.in(id).emit('message recieved', newMessage)
      })
    })
    socket.on('typing', ({ user, receiver }) => {
      return socket.in(receiver).emit('typing', { user })
    })
    socket.on('stop typing', ({ user, receiver }) =>
      socket.in(receiver).emit('stop typing', { user })
    )
    socket.on('newchatwithuser', (userId) =>
      socket.in(userId).emit('newchat comming')
    )
    //like post
    socket.on('liked post', ({ notification }) => {
      if (notification.actionBy._id == notification.ownerId) {
        return
      } else {
        socket.in(notification.ownerId).emit('new like', { notification })
      }
    })
    //comment post
    socket.on('new comment', ({ response, postId, postOwnerId, reply }) => {
      if (reply !== '') {
        if (response.author._id == reply) return
        socket
          .in(reply)
          .emit('reply comment', { response, postOwnerId, reply, postId })
      }
      if (response.author._id == postOwnerId) return
      else {
        socket
          .in(postOwnerId)
          .emit('comment recieved', { response, postOwnerId, reply, postId })
      }
    })
    //follower
    socket.on('new follower', (data) => {
      if (data.sendTo) {
        socket.in(data.sendTo).emit('user followed', data)
      }
    })
    socket.on('un follow', (data) => {
      if (data.target) {
        socket.in(data.target).emit('un followed', data)
      }
    })
    socket.on('disconnect', () => {
      console.log('socket is disconnected')
    })
  })
}
exports.initSocketsever = initSocketsever
const getIO = () => io
exports.getIO = getIO
