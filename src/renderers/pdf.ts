import type { DocumentModel } from '../parser/types.js'
import { renderHTML } from './html.js'

export async function renderPDF(model: DocumentModel): Promise<Buffer> {
  // Dynamic import so puppeteer is optional at module load time
  const puppeteer = await import('puppeteer')
  const browser = await puppeteer.default.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  })

  try {
    const page = await browser.newPage()
    const html = renderHTML(model)
    await page.setContent(html, { waitUntil: 'networkidle0' })

    const { pageFormat } = model
    const pdfBuffer = await page.pdf({
      width: `${pageFormat.width}mm`,
      height: `${pageFormat.height}mm`,
      printBackground: true,
      margin: {
        top: `${pageFormat.margins.top}mm`,
        right: `${pageFormat.margins.right}mm`,
        bottom: `${pageFormat.margins.bottom}mm`,
        left: `${pageFormat.margins.left}mm`,
      },
    })

    return Buffer.from(pdfBuffer)
  } finally {
    await browser.close()
  }
}
