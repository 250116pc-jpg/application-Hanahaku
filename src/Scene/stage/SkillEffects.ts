// 担当：たまおちゃん｜スキル発動演出
import { SkillSound } from './SkillSound';
import { battleNow } from './BattleClock';
import Phaser from 'phaser';
import type { Player, CombatTarget, SkillVisualPhase } from './Player';
import type { ServerFlowerSkill } from './SkillApi';
import { ensureBattleTextures } from './StageAtmosphere';

const palettes: Record<ServerFlowerSkill['type'], [number, number, string]> = {
  multiHit: [0xff623d, 0xffd18b, '01_fire_slash'],
  defensiveRecovery: [0x75bbff, 0xe2f4ff, '02_guard_buff'],
  charge: [0xffb83e, 0xffffdf, '03_sun_beam'],
  balanced: [0xffa349, 0xffe6aa, '04_homing_orb'],
  continuous: [0x38bcff, 0xc9ffff, '05_water_burst'],
  maple: [0xe75849, 0xffca76, '06b_leaf_red'],
  fortify: [0x6eb7ff, 0xe3f3ff, '07_fortify'],
  slowAttack: [0xaaa2ff, 0xf3e3ff, '08_debuff'],
  heal: [0x73e9b0, 0xf3ffdf, '09_heal'],
  evasion: [0xa98bff, 0xeae2ff, '10_stealth'],
};

/** World-space spell choreography. HUD stays above all lights and overlays. */
export class SkillEffects {
  private readonly scene: Phaser.Scene;
  private readonly player: Player;
  private readonly followers = new Set<() => void>();
  private readonly auras = new Map<string, Phaser.GameObjects.Container>();
  private lastShake = -1000;
  private readonly sound: SkillSound;
  private readonly reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  private banner?: Phaser.GameObjects.Container;

