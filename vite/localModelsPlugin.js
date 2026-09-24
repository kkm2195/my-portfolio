import fs from 'node:fs'
import path from 'node:path'

const MODEL_EXT = new Set(['.glb', '.gltf'])
const IMAGE_EXT = new Set(['.png', '.jpg', '.jpeg', '.webp'])
const MAX_BYTES = 80 * 1024 * 1024

function catalogPath(root) {
  return path.join(root, 'src', 'data', 'catalog.json')
}

function publicDir(root) {
  return path.join(root, 'public')
}

function readCatalog(root) {
  const file = catalogPath(root)
  if (!fs.existsSync(file)) return []
  const data = JSON.parse(fs.readFileSync(file, 'utf8'))
  return Array.isArray(data) ? data : []
}

function writeCatalog(root, models) {
  const file = catalogPath(root)
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, `${JSON.stringify(models, null, 2)}\n`)
}

function send(res, status, body) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(body))
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    let size = 0
    req.on('data', (chunk) => {
      size += chunk.length
      if (size > MAX_BYTES) {
        reject(Object.assign(new Error('File is too large (max 80 MB).'), { status: 413 }))
        req.destroy()
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

function headerValue(header, name) {
  const match = new RegExp(`(?:^|[;\\s])${name}="([^"]*)"`, 'im').exec(header)
  if (match) return match[1]
  const plain = new RegExp(`(?:^|[;\\s])${name}=([^;\\s]+)`, 'im').exec(header)
  return plain ? plain[1] : ''
}

function parseMultipart(buffer, contentType) {
  const boundaryMatch = /boundary=(?:"([^"]+)"|([^;]+))/i.exec(contentType || '')
  const boundary = boundaryMatch?.[1] || boundaryMatch?.[2]
  if (!boundary) {
    throw Object.assign(new Error('Expected a multipart upload.'), { status: 400 })
  }

  const delimiter = Buffer.from(`--${boundary}`)
  const parts = []
  let cursor = buffer.indexOf(delimiter)

  while (cursor !== -1) {
    cursor += delimiter.length
    if (buffer[cursor] === 45 && buffer[cursor + 1] === 45) break
    if (buffer[cursor] === 13 && buffer[cursor + 1] === 10) cursor += 2
    else if (buffer[cursor] === 10) cursor += 1

    const next = buffer.indexOf(delimiter, cursor)
    if (next === -1) break

    let end = next
    if (buffer[end - 2] === 13 && buffer[end - 1] === 10) end -= 2
    else if (buffer[end - 1] === 10) end -= 1

    const chunk = buffer.subarray(cursor, end)
    const sep = chunk.indexOf(Buffer.from('\r\n\r\n'))
    const sepLen = sep === -1 ? 2 : 4
    const splitAt = sep === -1 ? chunk.indexOf(Buffer.from('\n\n')) : sep
    if (splitAt !== -1) {
      const rawHeader = chunk.subarray(0, splitAt).toString('utf8')
      const body = chunk.subarray(splitAt + (sep === -1 ? sepLen : sepLen))
      const name = headerValue(rawHeader, 'name')
      const filename = headerValue(rawHeader, 'filename')
      parts.push({
        name,
        filename,
        body: filename ? body : body.toString('utf8'),
      })
    }

    cursor = next
  }

  return parts
}

function partFile(parts, name, allowed) {
  const part = parts.find((item) => item.name === name && item.filename)
  if (!part || !part.body?.length) return null
  const ext = path.extname(part.filename).toLowerCase()
  if (!allowed.has(ext)) {
    throw Object.assign(
      new Error(`“${part.filename}” must be one of: ${[...allowed].join(', ')}`),
      { status: 400 },
    )
  }
  return { ext, buffer: part.body }
}

function readMeta(parts) {
  const metaPart = parts.find((item) => item.name === 'meta')
  if (!metaPart) {
    throw Object.assign(new Error('Missing model details.'), { status: 400 })
  }
  let meta
  try {
    meta = JSON.parse(typeof metaPart.body === 'string' ? metaPart.body : metaPart.body.toString('utf8'))
  } catch {
    throw Object.assign(new Error('Model details were not valid JSON.'), { status: 400 })
  }
  const title = String(meta.title || '').trim()
  if (!title) {
    throw Object.assign(new Error('Title is required.'), { status: 400 })
  }
  return {
    title,
    category: String(meta.category || 'Hard Surface').trim() || 'Hard Surface',
    year: Number(meta.year) || new Date().getFullYear(),
    software: String(meta.software || 'Blender').trim() || 'Blender',
    description: String(meta.description || '').trim(),
    color: String(meta.color || '#c45c2a'),
    accent: String(meta.accent || '#f3d7c4'),
  }
}

function slugify(title) {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'model'
  return `${base}-${Date.now().toString(36)}`
}

function safeId(id) {
  const clean = decodeURIComponent(id || '')
  if (!/^[a-z0-9-]+$/i.test(clean)) {
    throw Object.assign(new Error('Unknown model.'), { status: 400 })
  }
  return clean
}

function publicUrl(folder, filename) {
  return `/${folder}/${filename}?v=${Date.now()}`
}

function removePublicAsset(root, urlPath) {
  if (!urlPath || typeof urlPath !== 'string') return
  const pathname = urlPath.split('?')[0]
  if (!pathname.startsWith('/models/') && !pathname.startsWith('/thumbnails/')) return
  if (pathname.includes('..')) return

  const full = path.resolve(publicDir(root), pathname.replace(/^\//, ''))
  const relative = path.relative(publicDir(root), full)
  if (relative.startsWith('..') || path.isAbsolute(relative)) return
  fs.rmSync(full, { force: true })
}

function saveAsset(root, folder, id, file) {
  const dir = path.join(publicDir(root), folder)
  fs.mkdirSync(dir, { recursive: true })
  const filename = `${id}${file.ext}`
  fs.writeFileSync(path.join(dir, filename), file.buffer)
  return publicUrl(folder, filename)
}

async function handle(req, res, url, root) {
  if (req.method === 'GET' && url === '/api/models') {
    send(res, 200, { writable: true, models: readCatalog(root) })
    return
  }

  if (req.method === 'POST' && url === '/api/models') {
    const parts = parseMultipart(await readBody(req), req.headers['content-type'])
    const fields = readMeta(parts)
    const file = partFile(parts, 'file', MODEL_EXT)
    const thumbnail = partFile(parts, 'thumbnail', IMAGE_EXT)
    if (!file) {
      throw Object.assign(new Error('Choose a .glb or .gltf file.'), { status: 400 })
    }
    if (!thumbnail) {
      throw Object.assign(new Error('Choose a thumbnail image (JPG, PNG, or WebP).'), { status: 400 })
    }

    const id = slugify(fields.title)
    const model = {
      id,
      ...fields,
      polyCount: 'GLB',
      shape: 'tool',
      scale: 1,
      targetSize: 2.6,
      material: 'baked',
      file: saveAsset(root, 'models', id, file),
      thumbnail: saveAsset(root, 'thumbnails', id, thumbnail),
      source: 'local',
    }
    const models = readCatalog(root)
    models.unshift(model)
    writeCatalog(root, models)
    send(res, 201, { model })
    return
  }

  const match = url.match(/^\/api\/models\/([^/]+)$/)
  if (!match) {
    send(res, 404, { error: 'Not found.' })
    return
  }

  const id = safeId(match[1])
  const models = readCatalog(root)
  const index = models.findIndex((model) => model.id === id)
  if (index === -1) {
    send(res, 404, { error: 'Model not found.' })
    return
  }

  if (req.method === 'DELETE') {
    removePublicAsset(root, models[index].file)
    removePublicAsset(root, models[index].thumbnail)
    models.splice(index, 1)
    writeCatalog(root, models)
    send(res, 200, { ok: true })
    return
  }

  if (req.method === 'PUT') {
    const parts = parseMultipart(await readBody(req), req.headers['content-type'])
    const fields = readMeta(parts)
    const file = partFile(parts, 'file', MODEL_EXT)
    const thumbnail = partFile(parts, 'thumbnail', IMAGE_EXT)
    const next = { ...models[index], ...fields, source: 'local' }

    if (file) {
      removePublicAsset(root, models[index].file)
      next.file = saveAsset(root, 'models', id, file)
      next.polyCount = 'GLB'
      next.material = next.material || 'baked'
    }
    if (thumbnail) {
      removePublicAsset(root, models[index].thumbnail)
      next.thumbnail = saveAsset(root, 'thumbnails', id, thumbnail)
    }

    models[index] = next
    writeCatalog(root, models)
    send(res, 200, { model: next })
    return
  }

  send(res, 405, { error: 'Method not allowed.' })
}

const ASSET_TYPES = {
  '.glb': 'model/gltf-binary',
  '.gltf': 'model/gltf+json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
}

function serveStoredAsset(req, res, root) {
  if (req.method !== 'GET' && req.method !== 'HEAD') return false
  const url = (req.url || '').split('?')[0]
  if (!url.startsWith('/models/') && !url.startsWith('/thumbnails/')) return false
  if (url.includes('..')) {
    send(res, 400, { error: 'Invalid file path.' })
    return true
  }

  const full = path.resolve(publicDir(root), url.replace(/^\//, ''))
  const relative = path.relative(publicDir(root), full)
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    send(res, 400, { error: 'Invalid file path.' })
    return true
  }
  if (!fs.existsSync(full) || !fs.statSync(full).isFile()) {
    send(res, 404, { error: 'File not found.' })
    return true
  }

  const ext = path.extname(full).toLowerCase()
  res.statusCode = 200
  res.setHeader('Content-Type', ASSET_TYPES[ext] || 'application/octet-stream')
  res.setHeader('Cache-Control', 'no-cache')
  if (req.method === 'HEAD') {
    res.end()
    return true
  }
  fs.createReadStream(full).pipe(res)
  return true
}

function attach(middlewares, root) {
  middlewares.use(async (req, res, next) => {
    const url = (req.url || '').split('?')[0]
    if (url.startsWith('/models/') || url.startsWith('/thumbnails/')) {
      serveStoredAsset(req, res, root)
      return
    }
    if (url !== '/api/models' && !url.startsWith('/api/models/')) return next()
    try {
      await handle(req, res, url, root)
    } catch (error) {
      if (res.writableEnded) return
      send(res, error.status || 500, { error: error.message || 'Save failed.' })
    }
  })
}

export function localModelsPlugin(root) {
  const projectRoot = root
  return {
    name: 'local-models',
    configureServer(server) {
      attach(server.middlewares, projectRoot)
    },
    configurePreviewServer(server) {
      attach(server.middlewares, projectRoot)
    },
  }
}
