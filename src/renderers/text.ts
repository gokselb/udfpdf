// SPDX-License-Identifier: Apache-2.0
import type { DocumentModel } from '../parser/types.js'

export function renderText(model: DocumentModel): string {
  // The rawText CDATA contains the full rendered document text.
  // Normalize whitespace: collapse excessive blank lines, normalize tabs.
  return model.rawText
    .replace(/\t/g, '  ')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n{4,}/g, '\n\n\n')
    .trim()
}
