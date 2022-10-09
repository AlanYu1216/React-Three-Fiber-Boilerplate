import { Stats, OrbitControls, Environment } from '@react-three/drei'
import { useLoader } from '@react-three/fiber'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'

export default function App() {
  const gltf = useLoader(GLTFLoader, './models/monkey.glb')

  return (
    <>
      <Environment files="./img/venice_sunset_1k.hdr" background />
      <directionalLight position={[3.3, 1.0, 4.4]} castShadow={true} />
      <primitive object={gltf.scene} position={[0, 1, 0]} children-0-castShadow={true} />
      <OrbitControls target={[0, 1, 0]} autoRotate />
      <axesHelper args={[5]} />
      <Stats />
    </>
  )
}
