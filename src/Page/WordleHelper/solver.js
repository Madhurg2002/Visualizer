
import { WORDS } from './words';

export const LetterState = {
    CORRECT: 'correct', // Green
    PRESENT: 'present', // Yellow
    ABSENT: 'absent',   // Gray
    EMPTY: 'empty'
};

// Filter candidates based on guess and feedback
export const filterWords = (candidates, guess, feedback) => {
    return candidates.filter(word => {
        const wordArr = word.split('');
        const guessArr = guess.split('');
        
        // Check CORRECT (Green) first
        for (let i = 0; i < 5; i++) {
            if (feedback[i] === LetterState.CORRECT) {
                if (wordArr[i] !== guessArr[i]) return false;
                wordArr[i] = null; // Mark as matched
                guessArr[i] = null;
            }
        }

        // Check PRESENT (Yellow) and ABSENT (Gray)
        for (let i = 0; i < 5; i++) {
            const letter = guessArr[i];
            const status = feedback[i];

            if (status === LetterState.CORRECT) continue; // Already handled

            if (status === LetterState.PRESENT) {
                // Must exist elsewhere in wordArr
                const idx = wordArr.indexOf(letter);
                if (idx === -1) return false; // Letter not found
                if (word[i] === letter) return false; // Yellow means it's NOT at this position
                wordArr[idx] = null; // Mark as matched
            } else if (status === LetterState.ABSENT) {
                // Must NOT exist in remaining wordArr
                if (wordArr.includes(letter)) return false;
            }
        }
        return true;
    });
};

// Calculate best guess based on letter frequency in remaining candidates
export const getBestGuess = (candidates) => {
    if (candidates.length === 0) return { likely: null, eliminator: null };
    // If only one candidate, it's the answer. No need to eliminate.
    if (candidates.length === 1) return { likely: candidates[0], eliminator: null };

    // Frequency map of letters in candidates
    const freq = {};
    candidates.forEach(word => {
        const unique = new Set(word.split(''));
        unique.forEach(char => {
            freq[char] = (freq[char] || 0) + 1;
        });
    });

    // Score function based on letter frequency
    const getScore = (word) => {
        const unique = new Set(word.split(''));
        let score = 0;
        unique.forEach(char => {
            score += freq[char] || 0;
        });
        return score;
    };

    // Best "Likely" (from candidates)
    let likely = candidates[0];
    let maxLikelyScore = -1;

    candidates.forEach(word => {
        const score = getScore(word);
        if (score > maxLikelyScore) {
            maxLikelyScore = score;
            likely = word;
        }
    });

    // Best "Eliminator" (from ALL WORDS)
    // Only compute if candidates > 2, otherwise just guess.
    let eliminator = null;
    if (candidates.length > 2) {
        let maxElimScore = -1;
        WORDS.forEach(word => {
            const score = getScore(word);
            if (score > maxElimScore) {
                maxElimScore = score;
                eliminator = word;
            }
        });
    }

    return { likely, eliminator };
};

// Sort candidates by letter frequency (proxy for probability)
export const sortCandidates = (candidates) => {
    if (candidates.length < 2) return candidates;

    // Frequency map of letters in current candidates
    const freq = {};
    candidates.forEach(word => {
        const unique = new Set(word.split(''));
        unique.forEach(char => {
            freq[char] = (freq[char] || 0) + 1;
        });
    });

    // Score function
    const getScore = (word) => {
        const unique = new Set(word.split(''));
        let score = 0;
        unique.forEach(char => {
            score += freq[char] || 0; 
        });
        return score; // Higher is better (more common letters)
    };

    // Sort descending
    return [...candidates].sort((a, b) => getScore(b) - getScore(a));
};
