import { Component, Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { ContactShadows, Environment, OrbitControls } from '@react-three/drei'
import ModelMesh from './ModelMesh'

class ViewerErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error) {
    console.error('Model viewer error:', error)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="viewer-fallback">
          <p>Model could not be loaded.</p>
        </div>
      )
    }
    return this.props.children
  }
}

function StudioLights() {
  return (
    <>
      <ambientLight intensity={0.55} />
      <directionalLight
        castShadow
        position={[5, 8, 4]}
        intensity={1.35}
        shadow-mapSize={[1024, 1024]}
      />
      <directionalLight position={[-4, 3, -2]} intensity={0.45} color="#c9d7ea" />
      <spotLight
        position={[0, 8, 2]}
        angle={0.45}
        penumbra={0.75}
        intensity={0.9}
        color="#ffffff"
      />
    </>
  )
}

function Scene({ model, autoRotate, enableOrbit, floating }) {
  return (
    <>
      <StudioLights />
      <Suspense fallback={null}>
        <ModelMesh model={model} autoRotate={autoRotate} floating={floating} />
        <Environment preset="studio" environmentIntensity={0.85} />
      </Suspense>
      <ContactShadows
        position={[0, -1.45, 0]}
        opacity={0.35}
        scale={12}
        blur={3.2}
        far={4}
        color="#1a2230"
      />
      {enableOrbit && (
        <OrbitControls
          makeDefault
          enablePan={false}
          minPolarAngle={Math.PI / 3.2}
          maxPolarAngle={Math.PI / 1.65}
          minDistance={2}
          maxDistance={7}
          enableDamping
          dampingFactor={0.06}
        />
      )}
    </>
  )
}

export default function ModelViewer({
  model,
  autoRotate = true,
  enableOrbit = true,
  floating = true,
  className = '',
  cameraPosition = [0, 0.55, 4.1],
}) {
  return (
    <div className={`viewer ${className}`}>
      <ViewerErrorBoundary>
        <Canvas
          shadows
          camera={{ position: cameraPosition, fov: 38 }}
          dpr={[1, 1.75]}
          gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        >
          <Scene
            model={model}
            autoRotate={autoRotate}
            enableOrbit={enableOrbit}
            floating={floating}
          />
        </Canvas>
      </ViewerErrorBoundary>
    </div>
  )
}
