// ==UserScript==
// @name deworkerpro-prettify
// @description add missing features to deworker.pro
// @version 1.0.0
// @match https://deworker.pro/*
// ==/UserScript==

const storageKey = 'deworkerpro-prettify'
const { watchHistory = {}, settings = {} } = JSON.parse(localStorage.getItem(storageKey)) || {}
const urlHandlers = {
  '^/edu/series/.+/.+$': episode,
  '^/edu': episodeList,
}
const baseUrl = 'https://deworker.pro'
const watchedClass = 'watched'
const unfinishedClass = 'unfinished'
const cssMark = 'deworker-prettify'

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
  const url = getCurrentEpisodeUrl()
  if (!watchHistory[url]) {
    watchHistory[url] = { seconds: 0 }
  }
  initPlayer()
  injectWatchedButton()
}

function episodeList() {
  for (const link of document.querySelectorAll('.edu-items-item a.thumb')) {
    if (!watchHistory[link.href.replace(baseUrl, '')]) {
      continue
    }

    const percent = parseFloat(watchHistory[link.href.replace(baseUrl, '')]?.percent) * 100
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
  watchHistory[url].watched = true
  saveHistoryAndSettings()
}
function toggleWatched(url) {
  watchHistory[url].watched = !watchHistory[url].watched
  saveHistoryAndSettings()
}

function injectStyles() {
  if (document.getElementById(cssMark)) {
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
button.deworker-prettify {
  background-color: #337ab7;
  border: 1px solid #337ab7;
  color: white;
  cursor: pointer;
  font-size: .7em;
  margin-left: 1em;
  padding: 4px 8px;
}
button.deworker-prettify::before {
  content: '👁';
  margin-right: 3px;
  width: 100px;
}
button.deworker-prettify.disabled {
  background-color: #aaa;
  border-color: #aaa;
}
button.deworker-prettify.disabled::before {
  content: '✓';
  color: green;
  margin-right: 3px;
  width: 100px;
}
`
  const tag = document.createElement('style')
  tag.id = cssMark
  tag.textContent = styles
  document.head.appendChild(tag)
}

function saveHistoryAndSettings() {
  localStorage.setItem(storageKey, JSON.stringify({ watchHistory, settings }))
}

function updateSettings(newSettings) {
  Object.assign(settings, newSettings)
  saveHistoryAndSettings()
}

function getCurrentEpisodeUrl() {
  return window.location.pathname.replace(baseUrl, '')
}

function injectWatchedButton() {
  const button = document.createElement('button')
  button.classList.add(cssMark)
  watchedButtonUpdate(button)

  button.addEventListener('click', () => {
    toggleWatched(getCurrentEpisodeUrl())
    watchedButtonUpdate(button)
  })
  document.querySelector('.content-wrapper h1').appendChild(button)
}

function watchedButtonUpdate(button) {
  if (watchHistory[getCurrentEpisodeUrl()].watched) {
    button.textContent = 'Просмотрено'
    button.classList.add('disabled')
    return
  }

  button.textContent = 'Отметить просмотренным'
  button.classList.remove('disabled')
}

function restorePlayerSettings(player) {
  if (settings.volume) {
    player.setVolume(settings.volume)
  }
  if (settings.playbackRate) {
    player.setPlaybackRate(settings.playbackRate)
  }
  const url = getCurrentEpisodeUrl()
  if (!watchHistory[url].watched && watchHistory[url].seconds) {
    player.setCurrentTime(watchHistory[url].seconds)
  }
}

async function initPlayer() {
  const player = await loadPlayer()

  restorePlayerSettings(player)

  player.on('ended', () => {
    markAsViewed(url)
  })
  player.on('volumechange', updateSettings)
  player.on('playbackratechange', updateSettings)
  player.on('timeupdate', (currentProgress) => {
    const diff = currentProgress.seconds - watchHistory[url].seconds
    if (diff < 0 || diff >= 10) {
      watchHistory[url] = currentProgress
      saveHistoryAndSettings()
    }
  })
}
