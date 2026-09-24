import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Center, Float, RoundedBox, useGLTF } from '@react-three/drei'
import * as THREE from 'three'

function Surface({ color, material = 'matte' }) {
  if (material === 'glass') {
    return (
      <meshPhysicalMaterial
        color={color}
        roughness={0.05}
        metalness={0.05}
        transmission={0.72}
        thickness={1.2}
        ior={1.5}
        clearcoat={1}
        clearcoatRoughness={0.08}
        envMapIntensity={1.4}
      />
    )
  }

  if (material === 'metal') {
    return (
      <meshPhysicalMaterial
        color={color}
        roughness={0.22}
        metalness={0.92}
        clearcoat={0.55}
        clearcoatRoughness={0.2}
        envMapIntensity={1.2}
      />
    )
  }

  if (material === 'plastic') {
    return (
      <meshPhysicalMaterial
        color={color}
        roughness={0.28}
        metalness={0.05}
        clearcoat={0.9}
        clearcoatRoughness={0.15}
      />
    )
  }

  if (material === 'clay') {
    return (
      <meshStandardMaterial color={color} roughness={0.82} metalness={0.02} />
    )
  }

  return (
    <meshStandardMaterial color={color} roughness={0.62} metalness={0.08} />
  )
}

function ArchMesh({ color, scale, material }) {
  return (
    <group scale={scale}>
      <mesh position={[-0.55, 0, 0]} castShadow>
        <boxGeometry args={[0.35, 1.6, 0.4]} />
        <Surface color={color} material={material} />
      </mesh>
      <mesh position={[0.55, 0, 0]} castShadow>
        <boxGeometry args={[0.35, 1.6, 0.4]} />
        <Surface color={color} material={material} />
      </mesh>
      <mesh position={[0, 0.7, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.55, 0.55, 1.1, 48, 1, false, 0, Math.PI]} />
        <Surface color={color} material={material} />
      </mesh>
    </group>
  )
}

function VesselMesh({ color, scale, material }) {
  const points = useMemo(
    () =>
      [
        [0.05, -0.7],
        [0.55, -0.55],
        [0.65, -0.1],
        [0.45, 0.35],
        [0.35, 0.65],
        [0.4, 0.75],
      ].map(([x, y]) => new THREE.Vector2(x, y)),
    [],
  )

  return (
    <group scale={scale}>
      <mesh position={[0, -0.2, 0]} castShadow>
        <latheGeometry args={[points, 64]} />
        <Surface color={color} material={material} />
      </mesh>
    </group>
  )
}

function GltfModel({ url, targetSize = 2.4 }) {
  const { scene } = useGLTF(url)
  const cloned = useMemo(() => scene.clone(true), [scene])

  const fitScale = useMemo(() => {
    const box = new THREE.Box3().setFromObject(cloned)
    const size = box.getSize(new THREE.Vector3())
    const maxDim = Math.max(size.x, size.y, size.z)
    return maxDim > 0 ? targetSize / maxDim : 1
  }, [cloned, targetSize])

  useLayoutEffect(() => {
    cloned.traverse((obj) => {
      if (obj.isMesh) {
        obj.castShadow = true
        obj.receiveShadow = true
      }
    })
  }, [cloned])

  return (
    <Center>
      <primitive object={cloned} scale={fitScale} />
    </Center>
  )
}

function ProceduralModel({ model }) {
  const { shape, color, scale, material } = model

  return (
    <>
      {shape === 'icosahedron' && (
        <mesh scale={scale} castShadow>
          <icosahedronGeometry args={[1, 0]} />
          <Surface color={color} material={material} />
        </mesh>
      )}
      {shape === 'torus' && (
        <mesh scale={scale} rotation={[Math.PI / 3.2, 0.2, 0]} castShadow>
          <torusGeometry args={[0.85, 0.26, 48, 96]} />
          <Surface color={color} material={material} />
        </mesh>
      )}
      {shape === 'roundedBox' && (
        <RoundedBox
          args={[1.4, 1.4, 1.4]}
          radius={0.24}
          smoothness={8}
          scale={scale}
          castShadow
        >
          <Surface color={color} material={material} />
        </RoundedBox>
      )}
      {shape === 'cone' && (
        <mesh scale={scale} position={[0, -0.15, 0]} castShadow>
          <coneGeometry args={[0.68, 2, 7]} />
          <Surface color={color} material={material} />
        </mesh>
      )}
      {shape === 'arch' && (
        <ArchMesh color={color} scale={scale} material={material} />
      )}
      {shape === 'vessel' && (
        <VesselMesh color={color} scale={scale} material={material} />
      )}
    </>
  )
}

export default function ModelMesh({ model, autoRotate = true, floating = true }) {
  const group = useRef()

  useFrame((_, delta) => {
    if (autoRotate && group.current) {
      group.current.rotation.y += delta * 0.28
    }
  })

  const content = (
    <group ref={group}>
      {model.file ? (
        <GltfModel url={model.file} targetSize={model.targetSize ?? 2.4} />
      ) : (
        <ProceduralModel model={model} />
      )}
    </group>
  )

  if (!floating) return content

  return (
    <Float speed={1.2} rotationIntensity={0.12} floatIntensity={0.28}>
      {content}
    </Float>
  )
}

// Preload is handled per-model when the viewer mounts with a file URL.
