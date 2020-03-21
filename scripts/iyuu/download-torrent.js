const _ = require('lodash')
const axios = require('axios')
const fs = require('fs')
const path = require('path')
const HttpsProxyAgent = require('https-proxy-agent')
const TimeoutPromise = require('./timeout-promise')
const sitesConfig = require('./config.json').sites
const proxy = require('./config.json').proxy

async function downloadTorrent (torrentInfo, sites, destPath, timeout = 10 * 1000, retry = 3) {
  const info = getDownloadInfo(torrentInfo, sites, destPath)
  if (info.url) {
    let count = retry
    let error
    while (count > 0) {
      try {
        await getTorrent(info, timeout)
        return new Promise((resolve, reject) => {
          resolve(info)
        })
      } catch (err) {
        count -= 1
        error = err
      }
    }
    return new Promise((resolve, reject) => {
      reject(error)
    })
  }
}

async function getTorrent (info, timeout) {
  const requestConfig = {}
  requestConfig.method = 'GET'
  requestConfig.url = info.url
  requestConfig.responseType = 'stream'
  // add proxy config
  if (info.useProxy) {
    if (new URL(info.url).protocol === 'https:') {
      const agent = new HttpsProxyAgent(proxy)
      requestConfig.httpsAgent = agent
    } else {
      requestConfig.proxy = {
        host: new URL(proxy).hostname,
        port: new URL(proxy).port
      }
    }
  }
  try {
    const response = await axios(requestConfig)
    if (response.status === 200) {
      response.data.pipe(fs.createWriteStream(info.filePath))
      return new TimeoutPromise((resolve, reject) => {
        response.data.on('end', () => {
          resolve(info)
        })
        response.data.on('error', err => {
          reject(err)
        })
      }, timeout)
    } else {
      return new Promise((resolve, reject) => {
        reject(new Error(response.status))
      })
    }
  } catch (err) {
    return new Promise((resolve, reject) => {
      reject(err)
    })
  }
}

function getDownloadInfo (torrentInfo, sites, destPath) {
  const torrentId = torrentInfo.torrent_id
  const siteInfo = _.find(sites, {
    id: torrentInfo.sid
  })
  // if site is not configured
  if (!_.has(sitesConfig, siteInfo.site)) return {}
  const siteConfig = sitesConfig[siteInfo.site]
  // if site is configured to disabled
  if (!siteConfig.enable) return {}

  const protocol = siteInfo.is_https ? 'https://' : 'http://'
  const url = new URL(protocol + siteInfo.base_url)
  switch (siteInfo.site) {
    case 'keepfrds':
    case 'm-team':
    case 'pter':
    case 'ourbits':
    case 'hddolby':
    case 'moecat':
    case 'beitai':
    case 'ssd':
    case 'leaguehd':
    case 'hdarea':
    case 'pt':
      url.pathname = '/download.php'
      url.searchParams.append('id', torrentId)
      url.searchParams.append('passkey', siteConfig.passkey)
      if (siteConfig.https) url.searchParams.append('https', 1)
      if (siteConfig.ipv6) url.searchParams.append('ipv6', 1)
      break
    case 'ptpbd':
    case 'dicmusic':
      url.pathname = '/torrents.php'
      url.searchParams.append('action', 'download')
      url.searchParams.append('id', torrentId)
      url.searchParams.append('authkey', siteConfig.authkey)
      url.searchParams.append('torrent_pass', siteConfig.passkey)
      break
    case 'ttg':
      url.pathname = `/dl/${torrentId}/${siteConfig.passkey}`
      break
    default:
      return {}
  }
  return {
    url: url.href,
    useProxy: siteConfig.useProxy,
    filePath: path.join(destPath, `${torrentInfo.info_hash.toUpperCase()}-${siteInfo.site}.torrent`)
  }
}

module.exports = { downloadTorrent, getDownloadInfo }
