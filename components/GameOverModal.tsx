
import React from 'react';

interface GameOverModalProps {
  score: number;
  highScore: number;
  onRestart: () => void;
}

const GameOverModal: React.FC<GameOverModalProps> = ({ score, highScore, onRestart }) => {
  return (
    <div className="absolute inset-0 bg-black/60 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-8 text-center text-gray-800 animate-fade-in-up w-11/12 max-w-md">
        <h2 className="text-4xl md:text-5xl font-bold mb-2">Game Over</h2>
        <p className="text-xl mb-4">Your tower reached a height of <span className="font-bold text-sky-600">{score}</span>!</p>
        <p className="text-lg mb-6">High Score: <span className="font-bold">{highScore}</span></p>
        <button
          onClick={onRestart}
          className="bg-sky-500 hover:bg-sky-600 text-white font-bold py-3 px-6 rounded-lg text-xl transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-opacity-75"
        >
          Restart Game
        </button>
      </div>
    </div>
  );
};

export default GameOverModal;
