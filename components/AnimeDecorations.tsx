"use client";

import type React from "react";

interface AnimeCharacter {
  id: number;
  imageUrl: string;
  side: "left" | "right";
  yOffset: number;
  animationDelay: number;
}

interface AnimeDecorationsProps {
  leftCharacterUrl?: string;
  rightCharacterUrl?: string;
}

const FloatingCharacter: React.FC<{ character: AnimeCharacter }> = ({
  character,
}) => {
  const keyframes = `
    @keyframes float${character.id} {
      0%, 100% {
        transform: translateY(0px);
      }
      50% {
        transform: translateY(-20px);
      }
    }
    
    @keyframes sparkle${character.id} {
      0% {
        transform: rotate(0deg);
      }
      100% {
        transform: rotate(360deg);
      }
    }
    
    @keyframes sparkleParticle${character.id} {
      0% {
        opacity: 1;
        transform: rotate(0deg) translateX(40px);
      }
      100% {
        opacity: 0;
        transform: rotate(360deg) translateX(40px) scale(0.5);
      }
    }
  `;

  const sparkles = Array.from({ length: 12 }).map((_, i) => ({
    id: i,
    angle: (i / 12) * 360,
  }));

  return (
    <>
      <style>{keyframes}</style>
      <div
        className={`fixed pointer-events-none z-10 ${
          character.side === "left" ? "left-4 md:left-8" : "right-4 md:right-8"
        }`}
        style={{
          top: `${character.yOffset}%`,
          animation: `float${character.id} 4s ease-in-out ${character.animationDelay}s infinite`,
          width: "80px",
          height: "120px",
        }}
      >
        {/* Outer glow layer */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(147, 112, 219, 0.3) 0%, rgba(147, 112, 219, 0.1) 60%, transparent 100%)",
            filter: "blur(20px)",
            zIndex: -1,
          }}
        />

        {/* Inner glow layer */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(200, 150, 255, 0.2) 0%, transparent 70%)",
            filter: "blur(10px)",
            zIndex: -1,
          }}
        />

        {/* Main character image */}
        <img
          src={character.imageUrl || "/placeholder.svg"}
          alt="Anime character decoration"
          className="w-full h-full object-contain relative z-10"
          style={{
            filter: "drop-shadow(0 8px 16px rgba(0, 0, 0, 0.1))",
          }}
        />

        {/* Sparkle particles orbiting around character */}
        {/* {sparkles.map((sparkle) => (
          <div
            key={sparkle.id}
            className="absolute w-2 h-2 rounded-full"
            style={{
              left: "50%",
              top: "50%",
              background: `linear-gradient(135deg, rgba(255, 200, 255, 0.8), rgba(150, 100, 255, 0.8))`,
              boxShadow: "0 0 6px rgba(200, 150, 255, 0.8)",
              animation: `sparkleParticle${character.id} 3s ease-in-out ${
                (sparkle.id / 12) * 3
              }s infinite`,
              transformOrigin: `0 0`,
            }}
          />
        ))} */}
      </div>
    </>
  );
};

export const AnimeDecorations: React.FC<AnimeDecorationsProps> = ({
  leftCharacterUrl = "https://images.unsplash.com/photo-1579546069876-e6e99c9ac5d4?w=300&h=400&fit=crop",
  rightCharacterUrl = "https://images.unsplash.com/photo-1578926078328-123456789012?w=300&h=400&fit=crop",
}) => {
  const characters: AnimeCharacter[] = [
    {
      id: 1,
      imageUrl: leftCharacterUrl,
      side: "left",
      yOffset: 25,
      animationDelay: 0,
    },
    {
      id: 2,
      imageUrl: rightCharacterUrl,
      side: "right",
      yOffset: 45,
      animationDelay: 0.5,
    },
  ];

  return (
    <div className="fixed inset-0 pointer-events-none">
      {characters.map((character) => (
        <FloatingCharacter key={character.id} character={character} />
      ))}
    </div>
  );
};
