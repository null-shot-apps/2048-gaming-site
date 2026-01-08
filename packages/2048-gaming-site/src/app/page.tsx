'use client';

import { useEffect, useState, useCallback } from 'react';

type Tile = {
  id: number;
  value: number;
  row: number;
  col: number;
  isNew?: boolean;
  isMerged?: boolean;
};

export default function Rialo2048() {
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [nextId, setNextId] = useState(0);

  const initGame = useCallback(() => {
    const newTiles: Tile[] = [];
    let id = 0;
    
    // Add two initial tiles
    for (let i = 0; i < 2; i++) {
      const emptyPositions = getEmptyPositions(newTiles);
      if (emptyPositions.length > 0) {
        const pos = emptyPositions[Math.floor(Math.random() * emptyPositions.length)];
        newTiles.push({
          id: id++,
          value: Math.random() < 0.9 ? 2 : 4,
          row: pos.row,
          col: pos.col,
          isNew: true
        });
      }
    }
    
    setTiles(newTiles);
    setScore(0);
    setGameOver(false);
    setWon(false);
    setNextId(id);
  }, []);

  useEffect(() => {
    initGame();
  }, [initGame]);

  const getEmptyPositions = (currentTiles: Tile[]) => {
    const positions = [];
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        if (!currentTiles.some(t => t.row === row && t.col === col)) {
          positions.push({ row, col });
        }
      }
    }
    return positions;
  };

  const addRandomTile = (currentTiles: Tile[], id: number) => {
    const emptyPositions = getEmptyPositions(currentTiles);
    if (emptyPositions.length > 0) {
      const pos = emptyPositions[Math.floor(Math.random() * emptyPositions.length)];
      return {
        id,
        value: Math.random() < 0.9 ? 2 : 4,
        row: pos.row,
        col: pos.col,
        isNew: true
      };
    }
    return null;
  };

  const move = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
    if (gameOver || won) return;

    let moved = false;
    let newScore = score;
    let newTiles = tiles.map(t => ({ ...t, isNew: false, isMerged: false }));
    
    const vectors = {
      up: { row: -1, col: 0 },
      down: { row: 1, col: 0 },
      left: { row: 0, col: -1 },
      right: { row: 0, col: 1 }
    };

    const vector = vectors[direction];
    const traversals = buildTraversals(vector);

    traversals.row.forEach(row => {
      traversals.col.forEach(col => {
        const tile = newTiles.find(t => t.row === row && t.col === col);
        if (tile) {
          const farthest = findFarthestPosition(tile, vector, newTiles);
          const next = newTiles.find(t => t.row === farthest.next.row && t.col === farthest.next.col);

          if (next && next.value === tile.value && !next.isMerged) {
            // Merge tiles
            const mergedValue = tile.value * 2;
            newTiles = newTiles.filter(t => t.id !== tile.id && t.id !== next.id);
            newTiles.push({
              id: next.id,
              value: mergedValue,
              row: farthest.next.row,
              col: farthest.next.col,
              isMerged: true
            });
            newScore += mergedValue;
            moved = true;

            if (mergedValue === 2048) {
              setWon(true);
            }
          } else {
            // Move tile
            if (tile.row !== farthest.farthest.row || tile.col !== farthest.farthest.col) {
              tile.row = farthest.farthest.row;
              tile.col = farthest.farthest.col;
              moved = true;
            }
          }
        }
      });
    });

    if (moved) {
      const newTile = addRandomTile(newTiles, nextId);
      if (newTile) {
        newTiles.push(newTile);
        setNextId(nextId + 1);
      }
      
      setTiles(newTiles);
      setScore(newScore);

      // Check game over
      if (!canMove(newTiles)) {
        setGameOver(true);
      }
    }
  }, [tiles, score, gameOver, won, nextId]);

  const buildTraversals = (vector: { row: number; col: number }) => {
    const traversals = { row: [0, 1, 2, 3], col: [0, 1, 2, 3] };
    
    if (vector.row === 1) traversals.row = traversals.row.reverse();
    if (vector.col === 1) traversals.col = traversals.col.reverse();
    
    return traversals;
  };

  const findFarthestPosition = (tile: Tile, vector: { row: number; col: number }, currentTiles: Tile[]) => {
    let previous = { row: tile.row, col: tile.col };
    let cell = { row: previous.row + vector.row, col: previous.col + vector.col };

    while (cell.row >= 0 && cell.row < 4 && cell.col >= 0 && cell.col < 4) {
      const occupied = currentTiles.find(t => t.row === cell.row && t.col === cell.col && t.id !== tile.id);
      if (occupied) break;
      
      previous = cell;
      cell = { row: previous.row + vector.row, col: previous.col + vector.col };
    }

    return { farthest: previous, next: cell };
  };

  const canMove = (currentTiles: Tile[]) => {
    if (getEmptyPositions(currentTiles).length > 0) return true;

    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        const tile = currentTiles.find(t => t.row === row && t.col === col);
        if (tile) {
          const directions = [{ row: 0, col: 1 }, { row: 1, col: 0 }];
          for (const dir of directions) {
            const newRow = row + dir.row;
            const newCol = col + dir.col;
            if (newRow < 4 && newCol < 4) {
              const neighbor = currentTiles.find(t => t.row === newRow && t.col === newCol);
              if (neighbor && neighbor.value === tile.value) return true;
            }
          }
        }
      }
    }
    return false;
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        const directionMap: { [key: string]: 'up' | 'down' | 'left' | 'right' } = {
          ArrowUp: 'up',
          ArrowDown: 'down',
          ArrowLeft: 'left',
          ArrowRight: 'right'
        };
        move(directionMap[e.key]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [move]);

  // Touch handling
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart({
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    });
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart) return;

    const touchEnd = {
      x: e.changedTouches[0].clientX,
      y: e.changedTouches[0].clientY
    };

    const dx = touchEnd.x - touchStart.x;
    const dy = touchEnd.y - touchStart.y;

    if (Math.abs(dx) > Math.abs(dy)) {
      move(dx > 0 ? 'right' : 'left');
    } else {
      move(dy > 0 ? 'down' : 'up');
    }

    setTouchStart(null);
  };

  const getTileColor = (value: number) => {
    const colors: { [key: number]: string } = {
      2: 'bg-amber-200 text-gray-800',
      4: 'bg-amber-300 text-gray-800',
      8: 'bg-orange-400 text-white',
      16: 'bg-orange-500 text-white',
      32: 'bg-orange-600 text-white',
      64: 'bg-red-500 text-white',
      128: 'bg-yellow-400 text-white',
      256: 'bg-yellow-500 text-white',
      512: 'bg-yellow-600 text-white',
      1024: 'bg-yellow-700 text-white',
      2048: 'bg-yellow-800 text-white'
    };
    return colors[value] || 'bg-gray-800 text-white';
  };

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-yellow-400 flex items-center justify-center p-4">
      <div className="max-w-lg w-full">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-5xl font-bold text-gray-800">Rialo</h1>
          <div className="text-right">
            <div className="text-sm text-gray-700 font-medium">SCORE</div>
            <div className="text-3xl font-bold text-gray-800">{score}</div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mb-4 text-center text-gray-700 text-sm">
          Swipe or use arrow keys to combine numbers and reach 2048!
        </div>

        {/* Game Board */}
        <div 
          className="relative bg-yellow-600 rounded-lg p-3 aspect-square"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Grid background */}
          <div className="grid grid-cols-4 gap-3 h-full">
            {Array.from({ length: 16 }).map((_, i) => (
              <div key={i} className="bg-yellow-500 rounded-md" />
            ))}
          </div>

          {/* Tiles */}
          <div className="absolute inset-3">
            {tiles.map(tile => (
              <div
                key={tile.id}
                className={`absolute w-[calc(25%-0.75rem)] h-[calc(25%-0.75rem)] rounded-md flex items-center justify-center text-2xl font-bold transition-all duration-150 ${getTileColor(tile.value)} ${tile.isNew ? 'scale-0 animate-[scale-in_0.2s_ease-out_forwards]' : ''} ${tile.isMerged ? 'animate-[pulse_0.2s_ease-out]' : ''}`}
                style={{
                  left: `${tile.col * 25}%`,
                  top: `${tile.row * 25}%`,
                }}
              >
                {tile.value}
              </div>
            ))}
          </div>
        </div>

        {/* New Game Button */}
        <button
          onClick={initGame}
          className="mt-6 w-full bg-gray-800 text-white py-3 rounded-lg font-bold hover:bg-gray-700 transition-colors"
        >
          New Game
        </button>

        {/* Game Over / Won Overlay */}
        {(gameOver || won) && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 text-center max-w-sm mx-4">
              <h2 className="text-3xl font-bold mb-4 text-gray-800">
                {won ? '🎉 You Won!' : 'Game Over!'}
              </h2>
              <p className="text-xl mb-6 text-gray-700">Score: {score}</p>
              <button
                onClick={initGame}
                className="bg-yellow-400 text-gray-800 px-8 py-3 rounded-lg font-bold hover:bg-yellow-500 transition-colors"
              >
                Play Again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

