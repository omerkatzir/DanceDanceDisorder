import Phaser from 'phaser';

import { FaceState } from './face';
import { unityLimbs } from './unity-limbs';

const files = ['Body_Blue', 'Hand_U_Blue', 'Hand_D_blue', 'R_Leg_U_Blue',
  'L_leg_D_blue', 'R_Leg_D_Blue', 'Head_1_blue', 'Head_2_blue',
  'Head_3_blue', 'Head_4_blue', 'Head_5_blue'];

export interface VisualPart {
  name: string; group: string; height: number;
}

// Only presentation transforms enter here; no body positions or forces are changed.
export class DancerPresentation {
  face = new FaceState();
  private images = new Map<string, Phaser.GameObjects.Image>();
  static preload(scene: Phaser.Scene) {
    for (const file of files) scene.load.image(file, `${import.meta.env.BASE_URL}sprites/blue/${file}.png`);
  }
  constructor(private scene: Phaser.Scene) {}
  beginFrame() { for (const image of this.images.values()) image.setVisible(false); }
  draw(part: VisualPart, x: number, y: number, angle: number, scale: number, enabled: boolean) {
    if (!enabled) return false;
    const left = part.name.startsWith('L ');
    const key = part.group === 'head' ? `Head_${this.face.expression}_blue`
      : part.group === 'torso' ? 'Body_Blue'
      : part.name.endsWith('upper arm') ? 'Hand_U_Blue'
      : part.name.endsWith('forearm') ? 'Hand_D_blue'
      : part.name.endsWith('thigh') ? 'R_Leg_U_Blue'
      : left ? 'L_leg_D_blue' : 'R_Leg_D_Blue';
    // Failed image loads leave debug geometry available as a fallback.
    if (!this.scene.textures.exists(key)) return false;
    let image = this.images.get(part.name);
    if (!image) {
      image = this.scene.add.image(0, 0, key);
      this.images.set(part.name, image);
    }
    image.setTexture(key).setVisible(true).setPosition(x, y);
    const limb = part.group === 'arm' || part.group === 'leg';
    // Physics segments have +local-Y toward their distal joint; the art points down.
    image.setRotation(-angle + (limb ? Math.PI : 0));
    image.setFlipX(left && !part.name.endsWith('shin'));
    const originalScale = part.group === 'head' || part.name.endsWith('forearm') || part.name.endsWith('shin');
    const height = originalScale ? image.frame.realHeight * unityLimbs.pixelsToWorld : part.height;
    const ratio = height * scale / image.frame.realHeight;
    image.setScale(ratio);
    const spec = part.name.endsWith('forearm') ? unityLimbs.forearm : part.name.endsWith('shin') ? unityLimbs.shin : null;
    if (spec) {
      const physicalOffset = 'centerFromElbow' in spec ? spec.centerFromElbow : spec.centerFromKnee;
      const offset = (spec.pivotY - 0.5) * height - physicalOffset;
      image.setPosition(x - Math.sin(angle) * offset * scale, y - Math.cos(angle) * offset * scale);
    }
    const proximal = part.name.endsWith('upper arm') || part.name.endsWith('thigh');
    image.setDepth(part.group === 'head' ? 4 : part.group === 'torso' ? 3 : proximal ? 2 : 1);
    return true;
  }
  destroy() { for (const image of this.images.values()) image.destroy(); this.images.clear(); }
}
