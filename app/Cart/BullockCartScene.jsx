import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useGLTF, useAnimations } from '@react-three/drei'
import * as THREE from 'three'

/**
 * ------------------------------------------------------------------
 * What this does
 * ------------------------------------------------------------------
 * On scroll, the whole castle+terrain rotates (world spin), while the
 * bullock cart + the two buffaloes stay locked in place and only play
 * their run-cycle / wheel-spin animations WHILE the user is actively
 * scrolling. Because everything else is turning around it, the cart
 * *reads* as if it's circling the castle, even though it never
 * actually moves.
 *
 * ------------------------------------------------------------------
 * Cart grouping
 * ------------------------------------------------------------------
 * The cart, both buffaloes, both wheel rigs, and the driver are all
 * parented in Blender under a single empty called "BullockCart_Root"
 * (see the 16_CHARACTERS collection). We grab that one node from the
 * glTF and everything under it - armatures, skinned meshes, static
 * cart body, driver - comes with it automatically. No per-node name
 * list to keep in sync with future Blender edits.
 *
 * NOTE: there is ALSO an unrelated static prop cart in the scene named
 * "Cart_Bed" / "Cart_Wheel_-1" / "Cart_Wheel_1" (no "Buffalo_" prefix,
 * not parented under BullockCart_Root). That's a different, decorative
 * cart elsewhere in the site and is intentionally left in the world
 * group so it spins with everything else.
 *
 * ------------------------------------------------------------------
 * Camera
 * ------------------------------------------------------------------
 * Instead of hand-converting the Blender camera's position/rotation to
 * three.js coordinates and guessing a lookAt target, we copy the
 * ACTUAL world transform of "Cam7_Entrance_Establishing" baked into
 * the glTF. This is a camera set up in Blender specifically for this
 * shot: centered on the gate's own axis (not diagonal), far enough
 * back to frame the bullock cart, gate, and castle together.
 * Blender's exporter already does the Z-up -> Y-up conversion
 * correctly, so this guarantees the framing matches what was set up
 * in Blender - no more "looking at the wrong wall" issues.
 *
 * IMPORTANT: Blender's glTF exporter does NOT include cameras by
 * default. When exporting, expand the "Data" panel and make sure
 * "Cameras" is checked, or this will silently fall back to the
 * <Canvas> default camera props below.
 */
const CART_ROOT_NAME = 'BullockCart_Root'
const HERO_CAMERA_NAME = 'Cam7_Entrance_Establishing'
const HERO_CAMERA_FOV = 58.7 // matches the 32mm lens / 36mm sensor set up in Blender

// how long (ms) after the last scroll event before we consider
// scrolling "stopped" and freeze the cart's animation again
const SCROLL_STOP_DELAY = 150

