export type StagePosition = {
  id: number;
  x: number;
  y: number;
  type: 'story' | 'battle';
};

// エリア別のステージ選択画面設定。座標は1280×720基準。
// 配列の順番で道をつなぐ。ステージ数はエリアごとに異なる。
// 個別の敵・マップ・ステージIDを用意したら、この設定と対応付ける。
export const AREA_STAGE_LAYOUTS: Record<number, StagePosition[]> = {
  1: [
    { id: 1, x: 160, y: 260, type: 'story' },
    { id: 2, x: 352, y: 440, type: 'battle' },
    { id: 3, x: 544, y: 350, type: 'story' },
    { id: 4, x: 736, y: 480, type: 'battle' },
    { id: 5, x: 928, y: 300, type: 'story' },
    { id: 6, x: 1120, y: 460, type: 'battle' },
    { id: 7, x: 180, y: 270, type: 'story' },
    { id: 8, x: 410, y: 460, type: 'battle' },
    { id: 9, x: 640, y: 330, type: 'story' },
    { id: 10, x: 870, y: 470, type: 'battle' },
    { id: 11, x: 1100, y: 300, type: 'story' },
  ],
  2: [
    { id: 1, x: 180, y: 300, type: 'story' },
    { id: 2, x: 410, y: 460, type: 'battle' },
    { id: 3, x: 640, y: 270, type: 'story' },
    { id: 4, x: 870, y: 460, type: 'battle' },
    { id: 5, x: 1100, y: 320, type: 'story' },
  ],
  3: [
    { id: 1, x: 180, y: 330, type: 'story' },
    { id: 2, x: 410, y: 470, type: 'battle' },
    { id: 3, x: 640, y: 280, type: 'story' },
    { id: 4, x: 870, y: 460, type: 'battle' },
    { id: 5, x: 1100, y: 320, type: 'story' },
  ],
  4: [
    { id: 1, x: 180, y: 460, type: 'story' },
    { id: 2, x: 410, y: 320, type: 'battle' },
    { id: 3, x: 640, y: 260, type: 'story' },
    { id: 4, x: 870, y: 420, type: 'battle' },
    { id: 5, x: 1100, y: 320, type: 'story' },
  ],
  5: [
    { id: 1, x: 180, y: 280, type: 'story' },
    { id: 2, x: 410, y: 450, type: 'battle' },
    { id: 3, x: 640, y: 340, type: 'story' },
    { id: 4, x: 870, y: 470, type: 'battle' },
    { id: 5, x: 1100, y: 280, type: 'story' },
  ],
  6: [
    { id: 1, x: 180, y: 450, type: 'story' },
    { id: 2, x: 410, y: 300, type: 'battle' },
    { id: 3, x: 640, y: 280, type: 'story' },
    { id: 4, x: 870, y: 450, type: 'battle' },
    { id: 5, x: 1100, y: 340, type: 'story' },
  ],
};
