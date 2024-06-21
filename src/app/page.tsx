'use client'

// Import necessary modules and types
import React, { useState, useEffect } from 'react';
import questionsData from '../questions.json';

// Define interfaces for types used in the component
interface Question {
  type: string;
  content: string;
  options?: string[];
  answer: string;
  hint: string;
}

interface LeaderboardEntry {
  name: string;
  score: number;
}

// Define the Game component
const Game = () => {
  const [userName, setUserName] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [gameState, setGameState] = useState<'start' | 'playing' | 'won' | 'lost'>('start');
  const [currentQuestions, setCurrentQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number | null>(null);
  const [score, setScore] = useState<number>(0);
  const [highestScore, setHighestScore] = useState<number>(0);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [timer, setTimer] = useState<number>(30);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [showHint, setShowHint] = useState<boolean>(false);
  const [showValidationMessage, setShowValidationMessage] = useState<boolean>(false);

  // Helper function to check if localStorage is available
  const isLocalStorageAvailable = (): boolean => {
    try {
      const test = 'localStorageTest';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (error) {
      return false;
    }
  };

  useEffect(() => {
    // Effect to load leaderboard and highest score from localStorage based on category
    if (category && questionsData[category as keyof typeof questionsData]) {
      if (isLocalStorageAvailable()) {
        try {
          const storedScores = JSON.parse(localStorage.getItem(`leaderboard_${category}`) || '[]') as LeaderboardEntry[];
          const maxScore = storedScores.length > 0 ? Math.max(...storedScores.map((item) => item.score)) : 0;
          setHighestScore(maxScore);
          setLeaderboard(storedScores);
        } catch (error) {
          console.error('Error accessing localStorage:', error);
          setHighestScore(0);
          setLeaderboard([]);
        }
      } else {
        console.warn('localStorage is not available');
        setHighestScore(0);
        setLeaderboard([]);
      }
    }
  }, [category]);

  useEffect(() => {
    // Timer effect for game play
    if (!isPaused && gameState === 'playing' && timer > 0) {
      const interval = setInterval(() => {
        setTimer((prevTimer) => prevTimer - 1);
      }, 1000);

      return () => clearInterval(interval);
    } else if (timer === 0) {
      setGameState('lost');
      handleGameOver();
    }
  }, [isPaused, gameState, timer]);

  const handleAnswer = (selected: string) => {
    // Handler for processing user answers
    if (gameState !== 'playing' || currentQuestionIndex === null) return;

    const currentQuestion = currentQuestions[currentQuestionIndex];
    const correct = currentQuestion.answer.toLowerCase() === selected.toLowerCase();

    setSelectedOption(selected);
    setTimeout(() => {
      if (correct) {
        setScore((prevScore) => prevScore + 1);  // Increment score if the answer is correct

        if (currentQuestionIndex === currentQuestions.length - 1) {
          setGameState('won');
        } else {
          setCurrentQuestionIndex(currentQuestionIndex + 1);
          setSelectedOption(null);
          setUserAnswer('');
        }
      } else {
        setGameState('lost');
        handleGameOver();
      }
      setTimer(30);
    }, 1000);
  };

  const handleStart = () => {
    if (!userName || !category) {
      setShowValidationMessage(true);
      return;
    }

    try {
      const shuffledQuestions = (questionsData as { [key: string]: Question[] })[category].sort(() => Math.random() - 0.5);
      setCurrentQuestions(shuffledQuestions);
      setShowValidationMessage(false);
      setGameState('playing');
      setCurrentQuestionIndex(0);
      setScore(0);  // Ensure score is reset to 0 at the start
      setSelectedOption(null);
      setUserAnswer('');
      setTimer(30);
    } catch (error) {
      console.error('Error starting the game:', error);
    }
  };

  const handlePauseResume = () => {
    // Handler for pausing and resuming the game
    setIsPaused(!isPaused);
  };

  const handleHint = () => {
    // Handler for displaying hint
    setShowHint(true);
    setTimeout(() => setShowHint(false), 3000);
  };

  const handleGameOver = () => {
    if (isLocalStorageAvailable()) {
      try {
        const newLeaderboard = [...leaderboard, { name: userName, score }];
        newLeaderboard.sort((a, b) => b.score - a.score);
        localStorage.setItem(`leaderboard_${category}`, JSON.stringify(newLeaderboard));
        setLeaderboard(newLeaderboard);
      } catch (error) {
        console.error('Error updating localStorage:', error);
      }
    } else {
      console.warn('localStorage is not available');
    }
  };

  const renderLeaderboard = () => {
    // Render leaderboard component
    if (!category || leaderboard.length === 0) {
      return (
        <div className="mt-8 w-full max-w-xl">
          <h2 className="text-2xl font-bold mb-4 text-blue-700">Leaderboard</h2>
          <p className="text-lg text-gray-800">No scores yet for this category.</p>
        </div>
      );
    }

    return (
      <div className="mt-8 w-full max-w-xl">
        <h2 className="text-2xl font-bold mb-4 text-blue-700">Leaderboard - {category.charAt(0).toUpperCase() + category.slice(1)}</h2>
        <ul className="bg-white p-6 rounded-lg shadow-lg">
          {leaderboard.map((entry, index) => (
            <li key={index} className="flex justify-between text-lg text-gray-800 mb-2">
              <span>{entry.name}</span>
              <span>{entry.score}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  // Return JSX for rendering the component
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      {gameState === 'start' && (
        <div className="w-full max-w-xl bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold mb-4 text-blue-700">Welcome to the Quiz Game</h2>
          <div className="mb-4">
            <label className="block text-lg font-semibold text-gray-700">Enter your name:</label>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full border border-gray-300 p-2 rounded mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="mb-4">
            <label className="block text-lg font-semibold text-gray-700">Select a category:</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full border border-gray-300 p-2 rounded mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Choose a category</option>
              {Object.keys(questionsData).map((cat) => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={handleStart}
            className="w-full bg-blue-600 text-white py-2 rounded shadow hover:bg-blue-700 transition duration-200"
          >
            Start Game
          </button>

          {showValidationMessage && (
            <div className="text-red-600 text-lg mt-4 animate-bounce">
              Please enter your name and select a category to start the game.
            </div>
          )}
        </div>
      )}

      {gameState === 'playing' && currentQuestionIndex !== null && (
        <div className="w-full max-w-xl bg-white p-6 rounded-lg shadow-lg">
          <div className="flex justify-between mb-4">
            <span className="text-lg font-semibold text-blue-700">Score: {score}</span>
            <span className="text-lg font-semibold text-red-600">Time: {timer}s</span>
          </div>
          <div className="mb-4">
            <h2 className="text-xl font-semibold mb-2 text-blue-700">Question {currentQuestionIndex + 1}</h2>
            <p className="text-gray-700">{currentQuestions[currentQuestionIndex].content}</p>
          </div>
          {currentQuestions[currentQuestionIndex].type === 'mcq' && (
            <div className="flex flex-col">
              {currentQuestions[currentQuestionIndex].options?.map((option) => (
                <button
                  key={option}
                  onClick={() => handleAnswer(option)}
                  className={`mb-2 p-2 rounded-lg ${
                    selectedOption === option
                      ? option === currentQuestions[currentQuestionIndex].answer
                        ? 'bg-green-500 text-white'
                        : 'bg-red-500 text-white'
                      : 'bg-gray-200 text-gray-800'
                  } transition duration-200`}
                  disabled={selectedOption !== null}
                >
                  {option}
                </button>
              ))}
            </div>
          )}

          {/* Additional logic for other question types */}
          {['fill', 'riddle'].includes(currentQuestions[currentQuestionIndex].type) && (
            <div className="flex flex-col">
              <input
                type="text"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                className="border border-gray-300 p-2 rounded mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={() => handleAnswer(userAnswer)}
                className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 transition duration-200"
              >
                Submit
              </button>
            </div>
          )}

          {/* Buttons for pause, hint, etc. */}
          <button
            onClick={handlePauseResume}
            className="mt-4 bg-yellow-400 text-white px-4 py-2 rounded shadow hover:bg-yellow-500 transition duration-200"
          >
            {isPaused ? 'Resume' : 'Pause'}
          </button>
          <button
            onClick={handleHint}
            className="mt-2 bg-purple-600 text-white px-4 py-2 rounded shadow hover:bg-purple-700 transition duration-200 ml-5"
            disabled={showHint}
          >
            Show Hint
          </button>
          {showHint && <p className="mt-2 text-sm text-gray-700">{currentQuestions[currentQuestionIndex].hint}</p>}
        </div>
      )}

      {/* Game over and congratulations screens */}
      {gameState === 'won' && (
        <div className="mt-8 w-full max-w-xl">
          <h2 className="text-2xl font-bold mb-4 text-green-700">Congratulations!</h2>
          <p className="text-lg text-gray-800">You have completed the game with a score of {score}.</p>
          {renderLeaderboard()}
        </div>
      )}

      {gameState === 'lost' && (
        <div className="mt-8 w-full max-w-xl">
          <h2 className="text-2xl font-bold mb-4 text-red-700">Game Over!</h2>
          <p className="text-lg text-gray-800">You lost the game. Better luck next time!</p>
          {renderLeaderboard()}
        </div>
      )}
    </div>
  );
};

export default Game;
