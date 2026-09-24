async function request(url, options) {
  const response = await fetch(url, options)
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.error || 'Could not save the model in this project.')
  }
  return data
}

function buildBody({ fields, file, thumbnail }) {
  const body = new FormData()
  body.append(
    'meta',
    JSON.stringify({
      title: fields.title,
      category: fields.category,
      year: fields.year,
      software: fields.software,
      description: fields.description,
      color: fields.color,
      accent: fields.accent,
    }),
  )
  if (file) body.append('file', file)
  if (thumbnail) body.append('thumbnail', thumbnail)
  return body
}

export async function createPortfolioModel({ fields, file, thumbnail }) {
  return request('/api/models', {
    method: 'POST',
    body: buildBody({ fields, file, thumbnail }),
  })
}

export async function updatePortfolioModel(model, { fields, file, thumbnail }) {
  if (!model?.id) throw new Error('Missing model id.')
  return request(`/api/models/${encodeURIComponent(model.id)}`, {
    method: 'PUT',
    body: buildBody({ fields, file, thumbnail }),
  })
}

export async function deletePortfolioModel(model) {
  if (!model?.id) throw new Error('Missing model id.')
  return request(`/api/models/${encodeURIComponent(model.id)}`, {
    method: 'DELETE',
  })
}
