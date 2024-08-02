// embedding.js

// Load the embeddings
let embeddings = {};
fetch(browser.runtime.getURL('glove_50d.json'))
  .then(response => response.json())
  .then(data => {
    embeddings = data;
  });

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
          similarityScore += cosineSimilarity(wordVector, targetVector);
          count += 1;
        }
      });
    }
  });

  return count > 0 ? similarityScore / count : 0;
}

// Export the function
export { calculateSimilarity };