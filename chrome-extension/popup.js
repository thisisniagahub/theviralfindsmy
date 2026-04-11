/**
 * TheViralFinds Chrome Extension — Popup Script
 * Handles product detection, affiliate link generation, and clipboard copy.
 */

document.addEventListener('DOMContentLoaded', () => {
  const detectBtn = document.getElementById('detectBtn')
  const generateBtn = document.getElementById('generateBtn')
  const copyBtn = document.getElementById('copyBtn')
  const productInfo = document.getElementById('productInfo')
  const productName = document.getElementById('productName')
  const productPrice = document.getElementById('productPrice')
  const generatedLink = document.getElementById('generatedLink')
  const toast = document.getElementById('toast')

  let currentProduct = null
  let generatedAffiliateUrl = ''

  // Load product data from content script
  detectBtn.addEventListener('click', async () => {
    try {
      // Try stored data first
      const stored = await chrome.storage.local.get('tvf_product')
      if (stored.tvf_product) {
        currentProduct = stored.tvf_product
        showProduct(currentProduct)
        return
      }

      // Request from content script
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
      chrome.tabs.sendMessage(tab.id, { action: 'getProductData' }, (response) => {
        if (response?.success) {
          currentProduct = response.product
          showProduct(currentProduct)
        } else {
          showToast('❌ Could not detect product. Try on a Shopee product page.', 'error')
        }
      })
    } catch {
      showToast('❌ Error detecting product. Refresh and try again.', 'error')
    }
  })

  // Generate affiliate link
  generateBtn.addEventListener('click', async () => {
    if (!currentProduct) return

    // Generate affiliate URL (replace with your actual affiliate URL pattern)
    const baseUrl = 'https://theviralfinds.my/redirect'
    const shortCode = generateShortCode(currentProduct.name)
    generatedAffiliateUrl = `${baseUrl}/${shortCode}?src=chrome-extension&product=${encodeURIComponent(currentProduct.name)}`

    generatedLink.textContent = generatedAffiliateUrl
    generatedLink.classList.add('show')
    copyBtn.style.display = 'block'
    generateBtn.textContent = '✅ Link Generated!'
    generateBtn.disabled = true

    // Save to extension storage
    const history = await chrome.storage.local.get('tvf_history')
    const links = history.tvf_history || []
    links.unshift({
      ...currentProduct,
      affiliateUrl: generatedAffiliateUrl,
      shortCode,
      createdAt: new Date().toISOString(),
    })
    await chrome.storage.local.set({ tvf_history: links.slice(0, 50) })
  })

  // Copy to clipboard
  copyBtn.addEventListener('click', async () => {
    if (!generatedAffiliateUrl) return
    await navigator.clipboard.writeText(generatedAffiliateUrl)
    showToast('✅ Link copied to clipboard!')
  })

  function showProduct(product) {
    currentProduct = product
    productName.textContent = product.name
    productPrice.textContent = `RM ${product.price.toFixed(2)}`
    productInfo.style.display = 'block'
    generateBtn.disabled = false
    generateBtn.textContent = '🔗 Generate Affiliate Link'
    generatedLink.classList.remove('show')
    copyBtn.style.display = 'none'
  }

  function generateShortCode(name) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .substring(0, 20) || 'product'
  }

  function showToast(message, type = 'success') {
    toast.textContent = message
    toast.style.background = type === 'error' ? '#ef4444' : '#22c55e'
    toast.classList.add('show')
    setTimeout(() => toast.classList.remove('show'), 3000)
  }
})
