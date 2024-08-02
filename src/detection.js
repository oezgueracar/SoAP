// detection.js

const keywords = ['American Politics', 'Trump', 'Biden', 'Kamala', 'Obama', 'White House'];
const targetWords = ['american politics', 'trump', 'biden', 'obama', 'kamala'];

let threshold = 0.85; // Cosine detection sensitivity; Higher means less sensitive

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

function cosineSimilarity(vecA, vecB) {
  const dotProduct = vecA.reduce((sum, val, i) => sum + val * vecB[i], 0);
  const magnitudeA = Math.sqrt(vecA.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(vecB.reduce((sum, val) => sum + val * val, 0));
  const cosineSim = dotProduct / (magnitudeA * magnitudeB);
  // Normalize the cosine similarity to be between 0 and 1
  return (cosineSim + 1) / 2;
}

function getVector(word) {
  return embeddings[word.toLowerCase()] || null;
}

function calculateSimilarity(text, targetWords) {
  const words = text.split(/\W+/);
  
  for (const word of words) {
    const wordVector = getVector(word);
    if (wordVector) {
      for (const targetWord of targetWords) {
        const targetVector = getVector(targetWord);
        if (targetVector) {
          const score = cosineSimilarity(wordVector, targetVector);
          console.log(`Word: "${word}" - Target: "${targetWord}" - Score: ${score}`);
          if (score > threshold) {
            return true; // If any word exceeds the threshold, consider it similar
          }
        }
      }
    }
  }
  return false; // No word exceeded the threshold
}

// Keyword Matching Method
function keywordMatching(text) {
  return keywords.some(keyword => new RegExp(`\\b${keyword}\\b`, 'i').test(text));
}

// Cosine Similarity Method
function cosineSimilarityDetection(text) {
  return calculateSimilarity(text, targetWords);
}

// Combined Method
function combinedDetection(text) {
  const keywordMatch = keywordMatching(text);
  const isCosineMatch = cosineSimilarityDetection(text);

  console.log(`Text: "${text}" - Keyword Match: ${keywordMatch} - Cosine Similarity Match: ${isCosineMatch}`);

  return keywordMatch || isCosineMatch;
}

// Function to set the threshold dynamically
function setThreshold(newThreshold) {
  threshold = newThreshold;
  console.log(`New threshold set to: ${threshold}`);
}

module.exports = { loadEmbeddings, keywordMatching, cosineSimilarityDetection, combinedDetection, setThreshold };