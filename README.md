# udfpdf

Convert UYAP UDF documents to PDF, DOCX, HTML, Markdown, or plain text.

UYAP (Ulusal Yargı Ağı Bilişim Sistemi) is Turkey's national judicial network. It produces `.udf` files for court documents (rulings, records, decisions). This CLI converts them to standard formats.

## Install

```bash
npm install -g udfpdf
```

> **Note:** PDF conversion requires Puppeteer (~170MB Chromium download on first install). If you only need DOCX/HTML/TXT/MD, you can skip the Chromium download by setting `PUPPETEER_SKIP_DOWNLOAD=true` before installing.

## Usage

```bash
# Convert to PDF (default)
udfpdf evrak.udf

# Choose output format
udfpdf evrak.udf -f docx
udfpdf evrak.udf -f html
udfpdf evrak.udf -f txt
udfpdf evrak.udf -f md

# Custom output path
udfpdf evrak.udf -o /tmp/result.pdf

# Batch convert (glob patterns)
udfpdf *.udf -f html -d ./output/

# Verbose mode
udfpdf evrak.udf -v
```

### Options

| Option | Default | Description |
|--------|---------|-------------|
| `-f, --format <fmt>` | `pdf` | Output format: `pdf`, `docx`, `html`, `txt`, `md` |
| `-o, --output <file>` | _(input name + ext)_ | Output file path (single input only) |
| `-d, --dir <dir>` | _(same as input)_ | Output directory for batch conversion |
| `-v, --verbose` | `false` | Print parsing details |

## Programmatic API

```typescript
import { parseUdf, convertUdf } from 'udfpdf'

// Parse to document model
const model = await parseUdf('./evrak.udf')
console.log(model.rawText)           // full document text
console.log(model.metadata)          // { verificationCode, serial }
console.log(model.pageFormat)        // { width, height, margins, orientation }

// Convert directly
const pdf = await convertUdf('./evrak.udf', 'pdf')      // Buffer
const html = await convertUdf('./evrak.udf', 'html')    // string
const md = await convertUdf('./evrak.udf', 'md')        // string
const docx = await convertUdf('./evrak.udf', 'docx')    // Buffer
const txt = await convertUdf('./evrak.udf', 'txt')      // string
```

## UDF Format

A `.udf` file is a ZIP archive containing:
- `content.xml` — Document layout (paragraphs, tables, styles, page format) in UYAP XML format v1.8
- `documentproperties.xml` — UYAP metadata (verification code, serial number)
- `sign.sgn` — X.509/PKCS#7 digital signature (TÜBİTAK chain)

## Requirements

- Node.js 18+
- For PDF output: Puppeteer (auto-installed, downloads Chromium)

## License

MIT
