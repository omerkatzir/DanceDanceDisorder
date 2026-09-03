// Test3 scene and KidTextures importer values, converted to world units.
// Sprite pivots are measured from the bottom in Unity; centers below a hinge
// are (pivotY - .5) * spriteHeight. Preserve collider offsets separately.
export const unityLimbs = {
  pixelsToWorld: 0.75 / 300,
  forearm: {
    width: 0.593333423 * 0.75,
    height: 2.233333826 * 0.75,
    centerFromElbow: 0.826333821 * 0.75,
    spriteHeight: 670 * 0.75 / 300,
    pivotY: 0.87,
  },
  shin: {
    width: 0.63 * 0.75,
    height: 2.353333235 * 0.75,
    centerFromKnee: 0.894266486 * 0.75,
    footFromKneeY: 1.925717711 * 0.75,
    leftFootFromKneeX: -0.19647564 * 0.75,
    rightFootFromKneeX: 0.148976669 * 0.75,
    spriteHeight: 706 * 0.75 / 300,
    pivotY: 0.88,
  },
};
