import { useEffect, useState } from 'react'
import { createPortfolioModel, updatePortfolioModel } from '../lib/modelsApi'

const emptyForm = {
  title: '',
  category: 'Hard Surface',
  year: new Date().getFullYear(),
  software: 'Blender',
  description: '',
  color: '#c45c2a',
  accent: '#f3d7c4',
}

function formFromModel(model) {
  if (!model) return emptyForm
  return {
    title: model.title || '',
    category: model.category || 'Hard Surface',
    year: model.year || new Date().getFullYear(),
    software: model.software || 'Blender',
    description: model.description || '',
    color: model.color || '#c45c2a',
    accent: model.accent || '#f3d7c4',
  }
}

function ModelForm({ editingModel, onSaved }) {
  const isEdit = Boolean(editingModel)
  const [form, setForm] = useState(() => formFromModel(editingModel))
  const [file, setFile] = useState(null)
  const [thumbnail, setThumbnail] = useState(null)
  const [thumbPreview, setThumbPreview] = useState(editingModel?.thumbnail || '')
  const [status, setStatus] = useState('idle')
  const [message, setMessage] = useState('')

  useEffect(() => {
    setForm(formFromModel(editingModel))
    setFile(null)
    setThumbnail(null)
    setThumbPreview(editingModel?.thumbnail || '')
    setStatus('idle')
    setMessage('')
  }, [editingModel])

  function onThumbnailChange(event) {
    const next = event.target.files?.[0] ?? null
    setThumbnail(next)
    setThumbPreview((prev) => {
      if (prev && prev.startsWith('blob:')) URL.revokeObjectURL(prev)
      return next ? URL.createObjectURL(next) : editingModel?.thumbnail || ''
    })
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (!form.title.trim()) {
      setStatus('error')
      setMessage('Title is required.')
      return
    }

    if (!isEdit && !file) {
      setStatus('error')
      setMessage('Choose a .glb or .gltf file.')
      return
    }

    if (!isEdit && !thumbnail) {
      setStatus('error')
      setMessage('Choose a thumbnail image (JPG, PNG, or WebP).')
      return
    }

    setStatus('uploading')
    setMessage(isEdit ? 'Saving into the project…' : 'Saving model and thumbnail into the project…')

    try {
      if (isEdit) {
        await updatePortfolioModel(editingModel, {
          fields: form,
          file,
          thumbnail,
        })
        setStatus('success')
        setMessage('Saved in this project.')
        await onSaved?.()
        return
      }

      await createPortfolioModel({ fields: form, file, thumbnail })

      setStatus('success')
      setMessage('Model and thumbnail saved in this project.')
      setForm(emptyForm)
      setFile(null)
      setThumbnail(null)
      setThumbPreview((prev) => {
        if (prev && prev.startsWith('blob:')) URL.revokeObjectURL(prev)
        return ''
      })
      event.target.reset()
      await onSaved?.()
    } catch (err) {
      console.error(err)
      setStatus('error')
      setMessage(err.message || 'Save failed.')
    }
  }

  function updateField(key) {
    return (event) => setForm((prev) => ({ ...prev, [key]: event.target.value }))
  }

  return (
    <form className="upload-form" onSubmit={handleSubmit}>
      <p className="upload-lead">
        The model file is saved to <code>public/models</code>, the thumbnail to{' '}
        <code>public/thumbnails</code>, and the details to <code>src/data/catalog.json</code>.
        Use a single <code>.glb</code> file so the viewer has everything it needs.
      </p>

      <label>
        <span>Title</span>
        <input
          required
          value={form.title}
          onChange={updateField('title')}
          placeholder="Screw Driver"
        />
      </label>

      <div className="upload-row">
        <label>
          <span>Category</span>
          <input value={form.category} onChange={updateField('category')} />
        </label>
        <label>
          <span>Year</span>
          <input
            type="number"
            value={form.year}
            onChange={updateField('year')}
            min="1990"
            max="2100"
          />
        </label>
      </div>

      <label>
        <span>Software</span>
        <input value={form.software} onChange={updateField('software')} />
      </label>

      <label>
        <span>Description</span>
        <textarea
          rows={3}
          value={form.description}
          onChange={updateField('description')}
          placeholder="Short note about this asset…"
        />
      </label>

      <div className="upload-row">
        <label>
          <span>Accent color</span>
          <input type="color" value={form.color} onChange={updateField('color')} />
        </label>
        <label>
          <span>Soft color</span>
          <input type="color" value={form.accent} onChange={updateField('accent')} />
        </label>
      </div>

      <label className="upload-file">
        <span>
          3D file (.glb / .gltf)
          {isEdit ? ' — optional replace' : ''}
        </span>
        <input
          type="file"
          accept=".glb,.gltf,model/gltf-binary,model/gltf+json"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
        />
      </label>

      <label className="upload-file">
        <span>
          Thumbnail image
          {isEdit ? ' — optional replace' : ' (required)'}
        </span>
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp,image/jpg"
          onChange={onThumbnailChange}
        />
      </label>

      {thumbPreview && (
        <div className="thumb-preview">
          <img src={thumbPreview} alt="Thumbnail preview" />
        </div>
      )}

      <button className="btn btn-primary" type="submit" disabled={status === 'uploading'}>
        {status === 'uploading' ? 'Saving…' : isEdit ? 'Save changes' : 'Save to project'}
      </button>

      {message && (
        <p className={`upload-message is-${status}`} role="status">
          {message}
        </p>
      )}
    </form>
  )
}

export default function ModelUpload({
  onUploaded,
  onClose,
  editingModel,
  onClearEdit,
  writable,
}) {
  const isEdit = Boolean(editingModel)

  return (
    <section className="upload" id="admin">
      <div className="upload-shell">
        <div className="upload-head">
          <div>
            <p className="eyebrow">Project files</p>
            <h2>
              {writable
                ? isEdit
                  ? `Update · ${editingModel.title}`
                  : 'Add a model'
                : 'Models live in this project'}
            </h2>
          </div>
          <div className="admin-bar">
            {writable && isEdit && onClearEdit && (
              <button type="button" className="btn btn-ghost" onClick={onClearEdit}>
                New upload
              </button>
            )}
            {onClose && (
              <button type="button" className="btn btn-ghost" onClick={onClose}>
                Close
              </button>
            )}
          </div>
        </div>

        {writable ? (
          <ModelForm
            key={editingModel?.id || 'create'}
            editingModel={editingModel}
            onSaved={onUploaded}
          />
        ) : (
          <p className="upload-lead">
            This site reads models from <code>public/models</code>, thumbnails from{' '}
            <code>public/thumbnails</code>, and the list in <code>src/data/catalog.json</code>.
            Run <code>npm run dev</code> on your computer and open Admin there to add or replace
            them. A published build only shows the files already saved in the project.
          </p>
        )}
      </div>
    </section>
  )
}
