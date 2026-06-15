;(function () {
  if (window.location.pathname.endsWith('index.html')) return
  var btn = document.createElement('a')
  btn.href = 'index.html'
  btn.textContent = '\u2190 Men\u00fa'
  Object.assign(btn.style, {
    position: 'fixed',
    top: '8px',
    left: '8px',
    zIndex: '999999',
    background: 'rgba(0,0,0,0.55)',
    color: '#fff',
    border: '1px solid rgba(255,255,255,0.25)',
    borderRadius: '20px',
    padding: '6px 14px',
    fontSize: '14px',
    fontFamily: "'Segoe UI', Arial, sans-serif",
    textDecoration: 'none',
    cursor: 'pointer',
    backdropFilter: 'blur(4px)',
    WebkitBackdropFilter: 'blur(4px)',
    transition: 'background 0.2s',
    touchAction: 'manipulation',
    userSelect: 'none',
    WebkitUserSelect: 'none',
  })
  btn.addEventListener('mouseenter', function () {
    btn.style.background = 'rgba(0,0,0,0.75)'
  })
  btn.addEventListener('mouseleave', function () {
    btn.style.background = 'rgba(0,0,0,0.55)'
  })
  document.documentElement.appendChild(btn)
})()
