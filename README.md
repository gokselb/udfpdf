# udfpdf

[![CI](https://github.com/gokselb/udfpdf/actions/workflows/ci.yml/badge.svg)](https://github.com/gokselb/udfpdf/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/@gokselb/udfpdf)](https://www.npmjs.com/package/@gokselb/udfpdf)
[![License](https://img.shields.io/badge/license-Apache%202.0-blue)](LICENSE)
[![npm provenance](https://img.shields.io/badge/npm-provenance-green)](https://www.npmjs.com/package/@gokselb/udfpdf)

Convert UYAP UDF documents to PDF, DOCX, HTML, Markdown, or plain text.

UYAP (Ulusal Yargı Ağı Bilişim Sistemi) is Turkey's national judicial network. It produces `.udf` files for court documents (rulings, records, decisions). This CLI converts them to standard formats.

## Install

```bash
npm install -g @gokselb/udfpdf
```

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
import { parseUdf, convertUdf } from '@gokselb/udfpdf'

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

## Legal

The UYAP UDF format is a proprietary format produced by Turkey's Ministry of Justice. This tool reverse-engineers the format solely to read documents that users legitimately own — it does not bypass authentication, circumvent DRM, or access any government systems.

Use this tool only with documents you are authorised to access.

## License

Apache 2.0 © [Burak Goksel](https://github.com/gokselb)
