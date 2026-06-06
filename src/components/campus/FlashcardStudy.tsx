"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RotateCcw, ThumbsUp, ThumbsDown, Trophy } from "lucide-react";

interface Flashcard {
  front: string;
  back: string;
}

interface FlashcardDeck {
  _id: string;
  deckName: string;
  subject: string;
  cards: Flashcard[];
}

interface Props {
  deck: FlashcardDeck;
  onBack: () => void;
}

export default function FlashcardStudy({ deck, onBack }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [known, setKnown] = useState<Set<number>>(new Set());
  const [review, setReview] = useState<Set<number>>(new Set());
  const [sessionDone, setSessionDone] = useState(false);

  const card = deck.cards[currentIndex];
  const progress = ((currentIndex) / deck.cards.length) * 100;
  const totalAnswered = known.size + review.size;

  const handleFlip = () => setIsFlipped(f => !f);

  const handleKnow = () => {
    setKnown(prev => new Set([...prev, currentIndex]));
    advance();
  };

  const handleReview = () => {
    setReview(prev => new Set([...prev, currentIndex]));
    advance();
  };

  const advance = () => {
    setIsFlipped(false);
    if (currentIndex + 1 >= deck.cards.length) {
      setSessionDone(true);
    } else {
      setCurrentIndex(i => i + 1);
    }
  };

  const restart = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setKnown(new Set());
    setReview(new Set());
    setSessionDone(false);
  };

  const restartReview = () => {
    // Only show cards marked for review
    const reviewIndices = Array.from(review);
    if (reviewIndices.length === 0) return;
    setCurrentIndex(reviewIndices[0]);
    setIsFlipped(false);
    setKnown(new Set());
    setReview(new Set());
    setSessionDone(false);
  };

  if (sessionDone) {
    const masteryPercent = Math.round((known.size / deck.cards.length) * 100);
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center space-y-6">
        <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-3xl flex items-center justify-center shadow-xl">
          <Trophy size={36} className="text-black" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-black mb-2">Session Complete!</h2>
          <p className="text-gray-500">{deck.deckName}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-6 w-full max-w-sm">
          <div className="bg-gray-50 rounded-2xl p-4">
            <p className="text-2xl font-bold text-black">{deck.cards.length}</p>
            <p className="text-xs text-gray-500 mt-1">Total Cards</p>
          </div>
          <div className="bg-green-50 rounded-2xl p-4">
            <p className="text-2xl font-bold text-green-600">{known.size}</p>
            <p className="text-xs text-gray-500 mt-1">Got It ✓</p>
          </div>
          <div className="bg-orange-50 rounded-2xl p-4">
            <p className="text-2xl font-bold text-orange-600">{review.size}</p>
            <p className="text-xs text-gray-500 mt-1">Review Again</p>
          </div>
        </div>

        {/* Mastery bar */}
        <div className="w-full max-w-sm">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-500">Mastery</span>
            <span className="font-bold text-black">{masteryPercent}%</span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full transition-all duration-700"
              style={{ width: `${masteryPercent}%` }}
            />
          </div>
        </div>

        <div className="flex gap-3 flex-wrap justify-center">
          <Button onClick={onBack} variant="outline" className="gap-2 border-gray-200">
            <ArrowLeft size={15} />
            Back to Decks
          </Button>
          {review.size > 0 && (
            <Button
              onClick={restartReview}
              className="bg-orange-500 hover:bg-orange-600 text-white font-semibold gap-2 border-0"
            >
              <RotateCcw size={15} />
              Review {review.size} Cards
            </Button>
          )}
          <Button onClick={restart} className="btn-yellow border-0 font-semibold gap-2">
            <RotateCcw size={15} />
            Restart All
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="text-gray-500 hover:text-black transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-black text-base truncate">{deck.deckName}</h2>
          <p className="text-xs text-gray-400">{deck.subject}</p>
        </div>
        <span className="text-sm text-gray-500 shrink-0">
          {currentIndex + 1} / {deck.cards.length}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Stats pills */}
      <div className="flex gap-3">
        <span className="text-xs bg-green-100 text-green-700 font-semibold px-3 py-1 rounded-full">
          ✓ {known.size} got it
        </span>
        <span className="text-xs bg-orange-100 text-orange-700 font-semibold px-3 py-1 rounded-full">
          ↺ {review.size} to review
        </span>
      </div>

      {/* Flashcard */}
      <div
        className="relative cursor-pointer"
        style={{ perspective: "1200px" }}
        onClick={handleFlip}
      >
        <div
          className="relative w-full transition-transform duration-500"
          style={{
            transformStyle: "preserve-3d",
            transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
            minHeight: "260px",
          }}
        >
          {/* Front */}
          <div
            className="absolute inset-0 bg-white border-2 border-gray-100 rounded-3xl shadow-lg flex flex-col items-center justify-center p-8 text-center"
            style={{ backfaceVisibility: "hidden" }}
          >
            <span className="text-xs font-semibold text-gray-400 mb-4 uppercase tracking-widest">Question</span>
            <p className="text-xl font-bold text-black leading-relaxed">{card.front}</p>
            <p className="text-xs text-gray-400 mt-6">Tap to reveal answer</p>
          </div>

          {/* Back */}
          <div
            className="absolute inset-0 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-3xl shadow-lg flex flex-col items-center justify-center p-8 text-center"
            style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
          >
            <span className="text-xs font-semibold text-black/50 mb-4 uppercase tracking-widest">Answer</span>
            <p className="text-xl font-bold text-black leading-relaxed">{card.back}</p>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      {isFlipped ? (
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={handleReview}
            className="flex flex-col items-center gap-2 py-4 rounded-2xl border-2 border-orange-200 bg-orange-50 hover:border-orange-300 hover:bg-orange-100 transition-all duration-200 group"
          >
            <ThumbsDown size={22} className="text-orange-500 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-semibold text-orange-600">Review Again</span>
          </button>
          <button
            onClick={handleKnow}
            className="flex flex-col items-center gap-2 py-4 rounded-2xl border-2 border-green-200 bg-green-50 hover:border-green-300 hover:bg-green-100 transition-all duration-200 group"
          >
            <ThumbsUp size={22} className="text-green-500 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-semibold text-green-600">Got It!</span>
          </button>
        </div>
      ) : (
        <button
          onClick={handleFlip}
          className="w-full py-4 rounded-2xl border-2 border-gray-200 bg-white hover:border-yellow-300 hover:bg-yellow-50 transition-all duration-200 text-sm font-semibold text-gray-600 hover:text-black"
        >
          Tap to flip card
        </button>
      )}
    </div>
  );
}
