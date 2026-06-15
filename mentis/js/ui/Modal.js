import { events } from '../core/EventBus.js'
import { audio } from '../app.js'

export class ModalManager {
  constructor(container) {
    this._container = container
    this._overlay = null
    this._active = false
  }

  show({ title, body, buttons, onClose }) {
    this.close()
    this._overlay = document.createElement('div')
    this._overlay.className = 'modal-overlay'
    this._overlay.onclick = (e) => { if (e.target === this._overlay) this.close() }
    const btnHTML = (buttons || [{ text: 'Cerrar', cls: 'btn-primary', action: () => this.close() }])
      .map(b => `<button class="btn ${b.cls || 'btn-ghost'}" data-action="${b.text}">${b.text}</button>`).join('')
    this._overlay.innerHTML = `
      <div class="modal" style="text-align:center">
        ${title ? `<h2 style="font-size:20px;margin-bottom:12px;color:var(--gold)">${title}</h2>` : ''}
        ${body ? `<p style="font-size:14px;color:var(--text-secondary);margin-bottom:20px;line-height:1.6">${body}</p>` : ''}
        <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap">${btnHTML}</div>
      </div>
    `
    this._container.appendChild(this._overlay)
    requestAnimationFrame(() => this._overlay.classList.add('active'))
    this._overlay.querySelectorAll('button[data-action]').forEach(btn => {
      btn.onclick = () => {
        const b = (buttons || []).find(b => b.text === btn.dataset.action)
        if (b?.action) b.action()
        else this.close()
        audio.click()
      }
    })
    this._active = true
    this._onClose = onClose
  }

  confirm({ title, body, onConfirm, onCancel, confirmText = 'Sí', cancelText = 'Cancelar' }) {
    this.show({
      title, body,
      buttons: [
        { text: cancelText, cls: 'btn-ghost', action: () => { this.close(); onCancel?.() } },
        { text: confirmText, cls: 'btn-gold', action: () => { this.close(); onConfirm?.() } },
      ]
    })
  }

  alert({ title, body }) {
    this.show({ title, body, buttons: [{ text: 'OK', cls: 'btn-primary' }] })
  }

  close() {
    if (this._overlay) {
      this._overlay.classList.remove('active')
      setTimeout(() => { this._overlay?.remove(); this._overlay = null }, 300)
    }
    this._active = false
    this._onClose?.()
  }

  isActive() { return this._active }
}

export class NotificationSystem {
  constructor(container) {
    this._container = container
    const el = document.createElement('div')
    el.className = 'toast-container'
    this._container.appendChild(el)
    this._el = el
  }

  show(message, type = 'info', duration = 3000) {
    const toast = document.createElement('div')
    toast.className = `toast toast-${type}`
    const icons = { success: '✅ ', error: '❌ ', info: 'ℹ️ ' }
    toast.textContent = (icons[type] || '') + message
    this._el.appendChild(toast)
    requestAnimationFrame(() => toast.classList.add('show'))
    setTimeout(() => {
      toast.classList.remove('show')
      setTimeout(() => toast.remove(), 300)
    }, duration)
  }

  success(msg, dur) { this.show(msg, 'success', dur) }
  error(msg, dur) { this.show(msg, 'error', dur) }
  info(msg, dur) { this.show(msg, 'info', dur) }
}
