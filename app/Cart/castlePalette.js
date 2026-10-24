import { Color } from 'three'

// Runtime art direction for the project journey; keep the GLB untouched.
const palette = [
  [/^Env_GrassGreen|Rocky_Hilltop/, '#687360'],
  [/^Env_LeafGreen/, '#586c60'],
  [/^Env_BushGreen/, '#657462'],
  [/^Env_Water/, '#426b70'],
  [/^Env_RoofTile/, '#956a50'],
  [/^Env_DirtRoad/, '#a08c6d'],
  [/^Env_RockGray/, '#85877d'],
  [/^Env_.*Stone/, '#b4ac98'],
  [/^Env_.*Wood|^Env_TrunkBrown|^Env_TimberWall/, '#82684f'],
  [/^Env_Gold|^Env_Hay/, '#b99b62'],
]

export function createJourneyMaterial(original) {
  const material = original.clone()
  if (!material.color) return material
  const match = palette.find(([pattern]) => pattern.test(material.name))
  if (match) {
    // Preserve a little of the source's per-object variation.
    material.color.lerp(new Color(match[1]), 0.9)
  } else if (/^Env_|^Clothing_/.test(material.name) && !/^Env_Flame/.test(material.name)) {
    const hsl = material.color.getHSL({ h: 0, s: 0, l: 0 })
    material.color.setHSL(hsl.h, hsl.s * 0.55, hsl.l)
  }
  if (/^Env_Water/.test(material.name)) {
    material.roughness = 0.38
    material.metalness = 0.12
  }
  return material
}

export function applyJourneyPalette(root) {
  const originals = []
  const clones = new Map()
  const clone = (material) => {
    if (!clones.has(material)) clones.set(material, createJourneyMaterial(material))
    return clones.get(material)
  }
  root.traverse((object) => {
    if (!object.isMesh || !object.material) return
    originals.push([object, object.material])
    object.material = Array.isArray(object.material)
      ? object.material.map(clone)
      : clone(object.material)
  })
  return () => {
    originals.forEach(([object, material]) => { object.material = material })
    clones.forEach((material) => material.dispose())
  }
}
