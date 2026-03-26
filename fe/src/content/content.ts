export interface ImageData {
  id: number; src: string; width: number; height: number
  alt: string; naturalWidth: number; naturalHeight: number
  tagName: string; bgImage: boolean; fileType: string
  fileSize?: number; xpath?: string
}

function getFileType(src: string): string {
  if (src.startsWith('data:image/')) {
    const m = src.match(/data:image\/([a-z0-9+]+)/i)
    return m ? m[1].toUpperCase() : 'DATA'
  }
  try {
    const ext = new URL(src, window.location.href).pathname.split('.').pop()?.toLowerCase()
    if (ext && ['jpg','jpeg','png','gif','webp','svg','avif','bmp','ico'].includes(ext))
      return ext === 'jpg' ? 'JPEG' : ext.toUpperCase()
  } catch {}
  return 'IMG'
}

function estimateBase64Size(src: string): number {
  const b64 = src.split(',')[1] || ''
  return Math.round((b64.length * 3) / 4)
}

function getSimpleSelector(el: Element): string {
  if (el.id) return `#${el.id}`
  const tag = el.tagName.toLowerCase()
  const cls = Array.from(el.classList).slice(0, 2).join('.')
  return cls ? `${tag}.${cls}` : tag
}

function scanImages(): ImageData[] {
  const results: ImageData[] = []
  const seen = new Set<string>()
  let id = 1

  const push = (item: Omit<ImageData, 'id' | 'fileType'>) => {
    if (!item.src || seen.has(item.src)) return
    seen.add(item.src)
    results.push({ ...item, id: id++, fileType: getFileType(item.src), fileSize: item.src.startsWith('data:') ? estimateBase64Size(item.src) : undefined })
  }

  document.querySelectorAll<HTMLImageElement>('img').forEach(img => {
    const src = img.currentSrc || img.src
    if (!src || src === window.location.href) return
    push({ src, width: img.width, height: img.height, alt: img.alt || '', naturalWidth: img.naturalWidth, naturalHeight: img.naturalHeight, tagName: 'IMG', bgImage: false, xpath: getSimpleSelector(img) })
  })

  document.querySelectorAll('*').forEach(el => {
    const bg = window.getComputedStyle(el).backgroundImage
    if (!bg || bg === 'none') return
    ;[...bg.matchAll(/url\(["']?([^"')]+)["']?\)/g)].forEach(m => {
      const src = m[1]
      if (!src.startsWith('data:') && !src.startsWith('http') && !src.startsWith('//') && !src.startsWith('/')) return
      const rect = (el as HTMLElement).getBoundingClientRect()
      push({ src: src.startsWith('//') ? `https:${src}` : src, width: Math.round(rect.width), height: Math.round(rect.height), alt: (el as HTMLElement).title || '', naturalWidth: 0, naturalHeight: 0, tagName: el.tagName, bgImage: true, xpath: getSimpleSelector(el) })
    })
  })

  document.querySelectorAll<HTMLSourceElement>('picture source').forEach(s => {
    const src = (s.getAttribute('srcset') || '').split(',')[0]?.trim().split(' ')[0]
    if (src) push({ src, width: 0, height: 0, alt: 'Picture source', naturalWidth: 0, naturalHeight: 0, tagName: 'SOURCE', bgImage: false, xpath: getSimpleSelector(s) })
  })

  return results
}

// Safe wrapper: tránh crash khi extension bị reload
function safeSendMessage(msg: object) {
  try {
    chrome.runtime.sendMessage(msg)
  } catch (e) {
    // Extension context invalidated — dừng mọi hoạt động
    observer.disconnect()
  }
}

function isExtensionAlive(): boolean {
  try {
    return !!chrome.runtime?.id
  } catch {
    return false
  }
}

// Highlight
let highlightOverlay: HTMLElement | null = null
function highlightImage(src: string) {
  highlightOverlay?.remove()
  const targets: HTMLElement[] = []
  document.querySelectorAll<HTMLImageElement>('img').forEach(img => {
    if ((img.currentSrc || img.src) === src) targets.push(img)
  })
  if (!targets.length) {
    document.querySelectorAll<HTMLElement>('*').forEach(el => {
      if (window.getComputedStyle(el).backgroundImage?.includes(src)) targets.push(el)
    })
  }
  if (!targets.length) return
  const el = targets[0]
  el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  const rect = el.getBoundingClientRect()
  const overlay = document.createElement('div')
  Object.assign(overlay.style, {
    position: 'fixed', top: `${rect.top - 4}px`, left: `${rect.left - 4}px`,
    width: `${rect.width + 8}px`, height: `${rect.height + 8}px`,
    border: '3px solid #1677ff', borderRadius: '4px',
    boxShadow: '0 0 0 6px rgba(22,119,255,0.2)',
    pointerEvents: 'none', zIndex: '2147483647',
    animation: 'iscan-pulse 1.2s ease-in-out 4',
  })
  if (!document.getElementById('__iscanner_style__')) {
    const style = document.createElement('style')
    style.id = '__iscanner_style__'
    style.textContent = '@keyframes iscan-pulse{0%,100%{box-shadow:0 0 0 4px rgba(22,119,255,.3)}50%{box-shadow:0 0 0 12px rgba(22,119,255,.05)}}'
    document.head.appendChild(style)
  }
  document.body.appendChild(overlay)
  highlightOverlay = overlay
  setTimeout(() => overlay.remove(), 5500)
}

// MutationObserver — guard extension context trước khi gọi
let mutTimer: ReturnType<typeof setTimeout> | null = null
const observer = new MutationObserver(() => {
  if (!isExtensionAlive()) { observer.disconnect(); return }
  if (mutTimer) clearTimeout(mutTimer)
  mutTimer = setTimeout(() => {
    if (!isExtensionAlive()) { observer.disconnect(); return }
    safeSendMessage({ type: 'IMAGES_UPDATED', images: scanImages() })
  }, 1000)
})
observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['src', 'srcset', 'style'] })

// Message listener
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'SCAN_IMAGES') {
    try {
      const images = scanImages()
      safeSendMessage({ type: 'IMAGES_SCANNED', images })
      sendResponse({ images })
    } catch (e) {
      sendResponse({ images: [], error: String(e) })
    }
  }
  if (message.type === 'HIGHLIGHT_IMAGE') {
    highlightImage(message.src)
    sendResponse({ ok: true })
  }
  return true
})
