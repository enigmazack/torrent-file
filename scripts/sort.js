const _ = require('lodash')
const fs = require('fs')
const path = require('path')
const Torrent = require('../src/torrent')

const torrentsPath = path.join(__dirname, '../files/torrents')
if (!fs.existsSync(torrentsPath)) {
  fs.mkdirSync(torrentsPath, { recursive: true })
}
const destPath = path.join(__dirname, '../files/sorted')
if (!fs.existsSync(destPath)) {
  fs.mkdirSync(destPath, { recursive: true })
}
const fileList = fs.readdirSync(torrentsPath)

console.log('CLEAN HASH' + ' '.repeat(31), 'FILES HASH')
_.forEach(fileList, (e) => {
  const filePath = path.join(torrentsPath, e)
  const fileBuffer = fs.readFileSync(filePath)
  const t = new Torrent(fileBuffer)
  const dict = t.toDict()
  let dir
  if (t.isSingleFile) {
    const name = dict.info.name.toString()
    const ext = path.extname(name)
    dir = path.basename(name, ext)
  } else {
    dir = dict.info.name.toString()
  }
  const dirPath = path.join(destPath, dir)
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true })
  }
  const newName = t.filesHash.toUpperCase() + '-' + t.host + '.torrent'
  const newPath = path.join(dirPath, newName)
  fs.copyFileSync(filePath, newPath)
  console.log(t.cleanHash.toUpperCase() + '  ' + newName)
})
