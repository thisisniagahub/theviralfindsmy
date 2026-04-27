import QRCode from 'qrcode'

/**
 * Generate a QR code as an SVG string.
 * @param data - The data to encode (URL, text, etc.)
 * @param size - The size of the QR code in pixels (default: 256)
 * @returns SVG string
 */
export async function generateQRCodeSVG(data: string, size = 256): Promise<string> {
  const svgString = await QRCode.toString(data, {
    type: 'svg',
    width: size,
    margin: 2,
    color: {
      dark: '#1a1a1a',
      light: '#ffffff',
    },
    errorCorrectionLevel: 'M',
  })
  return svgString
}

/**
 * Generate a QR code as a data URL (for <img> src).
 * @param data - The data to encode
 * @param size - The size in pixels
 * @returns data:image/svg+xml;base64,... string
 */
export async function generateQRCodeDataURL(data: string, size = 256): Promise<string> {
  const svgString = await generateQRCodeSVG(data, size)
  return `data:image/svg+xml;base64,${Buffer.from(svgString).toString('base64')}`
}
