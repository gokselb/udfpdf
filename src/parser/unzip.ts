// SPDX-License-Identifier: Apache-2.0
import JSZip from 'jszip'
import { readFile } from 'fs/promises'
import type { RawUdfFiles } from './types.js'

export async function extractUdf(input: string | Buffer): Promise<RawUdfFiles> {
  const buffer = typeof input === 'string' ? await readFile(input) : input
  const zip = await JSZip.loadAsync(buffer)

  const contentFile = zip.file('content.xml')
  const propertiesFile = zip.file('documentproperties.xml')
  const signFile = zip.file('sign.sgn')

  if (!contentFile) {
    throw new Error('Invalid UDF file: missing content.xml')
  }

  const contentXml = await contentFile.async('string')
  const propertiesXml = propertiesFile ? await propertiesFile.async('string') : ''
  const signBuffer = signFile ? Buffer.from(await signFile.async('arraybuffer')) : null

  return { contentXml, propertiesXml, signBuffer }
}