  constructor(scene: Phaser.Scene, player: Player) {
    this.scene = scene;
    this.player = player;
    this.sound = new SkillSound(scene);
    ensureBattleTextures(scene);
    const update = (): void => this.followers.forEach(follow => follow());
    scene.events.on(Phaser.Scenes.Events.POST_UPDATE, update);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      scene.events.off(Phaser.Scenes.Events.POST_UPDATE, update);
      this.followers.clear();
      this.auras.clear();
    });
  }

  play(skill: Pick<ServerFlowerSkill, 'type' | 'durationMs'> & { name?: string }, phase: SkillVisualPhase, targets: readonly CombatTarget[], area: readonly (readonly number[])[]): void {
    if (!this.player.active || this.player.health <= 0) return;
    if (phase !== 'projectile') this.sound.play(phase, skill.type === 'charge' && phase === 'impact');
    let [color, light, sheet] = palettes[skill.type];
    if (skill.type === 'maple' && phase !== 'impact') { color = 0x85dd9e; sheet = '06a_leaf_green'; }
    const x = this.player.x;
    const y = this.player.y - 38;
    if (phase === 'cast') {
      this.announce(skill.name ?? 'スキル', color);
      this.light(x, y, color, 175, 300);
      this.ring(x, this.player.y - 4, color, 80, 280);
      this.sparks(x, y, light, 12, 65, 280, true);
      return;
    }
    if (phase === 'charge') {
      this.aura('charge', color, skill.durationMs, true);
      const starts = battleNow(this.scene);
      const timer = this.scene.time.addEvent({ delay: 100, repeat: Math.max(0, Math.ceil(skill.durationMs / 100) - 1), callback: () => {
        if (!this.player.active || this.player.health <= 0) { timer.remove(); return; }
        const progress = Math.min(1, (battleNow(this.scene) - starts) / skill.durationMs);
        this.sparks(this.player.x, this.player.y - 38, light, 3, 95 + progress * 60, 260, true);
      } });
      return;
    }
    if (phase === 'projectile') {
      targets.forEach(target => this.projectile(target, color));
      return;
    }
    if (phase === 'buff' || phase === 'heal') {
      this.sprite(x, y, sheet, phase === 'heal' ? 160 : 200);
      this.light(x, y, color, 190, 450);
      this.ring(x, this.player.y - 4, light, 120, 600);
      this.sparks(x, y, light, 14, 65, 750, false, true);
      if (phase === 'buff') this.aura(skill.type, color, skill.durationMs || 1500);
      return;
    }
    // Visuals are emitted in the same callback as damage, never staggered by target index.
    const facing = this.player.flipX ? -1 : 1;
    if (skill.type === 'charge') this.beam(area, color, light);
    else if (skill.type === 'multiHit' || skill.type === 'maple' || skill.type === 'evasion') {
      this.slash(x + facing * 60, y, color, light, facing, skill.type === 'maple' ? 1.4 : 1);
    } else if (skill.type === 'continuous') {
      this.wave(area, color);
    }
    const points = targets.length ? targets : [{ x: x + facing * 80, y: this.player.y }];
    points.slice(0, 8).forEach(target => {
      const hitY = target.y - 34;
      if (skill.type !== 'charge') this.sprite(target.x, hitY, sheet, 170, facing < 0);
      this.light(target.x, hitY, color, skill.type === 'charge' ? 260 : 155, 300);
      this.sparks(target.x, hitY, light, targets.length ? 16 : 6, skill.type === 'charge' ? 130 : 80, 380);
      if (targets.length) this.ring(target.x, hitY, light, 60, 260, false);
      if (skill.type === 'slowAttack') {
        const seal = this.scene.add.graphics({ x: target.x, y: hitY }).setDepth(35);
        seal.lineStyle(2, color, .85).strokeCircle(0, 0, 32);
        for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; seal.lineBetween(Math.cos(a) * 20, Math.sin(a) * 20, Math.cos(a) * 40, Math.sin(a) * 40); }
        this.fade(seal, 650, { rotation: 1, scale: 1.4 });
      }
    });
    if (!this.reducedMotion && targets.length && battleNow(this.scene) - this.lastShake >= 140) {
      this.lastShake = battleNow(this.scene);
      this.scene.cameras.main.shake(skill.type === 'charge' ? 160 : 70, skill.type === 'charge' ? .004 : .0014);
    }
  }

  private fade(object: Phaser.GameObjects.GameObject, duration: number, extra: object = {}): void {
    this.scene.tweens.add({ targets: object, alpha: 0, duration, ...extra, onComplete: () => object.destroy() });
  }

  private light(x: number, y: number, color: number, size: number, duration: number): void {
    const glow = this.scene.add.image(x, y, 'battle-glow').setTint(color).setDisplaySize(size, size)
      .setBlendMode(Phaser.BlendModes.ADD).setAlpha(.75).setDepth(24);
    this.fade(glow, duration, { scaleX: glow.scaleX * 1.5, scaleY: glow.scaleY * 1.5 });
  }

  private ring(x: number, y: number, color: number, size: number, duration: number, ground = true): void {
    const ring = this.scene.add.ellipse(x, y, size, ground ? size * .27 : size, color, .05)
      .setStrokeStyle(2, color, .8).setBlendMode(Phaser.BlendModes.ADD).setDepth(25).setScale(.3);
    this.fade(ring, duration, { scale: 1.5, ease: 'Cubic.Out' });
  }

  private sparks(x: number, y: number, color: number, count: number, radius: number, duration: number, gather = false, rise = false): void {
    if (this.reducedMotion) count = Math.ceil(count / 2);
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const distance = radius * (.4 + Math.random() * .6);
      const dx = Math.cos(a) * distance;
      const dy = rise ? -distance : Math.sin(a) * distance * .7;
      const spark = this.scene.add.image(gather ? x + dx : x, gather ? y + dy : y, 'battle-spark')
        .setTint(i % 3 === 0 ? 0xffffff : color).setScale(.4 + Math.random() * .6)
        .setRotation(a).setBlendMode(Phaser.BlendModes.ADD).setDepth(36);
      this.scene.tweens.add({ targets: spark, x: gather ? x : x + dx, y: gather ? y : y + dy,
        scale: 0, alpha: 0, duration: duration * (.7 + Math.random() * .3), ease: gather ? 'Cubic.In' : 'Cubic.Out', onComplete: () => spark.destroy() });
    }
  }

  private sprite(x: number, y: number, sheet: string, size: number, flip = false): void {
    const key = `skill-effect-${sheet}`;
    if (!this.scene.anims.exists(key)) return;
    // Preserve the artwork's white-hot core instead of multiplying every pixel by a flat tint.
    const sprite = this.scene.add.sprite(x, y, key).setDisplaySize(size, size).setFlipX(flip)
      .setDepth(32).setBlendMode(Phaser.BlendModes.ADD).play(key);
    sprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => sprite.destroy());
  }

  private slash(x: number, y: number, color: number, light: number, direction: number, scale: number): void {
    const arc = this.scene.add.graphics({ x, y }).setDepth(34).setBlendMode(Phaser.BlendModes.ADD);
    arc.lineStyle(19, color, .15).beginPath().arc(0, 0, 65, -1.3, 1.3).strokePath();
    arc.lineStyle(7, color, .85).beginPath().arc(0, 0, 65, -1.3, 1.3).strokePath();
    arc.lineStyle(2, light, 1).beginPath().arc(0, 0, 63, -1.2, 1.2).strokePath();
    arc.setScale(direction * scale, scale).setRotation(-.6 * direction);
    this.fade(arc, 230, { rotation: .6 * direction, x: x + 25 * direction });
  }

  private beam(area: readonly (readonly number[])[], color: number, light: number): void {
    const originRow = area.findIndex(row => row.includes(1));
    if (originRow < 0) return;
    const originColumn = area[originRow].indexOf(1);
    const cells = area[originRow].flatMap((cell, i) => cell === 2 ? [i - originColumn] : []);
    if (!cells.length) return;
    const dir = this.player.flipX ? -1 : 1;
    const left = (Math.min(...cells) - .5) * 40;
    const length = (Math.max(...cells) - Math.min(...cells) + 1) * 40;
    const beam = this.scene.add.graphics({ x: this.player.x, y: this.player.y - 30 }).setDepth(30)
      .setScale(dir, .05).setBlendMode(Phaser.BlendModes.ADD);
    beam.fillStyle(color, .12).fillRect(left, -55, length, 110);
    beam.fillStyle(color, .35).fillRect(left, -26, length, 52);
    beam.fillStyle(color, .9).fillRect(left, -12, length, 24);
    beam.fillStyle(light, 1).fillRect(left, -4, length, 8);
    this.scene.tweens.add({ targets: beam, scaleY: 1, duration: 65, yoyo: true, hold: 180, onComplete: () => beam.destroy() });
    for (let i = 0; i < 5; i++) this.ring(this.player.x + dir * (left + length * i / 5), this.player.y - 30, light, 65, 400, false);
    this.light(this.player.x, this.player.y - 30, color, 310, 400);
  }

  private wave(area: readonly (readonly number[])[], color: number): void {
    const row = area.find(r => r.includes(1));
    const reach = row ? (row.lastIndexOf(2) - row.indexOf(1)) * 40 : 120;
    const dir = this.player.flipX ? -1 : 1;
    for (let i = 1; i <= 3; i++) {
      const wave = this.scene.add.ellipse(this.player.x + dir * reach * i / 3, this.player.y - 20, 38, 85, color, .12)
        .setStrokeStyle(2, 0xb8f6ff, .7).setBlendMode(Phaser.BlendModes.ADD).setDepth(28);
      this.fade(wave, 330, { scaleY: 1.5, y: wave.y - 14 });
    }
  }

  private aura(key: string, color: number, duration: number, charging = false): void {
    this.auras.get(key)?.destroy();
    const aura = this.scene.add.container(this.player.x, this.player.y).setDepth(22);
    this.auras.set(key, aura);
    const glow = this.scene.add.image(0, -32, 'battle-glow').setTint(color).setDisplaySize(charging ? 185 : 125, charging ? 185 : 125)
      .setBlendMode(Phaser.BlendModes.ADD).setAlpha(charging ? .5 : .2);
    const seal = this.scene.add.graphics();
    seal.lineStyle(2, color, .65).strokeEllipse(0, -3, 85, 24);
    seal.lineStyle(1, 0xfff1cf, .6).strokeEllipse(0, -3, 65, 18);
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; seal.fillStyle(color, .9).fillRect(Math.cos(a) * 40 - 2, -3 + Math.sin(a) * 10 - 2, 4, 4); }
    aura.add([glow, seal]);
    const follow = (): void => {
      if (!aura.active) { this.followers.delete(follow); return; }
      if (!this.player.active || this.player.health <= 0) { aura.destroy(); return; }
      aura.setPosition(this.player.x, this.player.y);
    };
    this.followers.add(follow);
    aura.once(Phaser.GameObjects.Events.DESTROY, () => {
      this.followers.delete(follow);
      if (this.auras.get(key) === aura) this.auras.delete(key);
      this.scene.tweens.killTweensOf(glow);
    });
    this.scene.tweens.add({ targets: glow, alpha: charging ? .9 : .38, duration: 650, yoyo: true, repeat: -1 });
    this.scene.time.delayedCall(duration, () => { if (aura.active) this.fade(aura, 160); });
  }

  private projectile(target: CombatTarget, color: number): void {
    const startX = this.player.x;
    const startY = this.player.y - 40;
    const orb = this.scene.add.image(startX, startY, 'battle-glow').setDisplaySize(48, 48).setTint(color)
      .setDepth(31).setBlendMode(Phaser.BlendModes.ADD);
    this.scene.tweens.addCounter({ from: 0, to: 1, duration: 220, onUpdate: tween => {
      const t = tween.getValue() ?? 0;
      orb.setPosition(Phaser.Math.Linear(startX, target.x, t), Phaser.Math.Linear(startY, target.y - 34, t) - Math.sin(t * Math.PI) * 45);
    }, onComplete: () => orb.destroy() });
  }

  private announce(skillName: string, color: number): void {
    if (this.banner?.active) { this.scene.tweens.killTweensOf(this.banner); this.banner.destroy(); }
    const x = this.scene.scale.width / 2;
    const banner = this.scene.add.container(x, 125).setScrollFactor(0).setDepth(1990).setAlpha(0);
    this.banner = banner;
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x101725, .86).fillRect(-235, -24, 470, 48);
    bg.lineStyle(1, color, .8).lineBetween(-235, -24, 235, -24).lineBetween(-200, 24, 200, 24);
    const name = this.scene.add.text(0, 0, skillName, { fontFamily: 'Yu Mincho, serif', fontSize: '19px', color: '#fff1d6', stroke: '#101725', strokeThickness: 3 }).setOrigin(.5);
    if (name.width > 440) name.setScale(440 / name.width);
    banner.add([bg, name]);
    this.scene.tweens.add({ targets: banner, alpha: 1, y: 116, duration: 140, yoyo: true, hold: 900, onComplete: () => banner.destroy() });
  }
}
