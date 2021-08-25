// ==UserScript==
// @name deworker-helper
// @description remember viewed videos
// @version 0.0.2
// @match https://deworker.pro/*
// ==/UserScript==

const progressStorageKey = '_watchProgress'
const settingsStorageKey = '_watchSettings'
let watchProgress = JSON.parse(localStorage.getItem(progressStorageKey)) || {}
let settings = JSON.parse(localStorage.getItem(settingsStorageKey)) || {}
const urlHandlers = {
  '^/edu/series/.+/.+$': episode,
  '^/edu': episodeList,
}
const baseUrl = 'https://deworker.pro'

const watchedClass = 'watched'
const unfinishedClass = 'unfinished'
const styleTagId = 'deworker-prettify'

window.addEventListener('load', () => {
  injectStyles()
  run()
})

// use nextjs router events
// cause there is no method to detect url change for now
next?.router.events.on('routeChangeComplete', () => {
  run()
})

function run() {
  for (const regexp in urlHandlers) {
    if ((new RegExp(regexp)).test(window.location.pathname)) {
      urlHandlers[regexp]();
    }
  }
}

async function episode() {
  const player = await loadPlayer()
  const url = getCurrentEpisodeUrl()
  if (!watchProgress[url]) {
    watchProgress[url] = { seconds: 0 }
  }

  if (settings.volume) {
    player.setVolume(settings.volume)
  }
  if (settings.playbackRate) {
    player.setPlaybackRate(settings.playbackRate)
  }
  if (!watchProgress[url].watched && watchProgress[url].seconds) {
    player.setCurrentTime(watchProgress[url].seconds)
  }

  player.on('ended', () => {
    markAsViewed(url)
  })
  player.on('volumechange', updateSettings)
  player.on('playbackratechange', updateSettings)
  player.on('timeupdate', (currentProgress) => {
    const diff = currentProgress.seconds - watchProgress[url].seconds
    if (diff < 0 || diff >= 10) {
      watchProgress[url] = currentProgress
      saveProgress()
    }
  })
}

function episodeList() {
  for (const link of document.querySelectorAll('.edu-items-item a.thumb')) {
    if (!watchProgress[link.href.replace(baseUrl, '')]) {
      continue
    }

    const percent = parseFloat(watchProgress[link.href.replace(baseUrl, '')]?.percent) * 100
    if (percent < 98) {
      link.classList.add(unfinishedClass)
      link.classList.add(unfinishedClass + '-' + Math.floor(percent / 20))
      continue
    }
    link.classList.add(watchedClass)
  }
}

function loadPlayer() {
  const script = document.createElement('script')
  script.src = 'https://player.vimeo.com/api/player.js'
  document.body.appendChild(script)

  return new Promise((resolve, reject) => {
    script.addEventListener('load', () => {
      resolve(new Vimeo.Player(document.querySelector('iframe')))
    })
  })
}

function markAsViewed(url) {
  watchProgress[url].watched = true
  saveProgress()
}

function injectStyles() {
  if (document.getElementById(styleTagId)) {
    return
  }

  // todo: replace width styles with attr() function when implemented
  const styles = `
.edu-items .thumb.watched::before {
  background-color: rgba(33,33,33,.6);
  display: block;
  position: relative;
  width: 100%;
  height: 100%;
  z-index: 1;
  color: white;
}

.edu-items-item .thumb.watched::after {
  display: block;
  position: absolute;
  z-index: 2;
  border-top: 1px solid #fff;
  border-bottom: 1px solid #fff;
  content: 'Просмотрено';
  color: #fff;
  background-color: rgba(33,33,33,.9);
  text-align: center;
  transform: translateY(-50%);
  font-size: 1.1em;
  top: 50%;
  left: 0;
  width: 100%;
}

.edu-items-item .thumb.unfinished::after {
  display: block;
  background: #5699EE;
  height: 8px;
  width: 0;
  content: ' ';
  position: absolute;
  bottom: 0;
}
.edu-items-item .thumb.unfinished.unfinished-1::after {
  width: 20%;
}
.edu-items-item .thumb.unfinished.unfinished-2::after {
  width: 40%;
}
.edu-items-item .thumb.unfinished.unfinished-3::after {
  width: 60%;
}
.edu-items-item .thumb.unfinished.unfinished-4::after {
  width: 80%;
}

`
  const tag = document.createElement('style')
  tag.id = styleTagId
  tag.textContent = styles
  document.head.appendChild(tag)
}

function saveProgress() {
  localStorage.setItem(progressStorageKey, JSON.stringify(watchProgress))
}

function updateSettings(newSettings) {
  settings = {
    ...settings,
    ...newSettings
  }
  localStorage.setItem(settingsStorageKey, JSON.stringify(settings))
}

function getCurrentEpisodeUrl() {
  return window.location.pathname.replace(baseUrl, '')
}
