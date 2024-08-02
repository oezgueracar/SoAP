// detection.js

const keywords = ['Trump', 'Biden', 'Kamala', 'Obama', 'White House'];
const targetWords = ['american', 'politics', 'trump', 'biden', 'obama', 'kamala', 'white house'];
const threshold = 0.6; // Adjust the threshold based on desired sensitivity

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
  return dotProduct / (magnitudeA * magnitudeB);
}

function getVector(word) {
  return embeddings[word.toLowerCase()] || null;
}

function calculateSimilarity(text, targetWords) {
  const words = text.split(/\W+/);
  let similarityScore = 0;
  let count = 0;

  words.forEach(word => {
    const wordVector = getVector(word);
    if (wordVector) {
      targetWords.forEach(targetWord => {
        const targetVector = getVector(targetWord);
        if (targetVector) {
          const score = cosineSimilarity(wordVector, targetVector);
          console.log(`Word: "${word}" - Target: "${targetWord}" - Score: ${score}`);
          similarityScore += score;
          count += 1;
        }
      });
    }
  });

  const averageScore = count > 0 ? similarityScore / count : 0;
  console.log(`Text: "${text}" - Average Similarity Score: ${averageScore}`);
  return averageScore;
}

// Keyword Matching Method
function keywordMatching(text) {
  return keywords.some(keyword => new RegExp(`\\b${keyword}\\b`, 'i').test(text));
}

// Cosine Similarity Method
function cosineSimilarityDetection(text) {
  return calculateSimilarity(text, targetWords) > threshold;
}

// Combined Method
function combinedDetection(text) {
  const keywordMatch = keywordMatching(text);
  const similarityScore = calculateSimilarity(text, targetWords);
  const isCosineMatch = similarityScore > threshold;

  console.log(`Text: "${text}" - Keyword Match: ${keywordMatch} - Cosine Similarity Match: ${isCosineMatch}`);

  return keywordMatch || isCosineMatch;
}

// Function to set the threshold dynamically
function setThreshold(newThreshold) {
  threshold = newThreshold;
  console.log(`New threshold set to: ${threshold}`);
}

module.exports = { loadEmbeddings, keywordMatching, cosineSimilarityDetection, combinedDetection, setThreshold };