# Torrent File

This repository provides a class `Torrent` to analysis the metainfo.

## Basic Usage

```javascript
const b = fs.readFileSync('foo.torrent')
const t = new Torrent(b)

// buffer of the torrent file
t.buffer

// size of the torrent file
t.size

// hostname of the tracker
t.host

// size of the actual file
t.filesSize

// info_hash
t.hash

// clean info_hash
t.cleanHash

// files hash
t.filesHash
```

## Definitions of the Hashes

### info_hash

The original definition of **info_hash** in [bep_0003](https://www.bittorrent.org/beps/bep_0003.html).

### clean info_hash

For private trackers, some non-standard info is added to the info dictionary to make their torrents unique.
However, we get the common **info_hash** by removing the non-standard info.  

If two torrent files from different private trackers have the same **clean info_hash**, that means the actual files
they recorded are exactly the same and cross-seeding must be succeeded

### files hash

Sometimes, when torrent files are rebuilt, *piece length* and/or order of files may change.
Any of these will cause broken of the **clean info_hash**. But the pathes and sizes of files keeps unchanged.  

In fact, for some torrent clients, when adding torrent with the option **fast resume** or **skip hash checking**,
they only check the pathes and sizes.

So we sort the files' info by their pathes and calculate the hashes like the **info_hash** as **files hash**.
If **files hashes** of two torrent files match, that means the actual files they recorded have the same pathes and sizes.
Cross-seeding is highly likely to succeed.

## Scripts

Some useful scripts are provided, you can find them in `scripts` folder.

### sort.js

This script will sort torrent files in `files/torrents` into different folders by `name` recorded in metainfo and
rename the torrent files with their **files hashes** and hostnames of trackers.
Also, output to console like

```text
CLEAN HASH                                FILES HASH
7FDE5EF65B3AA95BD50485CABEB61DB0CBCA09DF  CB6348004D9ACEF53BD583B425396374C25189F7-landof.tv.torrent
48A79D3BAB21F9E57BCC14EF8551AF5DDE6EBFA9  6F1FE27CBDE4EF8AC9795E1A2C0456BC6C6E0E11-tracker.hdchina.org.torrent
7FDE5EF65B3AA95BD50485CABEB61DB0CBCA09DF  CB6348004D9ACEF53BD583B425396374C25189F7-tracker.m-team.cc.torrent
7FDE5EF65B3AA95BD50485CABEB61DB0CBCA09DF  CB6348004D9ACEF53BD583B425396374C25189F7-ourbits.club.torrent
CB2C13ACE229FA81411F305B20B0DCD3062E9E0A  CB6348004D9ACEF53BD583B425396374C25189F7-tracker.pterclub.com.torrent
7FDE5EF65B3AA95BD50485CABEB61DB0CBCA09DF  CB6348004D9ACEF53BD583B425396374C25189F7-tracker.totheglory.im.torrent
```
