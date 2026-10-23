export type StagePosition = {
  id: number;
  x: number;
  y: number;
  type: 'story' | 'battle';
};

// エリア別のステージ選択画面設定。座標は1280×720基準。
// 配列の順番で道をつなぐ。idは現在、共通の仮ステージID（1〜5）。
// 個別の敵・マップ・ステージIDを用意したら、この設定と対応付ける。
export const AREA_STAGE_LAYOUTS: Record<number, StagePosition[]> = {
  1: [
    { id: 1, x: 176, y: 235, type: 'story' },
    { id: 2, x: 300, y: 418, type: 'battle' },
    { id: 3, x: 615, y: 265, type: 'story' },
    { id: 4, x: 785, y: 455, type: 'battle' },
    { id: 5, x: 1072, y: 452, type: 'story' },
  ],
  2: [
    { id: 1, x: 176, y: 430, type: 'story' },
    { id: 2, x: 370, y: 250, type: 'battle' },
    { id: 3, x: 615, y: 420, type: 'story' },
    { id: 4, x: 850, y: 250, type: 'battle' },
    { id: 5, x: 1080, y: 410, type: 'story' },
  ],
  3: [
    { id: 1, x: 180, y: 330, type: 'story' },
    { id: 2, x: 390, y: 460, type: 'battle' },
    { id: 3, x: 620, y: 340, type: 'story' },
    { id: 4, x: 850, y: 460, type: 'battle' },
    { id: 5, x: 1080, y: 300, type: 'story' },
  ],
  4: [
    { id: 1, x: 180, y: 460, type: 'story' },
    { id: 2, x: 360, y: 360, type: 'battle' },
    { id: 3, x: 600, y: 260, type: 'story' },
    { id: 4, x: 850, y: 350, type: 'battle' },
    { id: 5, x: 1080, y: 460, type: 'story' },
  ],
  5: [
    { id: 1, x: 180, y: 250, type: 'story' },
    { id: 2, x: 400, y: 350, type: 'battle' },
    { id: 3, x: 620, y: 460, type: 'story' },
    { id: 4, x: 850, y: 350, type: 'battle' },
    { id: 5, x: 1080, y: 250, type: 'story' },
  ],
  6: [
    { id: 1, x: 180, y: 440, type: 'story' },
    { id: 2, x: 400, y: 280, type: 'battle' },
    { id: 3, x: 620, y: 280, type: 'story' },
    { id: 4, x: 840, y: 440, type: 'battle' },
    { id: 5, x: 1080, y: 440, type: 'story' },
  ],
};
