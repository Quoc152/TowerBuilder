import React, { useState, useEffect, useRef, useCallback } from "react";
import { BlockType, GameState } from "./types";
import {
  BLOCK_HEIGHT,
  BLOCK_BASE_WIDTH,
  BASE_Y_POSITION,
  CRANE_SPEED,
  MAX_OFFSET_PERCENTAGE,
  BLOCK_COLORS,
} from "./constants";
import Block from "./components/Block";
import { AnimeDecorations } from "@/components/AnimeDecorations";
import GameOverModal from "./components/GameOverModal";
import leftAvatar from "@/imgs/Left_Avatar.png";
import rightAvatar from "@/imgs/Right_Avatar.png";

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.Initial);
  const [blocks, setBlocks] = useState<BlockType[]>([]);
  const [movingBlock, setMovingBlock] = useState<BlockType | null>(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [towerTilt, setTowerTilt] = useState(0);
  const [cumulativeOffset, setCumulativeOffset] = useState(0);
  const [isFalling, setIsFalling] = useState(false);
  const [shake, setShake] = useState(false);
  const [isDroppingImage, setIsDroppingImage] = useState(false);
  const [pendingNewBlock, setPendingNewBlock] = useState<BlockType | null>(
    null
  );
  const [dropStartY, setDropStartY] = useState<number>(0);
  const DROP_DURATION_MS = 500;
  // Vertical offset used when spawning the moving block so it sits a bit lower on screen
  const MOVING_BLOCK_VERTICAL_OFFSET = 300; // was 200 before; increase to move down

  const gameLoopId = useRef<number | null>(null);
  const movingDirection = useRef<number>(1);
  const screenWidth = useRef<number>(window.innerWidth);

  useEffect(() => {
    setHighScore(
      parseInt(localStorage.getItem("towerBuilderHighScore") || "0", 10)
    );
    const handleResize = () => {
      screenWidth.current = window.innerWidth;
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const startGame = useCallback(() => {
    setIsFalling(false);
    setTowerTilt(0);
    setCumulativeOffset(0);
    const baseBlock: BlockType = {
      id: 0,
      x: screenWidth.current / 2,
      y: BASE_Y_POSITION,
      width: BLOCK_BASE_WIDTH,
      height: BLOCK_HEIGHT,
      color: "from-gray-500 to-gray-700",
    };
    const firstMovingBlock: BlockType = {
      id: 1,
      x: screenWidth.current / 2,
      y: window.innerHeight - MOVING_BLOCK_VERTICAL_OFFSET,
      width: BLOCK_BASE_WIDTH,
      height: BLOCK_HEIGHT,
      color: BLOCK_COLORS[1 % BLOCK_COLORS.length],
    };
    setBlocks([baseBlock]);
    setMovingBlock(firstMovingBlock);
    setScore(1);
    setGameState(GameState.Playing);
  }, []);

  // Tăng tốc độ di chuyển của movingBlock theo từng tầng (block)
  const getCurrentCraneSpeed = () => {
    const base = CRANE_SPEED;
    // Tăng tốc nhanh hơn: mỗi block tăng 0.35px/frame
    const increment = (blocks.length - 1) * 0.35;
    return base + increment;
  };

  const gameLoop = useCallback(() => {
    setMovingBlock((prev) => {
      if (!prev) return null;
      const speed = getCurrentCraneSpeed();
      let newX = prev.x + speed * movingDirection.current;
      const halfWidth = prev.width / 2;
      if (newX + halfWidth > screenWidth.current || newX - halfWidth < 0) {
        movingDirection.current *= -1;
        newX = prev.x + speed * movingDirection.current;
      }
      return { ...prev, x: newX };
    });
    gameLoopId.current = requestAnimationFrame(gameLoop);
  }, [blocks.length]);

  useEffect(() => {
    if (gameState === GameState.Playing) {
      movingDirection.current = Math.random() > 0.5 ? 1 : -1;
      gameLoopId.current = requestAnimationFrame(gameLoop);
    } else if (gameLoopId.current) {
      cancelAnimationFrame(gameLoopId.current);
    }
    return () => {
      if (gameLoopId.current) cancelAnimationFrame(gameLoopId.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState, gameLoop]);

  const handleDrop = useCallback(() => {
    if (gameState !== GameState.Playing || !movingBlock) return;

    if (gameLoopId.current) {
      cancelAnimationFrame(gameLoopId.current);
    }

    const lastBlock = blocks[blocks.length - 1];
    const offset = movingBlock.x - lastBlock.x;
    const maxAllowedOffset = (lastBlock.width / 2) * MAX_OFFSET_PERCENTAGE;

    if (Math.abs(offset) > maxAllowedOffset) {
      setGameState(GameState.GameOver);
      setIsFalling(true);
      if (score > highScore) {
        localStorage.setItem("towerBuilderHighScore", score.toString());
        setHighScore(score);
      }
      return;
    }

    setShake(true);
    setTimeout(() => setShake(false), 500);

    const newCumulativeOffset = cumulativeOffset + offset;
    const newTowerTilt = newCumulativeOffset * 0.05;
    setCumulativeOffset(newCumulativeOffset);
    setTowerTilt(newTowerTilt);

    const newBlock: BlockType = {
      ...movingBlock,
      y: lastBlock.y + BLOCK_HEIGHT,
    };

    // Instead of placing immediately, set a pending block and trigger the Block's
    // drop animation. When that animation finishes, handleDropEnd will finalize placement.
    setPendingNewBlock(newBlock);
    setDropStartY(movingBlock.y);
    setIsDroppingImage(true);
    // hide the moving block / crane while the image is dropping
    setMovingBlock(null);
  }, [
    gameState,
    movingBlock,
    blocks,
    score,
    highScore,
    cumulativeOffset,
    gameLoop,
  ]);

  const handleDropEnd = useCallback(() => {
    if (!pendingNewBlock) return;

    const newBlocks = [...blocks, pendingNewBlock];
    setBlocks(newBlocks);
    const newScore = newBlocks.length - 1;
    setScore(newScore);

    // clear pending and reset dropping state
    setPendingNewBlock(null);
    setIsDroppingImage(false);

    // spawn next moving block
    setMovingBlock({
      id: newScore + 1,
      x: screenWidth.current / 2,
      y: 0, // y không quan trọng vì sẽ render ở vị trí cố định
      width: BLOCK_BASE_WIDTH,
      height: BLOCK_HEIGHT,
      color: BLOCK_COLORS[newScore % BLOCK_COLORS.length],
    });

    movingDirection.current = Math.random() > 0.5 ? 1 : -1;
    gameLoopId.current = requestAnimationFrame(gameLoop);
  }, [pendingNewBlock, blocks, gameLoop]);

  useEffect(() => {
    const handleUserInput = (e: MouseEvent | TouchEvent | KeyboardEvent) => {
      if ("key" in e && e.key !== " ") return;
      if (gameState === GameState.Playing) {
        handleDrop();
      }
    };

    window.addEventListener("click", handleUserInput);
    window.addEventListener("touchstart", handleUserInput);
    window.addEventListener("keydown", handleUserInput);

    return () => {
      window.removeEventListener("click", handleUserInput);
      window.removeEventListener("touchstart", handleUserInput);
      window.removeEventListener("keydown", handleUserInput);
    };
  }, [gameState, handleDrop]);

  // Camera chỉ dịch lên khi số block > 5
  const getCameraY = () => {
    // Luôn giữ transform cha > 0 để tránh reflow lớn khi chuyển từ 0 sang giá trị khác
    if (blocks.length <= 5) return 1;
    return (blocks.length - 5) * BLOCK_HEIGHT;
  };
  const cameraY = getCameraY();

  return (
    <div className={`relative w-screen h-screen overflow-hidden select-none`}>
      {/* <AnimeDecorations
        leftCharacterUrl={leftAvatar}
        rightCharacterUrl={rightAvatar}
      /> */}

      <div
        className={`absolute inset-0 bg-black/10 transition-opacity duration-500 ${
          gameState === GameState.GameOver ? "opacity-100" : "opacity-0"
        }`}
      />

      <div className="absolute top-1/2 left-0 w-full h-[200%] bg-[url('https://www.transparenttextures.com/patterns/subtle-white-feathers.png')] opacity-5 animate-cloud-pan"></div>

      <div className="absolute top-4 left-4 text-white text-2xl font-bold p-2 bg-black/20 rounded-md z-10">
        Height: {score}
      </div>
      <div className="absolute top-4 right-4 text-white text-xl font-bold p-2 bg-black/20 rounded-md z-10">
        High Score: {highScore}
      </div>

      {gameState === GameState.Initial && (
        <div className="absolute inset-0 flex flex-col justify-center items-center z-20">
          <div className="text-center text-white p-8 bg-black/30 rounded-xl shadow-2xl">
            <h1 className="text-6xl font-extrabold mb-4 tracking-tight">
              Tower Builder
            </h1>
            <p className="text-xl mb-8">Stack the blocks as high as you can!</p>
            <button
              onClick={startGame}
              className="bg-sky-500 hover:bg-sky-600 text-white font-bold py-4 px-8 rounded-lg text-2xl transition-transform transform hover:scale-105"
            >
              Start Game
            </button>
            <p className="mt-6 text-sm text-gray-200">
              Click, tap, or press Space to drop a block.
            </p>
          </div>
        </div>
      )}

      {/* Render the moving house image luôn ở top: 50px trên màn hình */}
      {gameState === GameState.Playing && movingBlock && !isDroppingImage && (
        <div
          className="absolute left-0 right-0 z-30 pointer-events-none"
          style={{ top: 180 }}
        >
          <Block block={{ ...movingBlock, y: 0 }} />
        </div>
      )}

      {/* Render the dropping image at the final block position but start it visually
          from the movingBlock's Y so it appears to fall into place. */}
      {isDroppingImage && pendingNewBlock && (
        <Block
          block={{ ...pendingNewBlock, y: pendingNewBlock.y + cameraY }}
          isDropping={true}
          dropFrom={
            window.innerHeight -
            MOVING_BLOCK_VERTICAL_OFFSET -
            (pendingNewBlock.y + cameraY)
          }
          durationMs={DROP_DURATION_MS}
          onDropEnd={handleDropEnd}
        />
      )}

      <div
        className={`absolute bottom-0 left-0 w-full transition-transform duration-300 ease-out ${
          shake ? "animate-shake" : ""
        }`}
        style={{ transform: `translateY(${cameraY}px)` }}
      >
        <div
          className="relative w-full h-full origin-bottom"
          style={{
            transform: `rotate(${isFalling ? 30 : towerTilt}deg)`,
            transition: isFalling
              ? "transform 1.5s ease-in"
              : "transform 0.3s ease-out",
            transformOrigin:
              blocks.length > 1
                ? `${blocks[0].x}px ${blocks[0].y + BLOCK_HEIGHT / 2}px`
                : "50% 100%",
          }}
        >
          {blocks.map((block) => (
            <Block key={block.id} block={block} />
          ))}
        </div>
      </div>

      {isFalling && (
        <div
          className="absolute w-full"
          style={{
            bottom: blocks[blocks.length - 1].y + cameraY,
            // movingBlock may be null (we hide it); use a safe fallback width
            left:
              blocks[blocks.length - 1].x -
              ((movingBlock && movingBlock.width) || BLOCK_BASE_WIDTH) / 2,
            transition: "transform 1.5s ease-in",
            transform: `translateY(${window.innerHeight}px) rotate(90deg)`,
            transformOrigin: "center",
          }}
        >
          {movingBlock && (
            <Block block={{ ...movingBlock, x: movingBlock.width / 2 }} />
          )}
        </div>
      )}

      {gameState === GameState.GameOver && (
        <GameOverModal
          score={score}
          highScore={highScore}
          onRestart={startGame}
        />
      )}
    </div>
  );
};

export default App;
