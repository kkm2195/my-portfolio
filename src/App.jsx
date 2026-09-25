import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { studio } from './data/models'
import { useModels } from './hooks/useModels'
import { deletePortfolioModel } from './lib/modelsApi'
import ModelViewer from './components/ModelViewer'
import ModelUpload from './components/ModelUpload'
import './styles/App.css'

const ease = [0.22, 1, 0.36, 1]

function selectModel(id, setActiveId) {
  setActiveId(id)
  document.getElementById('viewer')?.scrollIntoView({
    behavior: 'smooth',
    block: 'start',
  })
}

export default function App() {
  const { models, loading, error, writable, refresh } = useModels()
  const [activeId, setActiveId] = useState(null)
  const [showAdmin, setShowAdmin] = useState(false)
  const [editingModel, setEditingModel] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  useEffect(() => {
    if (!models.length) {
      setActiveId(null)
      return
    }
    setActiveId((current) => {
      if (current && models.some((model) => model.id === current)) return current
      return models[0].id
    })
  }, [models])

  function openAdmin(event) {
    event.preventDefault()
    setEditingModel(null)
    setShowAdmin(true)
  }

  function openEditModel(event, model) {
    event.preventDefault()
    event.stopPropagation()
    if (!writable) return
    setEditingModel(model)
    setShowAdmin(true)
  }

  async function handleDeleteModel(event, model) {
    event.preventDefault()
    event.stopPropagation()

    if (!writable) return

    const ok = window.confirm(
      `Delete “${model.title}”? This removes it from the project catalog and deletes its files.`,
    )
    if (!ok) return

    setDeletingId(model.id)
    try {
      await deletePortfolioModel(model)
      const next = await refresh({ silent: true })
      if (activeId === model.id) {
        setActiveId(next?.[0]?.id ?? null)
      }
    } catch (err) {
      console.error(err)
      window.alert(err.message || 'Delete failed.')
    } finally {
      setDeletingId(null)
    }
  }

  useEffect(() => {
    if (!showAdmin) return
    const timer = window.setTimeout(() => {
      document.getElementById('admin')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    }, 50)
    return () => window.clearTimeout(timer)
  }, [showAdmin])

  const active = useMemo(
    () => models.find((m) => m.id === activeId) ?? models[0] ?? null,
    [models, activeId],
  )
  const activeIndex = Math.max(
    0,
    models.findIndex((m) => m.id === activeId),
  )

  function showNeighbor(direction) {
    if (models.length < 2) return
    const next = (activeIndex + direction + models.length) % models.length
    setActiveId(models[next].id)
  }

  return (
    <div className="app">
      <div className="grain" aria-hidden="true" />
      <div className="orb orb-a" aria-hidden="true" />
      <div className="orb orb-b" aria-hidden="true" />

      <header className="nav">
        <a className="brand" href="#top">
          <span className="brand-mark-mini">{studio.shortName}</span>
          <span className="brand-text">{studio.name}</span>
        </a>
        <nav className="nav-links">
          <a href="#work">Work</a>
          <a href="#viewer">Viewer</a>
          <a href="#experience">Experience</a>
          <a href="#about">About</a>
          <button type="button" className="nav-link-btn" onClick={openAdmin}>
            Admin
          </button>
        </nav>
        <a className="nav-cta" href={`mailto:${studio.email}`}>
          Let’s talk
        </a>
      </header>

      <section className="hero" id="top">
        <div className="hero-mesh" aria-hidden="true" />
        {models[0] && (
          <div className="hero-stage" aria-hidden="true">
            <ModelViewer
              model={models[0]}
              autoRotate
              enableOrbit={false}
              className="hero-viewer"
              cameraPosition={[1.35, 0.85, 4.5]}
            />
          </div>
        )}

        <div className="hero-copy">
          <motion.p
            className="brand-mark"
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease }}
          >
            {studio.name}
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.85, delay: 0.1, ease }}
          >
            {studio.tagline}
          </motion.h1>
          <motion.p
            className="hero-support"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, delay: 0.18, ease }}
          >
            {studio.heroSupport}
          </motion.p>
          <motion.div
            className="cta-row"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.28, ease }}
          >
            <a className="btn btn-primary" href="#work">
              View work
            </a>
            <a className="btn btn-ghost" href="#viewer">
              Open 3D viewer
            </a>
          </motion.div>
        </div>

        <motion.div
          className="hero-meta"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.55, duration: 0.8 }}
        >
          <span>7+ years</span>
          <span className="dot" />
          <span>AR · VR · XR</span>
          <span className="dot" />
          <span>Chennai</span>
        </motion.div>

        <motion.a
          className="scroll-cue"
          href="#work"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.8 }}
        >
          Scroll
          <span />
        </motion.a>
      </section>

      <section className="roles" aria-label="Focus areas">
        <div className="roles-track">
          {[...studio.roles, ...studio.roles].map((role, i) => (
            <span key={`${role}-${i}`}>{role}</span>
          ))}
        </div>
      </section>

      {error && (
        <div className="banner-error" role="alert">
          {error}
        </div>
      )}

      <div className="data-status" aria-live="polite">
        <span>
          {`Project files · ${models.length} model${models.length === 1 ? '' : 's'}`}
        </span>
        <button
          type="button"
          className="data-refresh"
          onClick={() => refresh()}
          disabled={loading}
        >
          {loading ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      <section className="work" id="work">
        <div className="section-head">
          <div>
            <p className="eyebrow">Selected work</p>
            <h2>
              Models built to
              <em> be explored</em>
            </h2>
          </div>
          <p className="section-lead">
            {models.length
              ? 'A living collection of realtime-ready assets. Pick a piece, orbit it, and feel the surface.'
              : 'No models saved in the project yet. Open Admin while running locally to add a .glb and thumbnail.'}
          </p>
        </div>

        {models.length ? (
          <div className="work-rail">
            {models.map((model, index) => {
              const isActive = model.id === activeId
              return (
                <motion.div
                  key={model.id}
                  className={`work-tile ${isActive ? 'is-active' : ''}`}
                  style={{
                    '--tile': model.color,
                    '--tile-soft': model.accent,
                  }}
                  initial={{ opacity: 0, y: 36 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.6, delay: index * 0.07, ease }}
                  whileHover={{ y: -10 }}
                >
                  <button
                    type="button"
                    className="work-tile-main"
                    onClick={() => selectModel(model.id, setActiveId)}
                  >
                    <div className="tile-visual" aria-hidden="true">
                      {model.thumbnail ? (
                        <img
                          className="tile-thumb"
                          src={model.thumbnail}
                          alt=""
                          loading="lazy"
                        />
                      ) : (
                        <>
                          <span className={`shape-mark shape-${model.shape || 'tool'}`} />
                          <span className="tile-glow" />
                        </>
                      )}
                      <span className="tile-overlay" />
                    </div>
                    <div className="tile-body">
                      <span className="tile-index">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <h3>{model.title}</h3>
                      <p>
                        {model.category} · {model.year}
                      </p>
                    </div>
                    <span className="tile-action">
                      Inspect
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                        <path
                          d="M3 8h10M9 4l4 4-4 4"
                          stroke="currentColor"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                  </button>

                  {writable && (
                    <div className="tile-admin-actions">
                      <button
                        type="button"
                        className="tile-edit"
                        onClick={(event) => openEditModel(event, model)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="tile-delete"
                        disabled={deletingId === model.id}
                        onClick={(event) => handleDeleteModel(event, model)}
                      >
                        {deletingId === model.id ? 'Deleting…' : 'Delete'}
                      </button>
                    </div>
                  )}
                </motion.div>
              )
            })}
          </div>
        ) : (
          <div className="empty-collection">
            <p>Collection is empty.</p>
            <button type="button" className="btn btn-primary" onClick={openAdmin}>
              Upload a model
            </button>
          </div>
        )}
      </section>

      <section className="viewer-section" id="viewer">
        <div className="viewer-shell">
          <div className="viewer-toolbar">
            <div>
              <p className="eyebrow">Interactive studio</p>
              <h2>
                Get closer to
                <em> the craft</em>
              </h2>
            </div>
            {models.length > 0 && (
              <div className="viewer-switcher" role="tablist" aria-label="Models">
                {models.map((model, index) => (
                  <button
                    key={model.id}
                    type="button"
                    role="tab"
                    aria-selected={model.id === activeId}
                    className={model.id === activeId ? 'is-active' : ''}
                    onClick={() => setActiveId(model.id)}
                    title={model.title}
                  >
                    {String(index + 1).padStart(2, '0')}
                  </button>
                ))}
              </div>
            )}
          </div>

          {active ? (
            <>
              <div className="viewer-stage">
                <div className="viewer-backdrop" aria-hidden="true" />
                <AnimatePresence mode="wait">
                  <motion.div
                    key={active.id}
                    className="viewer-frame"
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.03 }}
                    transition={{ duration: 0.45, ease }}
                  >
                    <ModelViewer model={active} autoRotate enableOrbit />
                  </motion.div>
                </AnimatePresence>

                {models.length > 1 && (
                  <>
                    <button
                      type="button"
                      className="viewer-nav viewer-nav-prev"
                      aria-label="Previous model"
                      onClick={() => showNeighbor(-1)}
                    >
                      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                        <path
                          d="M11 4L6 9l5 5"
                          stroke="currentColor"
                          strokeWidth="1.7"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                    <button
                      type="button"
                      className="viewer-nav viewer-nav-next"
                      aria-label="Next model"
                      onClick={() => showNeighbor(1)}
                    >
                      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                        <path
                          d="M7 4l5 5-5 5"
                          stroke="currentColor"
                          strokeWidth="1.7"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  </>
                )}

                <div className="viewer-chrome">
                  <span>Drag to orbit</span>
                  <span>
                    {String(activeIndex + 1).padStart(2, '0')} /{' '}
                    {String(models.length).padStart(2, '0')}
                  </span>
                  <span>Scroll to zoom</span>
                </div>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={active.id}
                  className="viewer-details"
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.4, ease }}
                >
                  <div className="detail-main">
                    <p className="eyebrow">{active.category}</p>
                    <h3>{active.title}</h3>
                    <p>{active.description}</p>
                    {writable && (
                      <div className="viewer-admin-actions">
                        <button
                          type="button"
                          className="btn btn-ghost viewer-delete"
                          onClick={(event) => openEditModel(event, active)}
                        >
                          Edit model
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost viewer-delete"
                          disabled={deletingId === active.id}
                          onClick={(event) => handleDeleteModel(event, active)}
                        >
                          {deletingId === active.id ? 'Deleting…' : 'Delete model'}
                        </button>
                      </div>
                    )}
                  </div>
                  <dl className="specs">
                    <div>
                      <dt>Year</dt>
                      <dd>{active.year}</dd>
                    </div>
                    <div>
                      <dt>Polygons</dt>
                      <dd>{active.polyCount}</dd>
                    </div>
                    <div>
                      <dt>Pipeline</dt>
                      <dd>{active.software}</dd>
                    </div>
                    <div>
                      <dt>Surface</dt>
                      <dd>{active.material}</dd>
                    </div>
                  </dl>
                </motion.div>
              </AnimatePresence>
            </>
          ) : (
            <div className="empty-collection viewer-empty">
              <p>No model selected. Upload one from Admin to inspect it here.</p>
            </div>
          )}
        </div>
      </section>

      {showAdmin && (
        <ModelUpload
          writable={writable}
          editingModel={editingModel}
          onClearEdit={() => setEditingModel(null)}
          onClose={() => {
            setShowAdmin(false)
            setEditingModel(null)
          }}
          onUploaded={async () => {
            const next = await refresh({ silent: true })
            if (editingModel) {
              const updated = next?.find((m) => m.id === editingModel.id)
              if (updated) setActiveId(updated.id)
              setEditingModel(null)
            } else if (next?.[0]?.id) {
              setActiveId(next[0].id)
            }
            document.getElementById('viewer')?.scrollIntoView({
              behavior: 'smooth',
              block: 'start',
            })
          }}
        />
      )}

      <section className="experience" id="experience">
        <div className="section-head experience-head">
          <div>
            <p className="eyebrow">Career</p>
            <h2>
              Experience that
              <em> ships</em>
            </h2>
          </div>
          <div className="award-chip">
            <span className="award-label">Award</span>
            <strong>{studio.award.title}</strong>
            <span>
              {studio.award.year} · {studio.award.category}
            </span>
          </div>
        </div>

        <div className="experience-list">
          {studio.experience.map((job, index) => (
            <motion.article
              key={job.company}
              className="experience-item"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.55, delay: index * 0.08, ease }}
            >
              <div className="experience-meta">
                <p className="experience-period">{job.period}</p>
                <h3>{job.role}</h3>
                <p className="experience-company">{job.company}</p>
              </div>
              <ul>
                {job.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </motion.article>
          ))}
        </div>
      </section>

      <section className="about" id="about">
        <div className="about-grid">
          <div className="about-brand">
            <p className="eyebrow">About</p>
            <h2>
              Built for
              <em> clarity</em>
            </h2>
            <p className="about-title">{studio.title}</p>
          </div>
          <div className="about-copy">
            <p>{studio.blurb}</p>
            <p className="about-award-note">{studio.award.note}</p>

            <div className="skill-grid">
              {studio.skillGroups.map((group) => (
                <div key={group.label} className="skill-card">
                  <h4>{group.label}</h4>
                  <p>{group.items}</p>
                </div>
              ))}
            </div>

            <div className="about-extra">
              <div>
                <h4>Education</h4>
                <p>{studio.education.degree}</p>
                <p className="muted">
                  {studio.education.school} · {studio.education.years}
                </p>
              </div>
              <div>
                <h4>Certifications</h4>
                <p>{studio.certifications.join(' · ')}</p>
              </div>
            </div>

            <div className="about-contact">
              <span>{studio.location}</span>
              <a href={`mailto:${studio.email}`}>{studio.email}</a>
              <a href={studio.phoneHref}>{studio.phone}</a>
              <a href={studio.workSamples} target="_blank" rel="noreferrer">
                Work samples
              </a>
            </div>
          </div>
        </div>
      </section>

      <footer className="footer">
        <span className="footer-brand">{studio.name}</span>
        <span>Senior 3D Artist · AR / VR / XR</span>
      </footer>
    </div>
  )
}
