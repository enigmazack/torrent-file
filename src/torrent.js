const bencode = require('bencode')
const _ = require('lodash')
const sha1 = require('./sha1')

class Torrent {
  constructor (buffer) {
    this.buffer = buffer
    this.size = buffer.length
    const dict = this.toDict()
    this.host = new URL(dict.announce.toString()).hostname
    this.isSingleFile = _.has(dict, 'info.length')
    this.isPrivate = _.has(dict, 'info.private')
    this.filesSize = this._getSize()
    this.pieceSize = dict.info['piece length']
    this.hash = this._getHash()
    this.cleanHash = this._getCleanHash()
    this.filesHash = this._getfilesHash()
    this.isFilesSorted = this._isFilesSorted()
    this.isUnique = this.hash !== this.cleanHash
  }

  modifyTracker (mfunction) {
    const dict = this.toDict()
    const tracker = dict.announce.toString()
    const modifiedTracker = mfunction(tracker)
    dict.announce = Buffer.from(modifiedTracker, 'utf-8')
    if (_.has(dict, 'announce-list')) {
      delete dict['announce-list']
    }
    return bencode.encode(dict)
  }

  toDict () {
    return bencode.decode(this.buffer)
  }

  getFiles () {
    const dict = this.toDict()
    const files = []
    if (this.isSingleFile) {
      files.push({
        length: dict.info.length,
        path: dict.info.name.toString()
      })
    } else {
      _.forEach(dict.info.files, f => {
        let filePath = dict.info.name.toString()
        _.forEach(f.path, fp => {
          filePath = filePath + '/' + fp.toString()
        })
        files.push({
          length: f.length,
          path: filePath
        })
      })
    }
    return _.sortBy(files, ['path'])
  }

  getTrackers () {
    const dict = this.toDict()
    const trackers = []
    if (_.has(dict, 'announce-list')) {
      _.forEach(dict['announce-list'], e => {
        trackers.push(e.toString())
      })
    } else {
      trackers.push(dict.announce.toString())
    }
    return trackers
  }

  _getHash () {
    const dict = this.toDict()
    return sha1(bencode.encode(dict.info))
  }

  _getCleanHash () {
    const dict = this.toDict()
    const cleanInfo = {}
    const info = dict.info
    if (_.has(info, 'length')) cleanInfo.length = info.length
    if (_.has(info, 'files')) cleanInfo.files = info.files
    if (_.has(info, 'name')) cleanInfo.name = info.name
    if (_.has(info, 'piece length')) cleanInfo['piece length'] = info['piece length']
    if (_.has(info, 'pieces')) cleanInfo.pieces = info.pieces
    if (_.has(info, 'private')) cleanInfo.private = 1
    return sha1(bencode.encode(cleanInfo))
  }

  _getSize () {
    const files = this.getFiles()
    let size = 0
    _.forEach(files, f => {
      size += f.length
    })
    return size
  }

  _getfilesHash () {
    const dict = this.toDict()
    let files = []
    if (this.isSingleFile) {
      files.push({
        length: dict.info.length,
        path: [dict.info.name]
      })
    } else {
      _.forEach(dict.info.files, f => {
        files.push({
          length: f.length,
          path: f.path
        })
      })
    }
    files = _.sortBy(files, [o => {
      return Buffer.concat(o.path).toString()
    }])
    return sha1(bencode.encode(files))
  }

  _isFilesSorted () {
    if (this.isSingleFile) return true
    const dict = this.toDict()
    const filesHash2 = sha1(bencode.encode(dict.info.files))
    if (this.filesHash === filesHash2) return true
    return false
  }
}

module.exports = Torrent
