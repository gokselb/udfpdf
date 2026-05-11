import { Command } from 'commander'
import { readFileSync } from 'fs'
import { resolve, basename, extname, join, dirname } from 'path'
import { writeFile, mkdir } from 'fs/promises'
import { createRequire } from 'module'
import fg from 'fast-glob'
import ora from 'ora'
import type { OutputFormat } from './index.js'
import { parseUdf } from './index.js'

const require = createRequire(import.meta.url)
const pkg = require('../package.json') as { version: string; description: string }

const program = new Command()

program
  .name('udfpdf')
  .description(pkg.description)
  .version(pkg.version)
  .argument('<files...>', 'UDF file(s) or glob patterns (e.g. *.udf)')
  .option('-f, --format <fmt>', 'output format: pdf | docx | html | txt | md', 'pdf')
  .option('-o, --output <file>', 'output file path (single input only)')
  .option('-d, --dir <dir>', 'output directory for batch conversion')
  .option('-v, --verbose', 'print parsing details')
  .action(async (patterns: string[], opts: {
    format: string
    output?: string
    dir?: string
    verbose?: boolean
  }) => {
    const format = opts.format as OutputFormat
    const validFormats: OutputFormat[] = ['pdf', 'docx', 'html', 'txt', 'md']
    if (!validFormats.includes(format)) {
      console.error(`Error: unknown format "${format}". Valid formats: ${validFormats.join(', ')}`)
      process.exit(1)
    }

    // Expand globs
    const files = await fg(patterns, { absolute: true, onlyFiles: true })
    if (files.length === 0) {
      console.error('Error: no matching UDF files found.')
      process.exit(1)
    }

    if (opts.output && files.length > 1) {
      console.error('Error: --output can only be used with a single input file.')
      process.exit(1)
    }

    for (const inputPath of files) {
      const spinner = ora(`Converting ${basename(inputPath)} → ${format}`).start()

      try {
        const model = await parseUdf(inputPath)

        if (opts.verbose) {
          spinner.info(`Parsed: ${model.body.length} blocks, ${model.header.length} header paras, ${model.footer.length} footer paras`)
        }

        let outputPath: string
        if (opts.output) {
          outputPath = resolve(opts.output)
        } else {
          const outDir = opts.dir
            ? resolve(opts.dir)
            : dirname(inputPath)
          await mkdir(outDir, { recursive: true })
          const stem = basename(inputPath, extname(inputPath))
          outputPath = join(outDir, `${stem}.${format}`)
        }

        let content: Buffer | string
        switch (format) {
          case 'txt': {
            const { renderText } = await import('./renderers/text.js')
            content = renderText(model)
            break
          }
          case 'html': {
            const { renderHTML } = await import('./renderers/html.js')
            content = renderHTML(model)
            break
          }
          case 'md': {
            const { renderMarkdown } = await import('./renderers/markdown.js')
            content = renderMarkdown(model)
            break
          }
          case 'pdf': {
            const { renderPDF } = await import('./renderers/pdf.js')
            content = await renderPDF(model)
            break
          }
          case 'docx': {
            const { renderDOCX } = await import('./renderers/docx.js')
            content = await renderDOCX(model)
            break
          }
          default:
            throw new Error(`Unsupported format: ${format}`)
        }

        await writeFile(outputPath, content as never)
        spinner.succeed(`Saved: ${outputPath}`)
      } catch (err) {
        spinner.fail(`Failed: ${basename(inputPath)} — ${(err as Error).message}`)
        if (opts.verbose) console.error(err)
      }
    }
  })

program.parse()
