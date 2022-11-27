import { useGLTF, useBVH, useHelper } from '@react-three/drei'
import * as THREE from 'three'
import { MeshBVHVisualizer } from 'three-mesh-bvh'
import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import useKeyboard from './useKeyboard'

let player
let fwdPressed = false,
  bkdPressed = false,
  lftPressed = false,
  rgtPressed = false
const physicsSteps = 5

const gravity = -30
let tempVector = new THREE.Vector3()
let tempVector2 = new THREE.Vector3()
let tempBox = new THREE.Box3()
let tempMat = new THREE.Matrix4()
let tempSegment = new THREE.Line3()

export default function Arena() {
  const collider = useRef()
  const state = useThree()
  const { nodes, materials } = useGLTF('./models/scene.glb')
  useBVH(collider)
  useHelper(collider, MeshBVHVisualizer, 10)
  const keyboard = useKeyboard()
  const playerIsOnGround = useRef(false)
  const playerVelocity = useRef(new THREE.Vector3())
  const playerDirection = useRef(new THREE.Vector3())

  useEffect(() => {
    console.log('creating player')
    player = new THREE.Mesh(new RoundedBoxGeometry(1.0, 2.0, 1.0, 10, 0.5), new THREE.MeshStandardMaterial())
    player.geometry.translate(0, -0.5, 0)
    player.capsuleInfo = {
      radius: 0.5,
      segment: new THREE.Line3(new THREE.Vector3(), new THREE.Vector3(0, -1.0, 0.0))
    }
    player.castShadow = true
    player.receiveShadow = true
    player.material.shadowSide = 2
    player.position.y = 5
    state.scene.add(player)
  }, [state.scene])

  function controls() {
    lftPressed = keyboard['KeyA']
    rgtPressed = keyboard['KeyD']
    fwdPressed = keyboard['KeyW']
    bkdPressed = keyboard['sKeyS']
    if (playerIsOnGround.current) {
      if (keyboard['Space']) {
        playerVelocity.current.y = 15
      }
    }
  }
  function getForwardVector(state) {
    state.camera.getWorldDirection(playerDirection.current)
    playerDirection.current.y = 0
    playerDirection.current.normalize()
    return playerDirection.current
  }
  function getSideVector(state) {
    state.camera.getWorldDirection(playerDirection.current)
    playerDirection.current.y = 0
    playerDirection.current.normalize()
    playerDirection.current.cross(state.camera.up)
    return playerDirection.current
  }

  function updatePlayer(state, delta) {
    const speedDelta = delta * (playerIsOnGround.current ? 25 : 8)

    if (fwdPressed) {
      playerVelocity.current.add(getForwardVector(state).multiplyScalar(speedDelta))
    }

    if (bkdPressed) {
      playerVelocity.current.add(getForwardVector(state).multiplyScalar(-speedDelta))
    }

    if (lftPressed) {
      playerVelocity.current.add(getSideVector(state).multiplyScalar(-speedDelta))
    }

    if (rgtPressed) {
      playerVelocity.current.add(getSideVector(state).multiplyScalar(speedDelta))
    }
    
    const capsuleInfo = player.capsuleInfo
    tempBox.makeEmpty()
    tempMat.copy(collider.current.matrixWorld).invert()
    tempSegment.copy(capsuleInfo.segment)

    // get the position of the capsule in the local space of the collider
    tempSegment.start.applyMatrix4(player.matrixWorld).applyMatrix4(tempMat)
    tempSegment.end.applyMatrix4(player.matrixWorld).applyMatrix4(tempMat)

    // get the axis aligned bounding box of the capsule
    tempBox.expandByPoint(tempSegment.start)
    tempBox.expandByPoint(tempSegment.end)

    tempBox.min.addScalar(-capsuleInfo.radius)
    tempBox.max.addScalar(capsuleInfo.radius)

    collider.current.geometry.boundsTree.shapecast({
      intersectsBounds: (box) => box.intersectsBox(tempBox),
      intersectsTriangle: (tri) => {
        // check if the triangle is intersecting the capsule and adjust the
        // capsule position if it is.
        const triPoint = tempVector
        const capsulePoint = tempVector2

        const distance = tri.closestPointToSegment(tempSegment, triPoint, capsulePoint)
        if (distance < capsuleInfo.radius) {
          //console.log(distance)
          const depth = capsuleInfo.radius - distance
          const direction = capsulePoint.sub(triPoint).normalize()

          tempSegment.start.addScaledVector(direction, depth)
          tempSegment.end.addScaledVector(direction, depth)
        }
      }
    })
    const newPosition = tempVector
    newPosition.copy(tempSegment.start).applyMatrix4(collider.current.matrixWorld)

    // check how much the collider was moved
    const deltaVector = tempVector2
    deltaVector.subVectors(newPosition, player.position)

    // if the player was primarily adjusted vertically we assume it's on something we should consider ground
    playerIsOnGround.current = deltaVector.y > Math.abs(delta * playerVelocity.current.y * 0.25)

    const offset = Math.max(0.0, deltaVector.length() - 1e-5)
    deltaVector.normalize().multiplyScalar(offset)

    // // // adjust the player model
    player.position.add(deltaVector)

    if (!playerIsOnGround.current) {
      playerVelocity.current.y += playerIsOnGround.current ? 0 : delta * gravity
      //deltaVector.normalize()
      //wplayerVelocity.current.addScaledVector(deltaVector, -deltaVector.dot(playerVelocity.current))
    } else {
      // playerVelocity.current.y = 0
      //console.log(playerIsOnGround)
      //playerVelocity.current.set(0, 0, 0)
    }

    player.position.addScaledVector(playerVelocity.current, delta)

    if (player.position.y < -25) {
      playerVelocity.current.set(0, 0, 0)
      player.position.set(0, 5, 0)
    }

    //player.updateMatrixWorld()
  }

  useFrame((state, delta) => {
    delta = Math.min(delta, 0.1)
    controls()
    for (let i = 0; i < physicsSteps; i++) {
      updatePlayer(state, delta / physicsSteps)
    }
    state.camera.position.copy(player.position)
  })

  return (
    <>
      {/* <group dispose={null}>
        <mesh ref={mesh} geometry={nodes.Cube004.geometry} material={materials['Material.001']} position={[7.68, -5.59, 26.38]} scale={0.5} castShadow receiveShadow material-envMapIntensity={0.4} />
      </group> */}
      <group dispose={null}>
        <mesh ref={collider} castShadow receiveShadow geometry={nodes.Cone.geometry} material={materials['Material.001']} position={[17.93, 3.72, -21.95]} scale={3.71} />
      </group>
      {/* <Player mouseTime={mouseTime} worldOctree={worldOctree} /> */}
    </>
  )
}
