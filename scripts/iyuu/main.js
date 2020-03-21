const axios = require('axios')
const _ = require('lodash')
const path = require('path')
const fs = require('fs')
const sha1 = require('../../src/sha1')
const { downloadTorrent, getDownloadInfo } = require('./download-torrent')
const sign = require('./config.json').iyuuToken
const hashList = require('./hash-list.json')

const destPath = path.join(__dirname, '../../files/torrents')
if (!fs.existsSync(destPath)) {
  fs.mkdirSync(destPath, { recursive: true })
}

const request = axios.create({
  baseURL: 'http://api.iyuu.cn/'
})

// request iyuu supported sites
request.get('/index.php', {
  params: {
    service: 'App.Api.Sites',
    sign
  }
}).then(
  sitesRes => {
    const version = sitesRes.data.version
    const sites = sitesRes.data.data.sites
    const hashListJSON = JSON.stringify(hashList)
    request.post('/index.php', {
      sign,
      timestamp: Date.now(),
      version,
      hash: hashListJSON,
      sha1: sha1(hashListJSON)
    },
    {
      params: {
        service: 'App.Api.Hash'
      }
    }).then(hashRes => {
      const results = hashRes.data.data
      let torrentList = []
      _.forEach(results, ele => {
        torrentList = _.concat(torrentList, ele.torrent)
      })
      _.forEach(torrentList, torrentInfo => {
        const info = getDownloadInfo(torrentInfo, sites, destPath)
        downloadTorrent(torrentInfo, sites, destPath).then(() => {
          if (info.filePath) console.log('Donwload: ' + info.filePath)
        }).catch(err => {
          if (info.url) console.log(err.message + ': ' + info.url)
        })
      })
    }).catch(err => {
      console.log(err)
    })
  }
).catch(err => {
  console.log(err)
})
