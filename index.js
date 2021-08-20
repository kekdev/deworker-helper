const singleSerieRegexp = new RegExp('/edu/series/.+'))
const storageKey = '_viewed'

if (regexp.test(window.location.pathname)) {
  localStorage.setItem(storageKey, {
    ...(localStorage.getItem(storageKey) || {}),
    [window.location.pathname]: true
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
