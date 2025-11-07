import React, { useEffect, useState } from "react";
import { BlockType } from "../types";

interface BlockProps {
  block: BlockType;
  /** When true, the image will animate (drop) from above into the block's position */
  isDropping?: boolean;
  /** How many pixels above the block the image starts when dropping */
  dropFrom?: number;
  /** Drop animation duration in milliseconds */
  durationMs?: number;
  /** Called after the drop animation finishes */
  onDropEnd?: () => void;
}

const Block: React.FC<BlockProps> = ({
  block,
  isDropping = false,
  dropFrom = 300,
  durationMs = 500,
  onDropEnd,
}) => {
  // We animate the inner wrapper with translateY. Start above (-dropFrom) then transition to 0.
  const [innerTransform, setInnerTransform] = useState<string>(
    isDropping ? `translateY(-${dropFrom}px)` : "translateY(0px)"
  );
  const [useTransition, setUseTransition] = useState<boolean>(false);

  useEffect(() => {
    let rafId: number | null = null;
    let timeoutId: number | null = null;

    if (isDropping) {
      // Ensure we start from the dropped-from position without transition, then on next frame
      // enable transition and move to zero to animate the fall.
      setUseTransition(false);
      setInnerTransform(`translateY(-${dropFrom}px)`);

      rafId = requestAnimationFrame(() => {
        // enable transition and move to resting position
        setUseTransition(true);
        setInnerTransform("translateY(0px)");
      });

      // call onDropEnd after the animation finishes (add small buffer)
      timeoutId = window.setTimeout(() => {
        setUseTransition(false);
        onDropEnd && onDropEnd();
      }, durationMs + 50);
    } else {
      // not dropping: ensure element is at resting position
      setUseTransition(false);
      setInnerTransform("translateY(0px)");
    }

    return () => {
      if (rafId != null) cancelAnimationFrame(rafId);
      if (timeoutId != null) clearTimeout(timeoutId);
    };
  }, [isDropping, dropFrom, durationMs, onDropEnd]);

  return (
    <div
      className="absolute"
      style={{
        left: `${block.x}px`,
        bottom: `${block.y}px`,
        transform: `translateX(-50%)`, // Center the block on its x-coordinate
        // ensure the container has the block's fixed size so the img doesn't stretch
        width: `${block.width}px`,
        height: `${block.height}px`,
      }}
    >
      <div
        style={{
          transform: innerTransform,
          transition: useTransition
            ? `transform ${durationMs}ms cubic-bezier(.22,.9,.31,1)`
            : undefined,
          willChange: "transform",
          width: "100%",
          height: "100%",
        }}
      >
        <img
          src="/imgs/house.png"
          alt="house"
          // remove w-full/h-full which can interact with parent sizing
          style={{
            display: "block",
            width: "100%",
            height: "100%",
            // preserve aspect ratio — don't distort the image
            objectFit: "contain",
            imageRendering: "pixelated",
          }}
        />
      </div>
    </div>
  );
};

export default Block;
