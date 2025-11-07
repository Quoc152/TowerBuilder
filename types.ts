
export type BlockType = {
  id: number;
  x: number; // center x
  y: number; // bottom y
  width: number;
  height: number;
  color: string;
};

export enum GameState {
  Initial,
  Playing,
  GameOver,
}
