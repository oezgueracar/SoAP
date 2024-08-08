import * as tf from '@tensorflow/tfjs';

const keywords = ['American Politics', 'Trump', 'Biden', 'Kamala', 'Obama', 'White House'];
const targetWords = [
  ['american', 'politics'],
  ['trump'],
  ['biden'],
  ['obama'],
  ['kamala'],
  ['white', 'house']
];

let threshold = 0.85;
let embeddings = {};

// Function to load embeddings
function loadEmbeddings(callback) {
  fetch(browser.runtime.getURL('glove_50d.json'))
    .then(response => response.json())
    .then(data => {
      embeddings = data;
      if (callback) callback();
    });
}

// Cosine similarity calculation
function cosineSimilarity(vecA, vecB) {
  const dotProduct = vecA.reduce((sum, val, i) => sum + val * vecB[i], 0);
  const magnitudeA = Math.sqrt(vecA.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(vecB.reduce((sum, val) => sum + val * val, 0));
  return (dotProduct / (magnitudeA * magnitudeB) + 1) / 2;
}

// Get vector for a word
function getVector(word) {
  return embeddings[word.toLowerCase()] || null;
}

// Calculate similarity
function calculateSimilarity(text, targetWords) {
  const words = text.split(/\W+/);

  for (const wordGroup of targetWords) {
    let allAboveThreshold = false;

    for (const targetWord of wordGroup) {
      let wordAboveThreshold = false;

      for (const word of words) {
        const wordVector = getVector(word);

        if (wordVector) {
          const targetVector = getVector(targetWord);

          if (targetVector) {
            const score = cosineSimilarity(wordVector, targetVector);
            console.log(`Word: "${word}" - Target: "${targetWord}" - Score: ${score}`);
            
            if (score > threshold) {
              wordAboveThreshold = true;
              break;
            }
          }
        }
      }

      if (!wordAboveThreshold) {
        allAboveThreshold = false;
        break;
      }

      allAboveThreshold = true;
    }

    if (allAboveThreshold) {
      return true;
    }
  }
  return false;
}

// Keyword matching
function keywordMatching(text) {
  return keywords.some(keyword => new RegExp(`\\b${keyword}\\b`, 'i').test(text));
}

// Cosine similarity detection
function cosineSimilarityDetection(text) {
  return calculateSimilarity(text, targetWords);
}

// Combined detection method
function combinedDetection(text) {
  const keywordMatch = keywordMatching(text);
  const isCosineMatch = cosineSimilarityDetection(text);

  console.log(`Text: "${text}" - Keyword Match: ${keywordMatch} - Cosine Similarity Match: ${isCosineMatch}`);

  return keywordMatch || isCosineMatch;
}

// Set threshold
function setThreshold(newThreshold) {
  threshold = newThreshold;
  console.log(`New threshold set to: ${threshold}`);
}

export { loadEmbeddings, keywordMatching, cosineSimilarityDetection, combinedDetection, setThreshold };
