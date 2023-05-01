import { Stats, OrbitControls, Environment, Text } from '@react-three/drei'
import { Canvas, useFrame, useLoader } from '@react-three/fiber'
import { useRef } from 'react'
import { useControls } from 'leva'
import { BackSide, TextureLoader } from 'three'

const Model = () => {

  const cloudRef = useRef() ;
  const earthRef = useRef() ;
  const starRef = useRef() ;

  const [earthmap, bumpMap, cloudMetarial, galaxy] = useLoader(TextureLoader, [
    './textures/earthmap1k.jpg',
    './textures/earthbump.jpg',
    './textures/earthCloud.png',
    './textures/galaxy.png',
  ]);

  useFrame(()=>{
    cloudRef.current.rotation.y -= 0.0004 ;
    starRef.current.rotation.y -= 0.0002;
    earthRef.current.rotation.y -= 0.0003;
  })

  return (
    <>
      <mesh ref={earthRef}>
        <sphereGeometry args={[0.6, 32, 32]} />
        <meshPhongMaterial
          roughness={1}
          metalness={0}
          map={earthmap}
          bumpMap={bumpMap}
          bumpScale={0.6}
        />
      </mesh>
      <mesh ref={cloudRef}>
        <sphereGeometry args={[0.63, 32, 32]} />
        <meshPhongMaterial
          transparent
          map={cloudMetarial}
        />
      </mesh>
      <mesh ref={starRef}>
        <sphereGeometry args={[80, 64, 64]} />
        <meshPhongMaterial
          side={BackSide}
          map={galaxy}
        />
      </mesh>
    </>
  )
}


export default function App() {
  const { focusDistance, focalLength, bokehScale } = useControls({
    focusDistance: {
      min: 0,
      max: 4,
      value: 2
    },
    focalLength: {
      min: 0,
      max: 1,
      value: 0.1
    },
    bokehScale: {
      min: 0,
      max: 10,
      value: 2
    }
  })
  return (
    <Canvas camera={{ position: [0, 0, 2], fov:60, far: 1000, near: 0.1 }} gl={{ logarithmicDepthBuffer: true }}>
      <Environment
        // preset="sunset"
        files="./img/industrial_sunset_02_1k.hdr"
        blur={0.7}
        background
      />
      <orthographicCamera/>
      <ambientLight intensity={0.2} color={0xffffff} />
      <pointLight position={[5, 3, 5]} color={0xffffff} rotateY={Math.PI/2}/>
      <Model />
      <OrbitControls />
    </Canvas>
  )
}
