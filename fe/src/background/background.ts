// background.ts
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(console.error)

chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id) return
  await chrome.sidePanel.open({ tabId: tab.id })
  setTimeout(() => {
    chrome.tabs.sendMessage(tab.id!, { type: 'SCAN_IMAGES' }).catch(() => {})
  }, 600)
})

// Badge helper
function updateBadge(count: number, tabId?: number) {
  const text = count > 0 ? (count > 999 ? '999+' : String(count)) : ''
  const color = '#1677ff'
  if (tabId) {
    chrome.action.setBadgeText({ text, tabId })
    chrome.action.setBadgeBackgroundColor({ color, tabId })
  } else {
    chrome.action.setBadgeText({ text })
    chrome.action.setBadgeBackgroundColor({ color })
  }
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'REQUEST_SCAN') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0]
      if (!tab?.id) { sendResponse({ images: [] }); return }
      chrome.tabs.sendMessage(tab.id, { type: 'SCAN_IMAGES' }, (res) => {
        if (chrome.runtime.lastError) { sendResponse({ images: [] }); return }
        if (res?.images) updateBadge(res.images.length, tab.id!)
        sendResponse(res)
      })
    })
    return true
  }

  if (message.type === 'HIGHLIGHT_IMAGE') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0]
      if (!tab?.id) return
      chrome.tabs.sendMessage(tab.id, { type: 'HIGHLIGHT_IMAGE', src: message.src })
    })
  }

  if (message.type === 'IMAGES_SCANNED' || message.type === 'IMAGES_UPDATED') {
    if (message.images) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) updateBadge(message.images.length, tabs[0].id)
      })
    }
    chrome.runtime.sendMessage(message).catch(() => {})
  }
})

// Reset badge khi chuyển tab
chrome.tabs.onActivated.addListener(({ tabId }) => {
  updateBadge(0, tabId)
})
