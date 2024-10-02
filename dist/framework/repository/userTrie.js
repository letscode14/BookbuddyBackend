'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
exports.UserTrie = exports.TrieNode = void 0
class TrieNode {
  constructor() {
    this.children = {}
    this.isEnd = false
    this.users = new Set()
  }
}
exports.TrieNode = TrieNode
class UserTrie {
  constructor() {
    this.root = new TrieNode()
  }
  insert(user) {
    this.addUserToTrie(user.userName, user)
    this.addUserToTrie(user.name, user)
    this.printTrie(this.root)
  }
  printNode() {
    this.printTrie(this.root)
  }
  search(query) {
    this.printTrie(this.root)
    const node = this.searchNode(query)
    if (node) {
      return Array.from(node.users)
    }
    return []
  }
  addUserToTrie(word, user) {
    let node = this.root
    for (const char of word) {
      if (!node.children[char]) {
        node.children[char] = new TrieNode()
      }
      node = node.children[char]
    }
    node.isEnd = true
    node.users.add(user)
  }
  searchNode(query) {
    let node = this.root
    for (const char of query) {
      if (!node.children[char]) {
        return null
      }
      node = node.children[char]
    }
    return node
  }
  printTrie(node, word = '') {
    if (node.isEnd) {
      console.log(`Word: ${word}, Users: ${Array.from(node.users)}`)
    }
    for (const char in node.children) {
      this.printTrie(node.children[char], word + char)
    }
  }
}
exports.UserTrie = UserTrie
