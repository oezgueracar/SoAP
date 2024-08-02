// detection.js

const keywords = ['American Politics', 'Trump', 'Biden', 'Kamala', 'Obama', 'White House'];
const targetWords = [
  ['american', 'politics'],
  ['trump'],
  ['biden'],
  ['obama'],
  ['kamala'],
  ['white', 'house']
];

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
              break; // Break inner loop if a target word exceeds threshold to continue checking next target word
              // It could make more sense here that instead all target words need to exceeded the threshold for one single word... 
            }
          }
        }
      }

      if (!wordAboveThreshold) {
        allAboveThreshold = false;
        break; // Break if any word in the group does not exceed threshold
      }

      allAboveThreshold = true; // Set to true only if the current word exceeds the threshold
    }

    if (allAboveThreshold) {
      return true; // If all words in the group exceed the threshold, consider it similar
    }
  }
  
  return false; // No group of words exceeded the threshold
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