// ==UserScript==
// @name deworker-helper
// @description remember viewed videos
// @version 0.0.2
// @match https://deworker.pro/edu*
// ==/UserScript==

const progressStorageKey = '_watchProgress'
const settingsStorageKey = '_watchSettings'
let watchProgress = JSON.parse(localStorage.getItem(progressStorageKey)) || {}
let settings = JSON.parse(localStorage.getItem(settingsStorageKey)) || {}
const urlHandlers = {
  '^/edu$': episodeList,
  '^/edu/series/.+': episode,
}
const baseUrl = 'https://deworker.pro'

const watchedClass = 'watched'

for (const regexp in urlHandlers) {
  if ((new RegExp(regexp)).test(window.location.pathname)) {
    urlHandlers[regexp]();
  }
}

async function episode() {
  const player = await loadPlayer()
  if (settings.volume) {
    player.setVolume(settings.volume)
  }
  if (settings.playbackRate) {
    player.setPlaybackRate(settings.playbackRate)
  }
  player.on('ended', () => {
    markAsViewed(window.location.pathname)
  })

  player.on('volumechange', updateSettings)
  player.on('playbackratechange', updateSettings)
}

function episodeList() {
  injectStyles()
  for (const link of document.querySelectorAll('.edu-items-item a.thumb')) {
    if (watchProgress[link.href.replace(baseUrl, '')] == 100) {
      link.classList.add(watchedClass)
    }
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
  watchProgress[url] = 100
  updateStorage()
}

function injectStyles() {
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
`
  const tag = document.createElement('style')
  tag.innerText = styles
  document.head.appendChild(tag)
}

function updateStorage() {
  localStorage.setItem(progressStorageKey, JSON.stringify(watchProgress))
}

function updateSettings(newSettings) {
  settings = {
    ...settings,
    ...newSettings
  }
  localStorage.setItem(settingsStorageKey, JSON.stringify(settings))
}
