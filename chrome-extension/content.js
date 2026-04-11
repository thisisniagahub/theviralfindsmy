/**
 * TheViralFinds Chrome Extension — Content Script
 * Injects "Generate Affiliate Link" button on Shopee product pages.
 * Detects product info and sends to popup for link generation.
 */

(function () {
  'use strict'

  // Wait for product page to load
  function waitForProductData(callback: (data: any) => void) {
    const checkInterval = setInterval(() => {
      // Try to extract product data from Shopee page
      const productName = document.querySelector('h1.shopee-product-detail__product-name')?.textContent?.trim()
      const priceEl = document.querySelector('div.shopee-product-detail__price')
      const priceText = priceEl?.textContent?.trim()
      const priceMatch = priceText?.match(/[\d,]+\.?\d*/)
      const price = priceMatch ? parseFloat(priceMatch[0].replace(/,/g, '')) : 0
      const productUrl = window.location.href
      const productId = window.location.pathname.match(/\.(\d+)/)?.[1]

      if (productName && price > 0) {
        clearInterval(checkInterval)
        callback({
          name: productName,
          price,
          url: productUrl,
          productId,
          timestamp: Date.now(),
        })
      }
    }, 500)

    // Stop after 10 seconds
    setTimeout(() => clearInterval(checkInterval), 10000)
  }

  // Inject button into product page
  function injectButton(productData: any) {
    // Remove existing button if any
    const existing = document.getElementById('tvf-generate-link')
    if (existing) existing.remove()

    // Find a good insertion point (near Add to Cart or Buy Now)
    const targetSelectors = [
      'button.shopee-product-detail__add-to-cart',
      'button.shopee-product-detail__buy-now',
      'div.shopee-product-detail__actions',
    ]

    let target: Element | null = null
    for (const selector of targetSelectors) {
      target = document.querySelector(selector)
      if (target) break
    }

    if (!target) {
      // Fallback: insert at top of page
      target = document.querySelector('header') || document.body
    }

    // Create button
    const btn = document.createElement('div')
    btn.id = 'tvf-generate-link'
    btn.innerHTML = `
      <button style="
        background: linear-gradient(135deg, #EE4D2D, #D73211);
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 8px;
        margin-top: 10px;
        box-shadow: 0 4px 12px rgba(238, 77, 45, 0.3);
        transition: transform 0.1s, box-shadow 0.1s;
      " onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='scale(1)'">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
        </svg>
        Generate Affiliate Link
      </button>
    `

    btn.querySelector('button')?.addEventListener('click', () => {
      // Store product data for popup
      chrome.storage.local.set({ tvf_product: productData })
      // Open popup
      chrome.runtime.sendMessage({ action: 'openPopup' })
    })

    target.after(btn)
  }

  // Listen for messages from popup
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'getProductData') {
      waitForProductData((data) => {
        sendResponse({ success: true, product: data })
      })
      return true // async response
    }
  })

  // Initialize on page load
  waitForProductData(injectButton)
})()
