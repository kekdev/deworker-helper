const episodePathRegexp = new RegExp('/edu/series/.+'))
const storageKey = '_viewed'

if (episodePathRegexp.test(window.location.pathname)) {
  episode();
}

if (window.location.pathname === "/edu") {
    const viewed = localStorage.getItem(storageKey)
    if (! viewed) {
      return;
    }
    for (const link of document.querySelector('.edu-items-item a.thumb')) {
      if (viewed[link.href]) {
        link.classList.add('viewed')
      }
    }
}

async function episode() {
    const player = await loadPlayer()
    player.on('ended', () => markAsViewed(window.location.pathname))
    
}
    
function loadPlayer() {
  const script = document.createElement('script')
  script.src = 'https://player.vimeo.com/api/player.js'
  
  return new Promize((resolve, reject) => {
    script.addEventListener('onload', () => {
      resolve(new Vimeo.Player(document.querySelector('iframe')))
    })
    document.body.appendChild('script')
}

function markAsViewed(url) {
  localStorage.setItem(
    storageKey,
    {
      ...(localStorage.getItem(storageKey) || {}),
      [url]: true
    }
  )
}
  
