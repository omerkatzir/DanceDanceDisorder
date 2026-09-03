export interface Settings {
  sprites: boolean;
  head: boolean; headMass: number; selfCollision: boolean; legCollision: boolean;
  force: number; holdRatio: number; gravity: number; linearDamping: number;
  angularDamping: number; torsoMass: number; armMass: number; legMass: number;
  limits: boolean; armLimit: number; legLimit: number; jointFriction: number;
  application: 'torso' | 'distributed'; localForce: boolean; forceHeight: number;
  hz: number; velocityIterations: number; positionIterations: number;
  colliders: boolean; centers: boolean; anchors: boolean; constraints: boolean;
}
export const defaults: Settings = {
  sprites: true,
  head: true, headMass: 1, selfCollision: true, legCollision: true,
  force: 36, holdRatio: 1, gravity: 5, linearDamping: 0.12,
  angularDamping: 0.18, torsoMass: 1, armMass: 1, legMass: 1,
  limits: false, armLimit: 150, legLimit: 100, jointFriction: 0,
  application: 'torso', localForce: false, forceHeight: 0.25,
  hz: 120, velocityIterations: 10, positionIterations: 6,
  colliders: false, centers: false, anchors: true, constraints: false,
};
export const presets: Record<string, Partial<Settings>> = {
  'Wiggle': defaults,
  'Unity-inspired': { ...defaults, force: 100, holdRatio: 2, localForce: true,
    forceHeight: 0, linearDamping: 0, angularDamping: 0.05, hz: 50,
    velocityIterations: 8, positionIterations: 3 },
  'Loose noodle': { ...defaults, force: 52, gravity: 3, angularDamping: 0.05,
    armMass: 0.55, application: 'distributed' },
};
