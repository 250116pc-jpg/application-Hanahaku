import Phaser from 'phaser';
import { transitionWithLoading } from './scene-loading';

// 既存の呼び出し口を維持し、黒いフェードを共通ロード表示へ置き換える。
export function createSceneFade(scene: Phaser.Scene): (destination: string) => void {
  return destination => transitionWithLoading(scene, destination);
}