export default function CastleScene({ scrollRotations = 1 }) {
  const { scene, animations, cameras } = useGLTF('/castle.glb') // <- point this at your actual file
  const { camera } = useThree()

  // rootRef has to be the common ancestor of BOTH groups below, because the
  // animation mixer resolves every bone by searching downward from whatever
  // object you give useAnimations. If we handed it `scene` (which we empty
  // out below) or just `worldGroup`, the cart's bones would fall outside
  // the search and every action would silently fail to bind.
  const rootRef = useRef()
  const worldGroup = useRef() // castle, terrain, everything else -> this spins
  const cartGroup = useRef()  // cart + buffaloes -> stays fixed, just animates in place

  const { actions } = useAnimations(animations, rootRef)

  // tracks whether we're currently mid-scroll, for gating the cart animation
  const isScrolling = useRef(false)
  const scrollStopTimer = useRef(null)

  useEffect(() => {
    if (!worldGroup.current || !cartGroup.current) return

    // --- cart hierarchy -----------------------------------------------
    // Pull the whole cart out in one shot. .attach() re-parents while
    // preserving world position/rotation/scale, so nothing visually jumps -
    // every child (armatures, skinned meshes, driver, etc.) comes along.
    const cartRoot = scene.getObjectByName(CART_ROOT_NAME)
    if (cartRoot) {
      cartGroup.current.attach(cartRoot)
    } else {
      console.warn(
        `[BullockCart] could not find "${CART_ROOT_NAME}" in the GLB - did you re-export after parenting it in Blender?`
      )
    }

    // --- camera ---------------------------------------------------------
    // Try the named node first, then fall back to whatever cameras the
    // glTF actually parsed, then log everything so we can see what's
    // really in the file if both fail.
    let heroCam = scene.getObjectByName(HERO_CAMERA_NAME)

    if (!heroCam && cameras && cameras.length > 0) {
      console.warn(
        `[BullockCart] "${HERO_CAMERA_NAME}" not found by name, but the GLB has ${cameras.length} camera(s) - using cameras[0]: "${cameras[0].name}"`
      )
      heroCam = cameras[0]
    }

    if (heroCam) {
      heroCam.updateWorldMatrix(true, false)
      camera.position.copy(heroCam.getWorldPosition(new THREE.Vector3()))
      camera.quaternion.copy(heroCam.getWorldQuaternion(new THREE.Quaternion()))
      if (camera.isPerspectiveCamera) {
        camera.fov = HERO_CAMERA_FOV
        camera.updateProjectionMatrix()
      }
    } else {
      // Nothing worked - dump what's actually in the scene so we can see
      // whether cameras were exported at all, and under what names.
      const allNames = []
      scene.traverse((obj) => allNames.push(`${obj.name} (${obj.type})`))
      console.warn(
        `[BullockCart] no camera found in the GLB at all (checked name "${HERO_CAMERA_NAME}" and the parsed cameras[] array, which had ${cameras?.length ?? 0} entries). Falling back to <Canvas> default camera props.`,
        '\nFull node list from the GLB:',
        allNames
      )
    }

    // Whatever's left in `scene` (castle, terrain, all other characters,
    // props, lights that were exported as nodes, etc.) moves into the
    // group that spins on scroll.
    worldGroup.current.attach(scene)

    // Activate every clip that came in with the file (wheel spin + both
    // buffalo run cycles), but start paused - the scroll effect below
    // drives actual playback.
    Object.values(actions).forEach((action) => {
      action?.reset().play()
      if (action) action.paused = true
    })

    return () => {
      Object.values(actions).forEach((action) => action?.stop())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene, cameras, actions, camera])

  // --- scroll -> rotation, and scroll -> "is animating" -------------------
  // Plain window-scroll version. If you're already using drei's
  // <ScrollControls>, see the comment at the bottom of this file for the
  // `useScroll` equivalent instead.
  const scrollTarget = useRef(0)
  const scrollCurrent = useRef(0)

  useEffect(() => {
    const onScroll = () => {
      const max = document.body.scrollHeight - window.innerHeight
      scrollTarget.current = max > 0 ? window.scrollY / max : 0

      // mark as scrolling now, and reset the "stopped scrolling" timer
      isScrolling.current = true
      if (scrollStopTimer.current) clearTimeout(scrollStopTimer.current)
      scrollStopTimer.current = setTimeout(() => {
        isScrolling.current = false
      }, SCROLL_STOP_DELAY)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (scrollStopTimer.current) clearTimeout(scrollStopTimer.current)
    }
  }, [])

  useFrame((_, delta) => {
    // ease toward the real scroll value so the spin doesn't feel jittery
    scrollCurrent.current += (scrollTarget.current - scrollCurrent.current) * Math.min(1, delta * 4)

    if (worldGroup.current) {
      worldGroup.current.rotation.y = -scrollCurrent.current * Math.PI * 2 * scrollRotations
    }

    // Gate the cart's run-cycle / wheel-spin to scrolling only. drei's
    // useAnimations ticks the mixer every frame regardless of this flag,
    // but a `paused` action doesn't advance when the mixer updates it -
    // so flipping `paused` here is enough to freeze/resume playback
    // without touching the mixer itself.
    const shouldAnimate = isScrolling.current
    Object.values(actions).forEach((action) => {
      if (action && action.paused === shouldAnimate) {
        action.paused = !shouldAnimate
      }
    })

    // NOTE: don't call mixer.update() yourself here - drei's useAnimations
    // already ticks the mixer internally every frame. Calling it again
    // will make the run/spin animations play at double speed.
  })

  return (
    <group ref={rootRef}>
      <group ref={worldGroup} />
      <group ref={cartGroup} />
    </group>
  )
}

useGLTF.preload('/castle.glb')

/* ------------------------------------------------------------------------
 * If you'd rather use drei's <ScrollControls> (r3f "scroll experience"
 * pattern) instead of raw window scroll, replace the "scroll -> rotation"
 * effect + useFrame block above with:
 *
 *   import { useScroll } from '@react-three/drei'
 *   const scroll = useScroll()
 *   const lastOffset = useRef(0)
 *   useFrame(() => {
 *     if (worldGroup.current) {
 *       worldGroup.current.rotation.y = scroll.offset * Math.PI * 2 * scrollRotations
 *     }
 *     const moved = Math.abs(scroll.offset - lastOffset.current) > 0.0001
 *     lastOffset.current = scroll.offset
 *     Object.values(actions).forEach((action) => { if (action) action.paused = !moved })
 *   })
 *
 * and wrap <CastleScene /> in <ScrollControls pages={...}><Scroll>...</Scroll></ScrollControls>
 * as usual. `useScroll` gives you offset changes directly, so you don't
 * need the setTimeout-based isScrolling ref at all in that setup.
 * ------------------------------------------------------------------------ */