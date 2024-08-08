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
let classifier = null;

// Simple tokenizer function
function simpleTokenizer(text) {
  const tokens = text.toLowerCase().match(/\b(\w+)\b/g);
  return tokens || [];
}

// Function to load embeddings
function loadEmbeddings(callback) {
  fetch(browser.runtime.getURL('glove_50d.json'))
    .then(response => response.json())
    .then(data => {
      embeddings = data;
      if (callback) callback();
    });
}

// Function to load the zero-shot classification model
async function loadZeroShotModel(callback) {
  try {
    const modelUrl = browser.runtime.getURL('models/tfjs_model/model.json');
    classifier = await tf.loadGraphModel(modelUrl);
    console.log('Zero-shot classifier loaded.');
    if (callback) callback();
  } catch (error) {
    console.error('Error loading zero-shot model:', error);
  }
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
  const words = simpleTokenizer(text);
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

// Zero-shot classification
async function zeroShotClassification(text) {
  if (!classifier) {
    console.error('Zero-shot classifier is not loaded.');
    return false;
  }

  const tokens = simpleTokenizer(text);
  if (tokens.length === 0) {
    return false; // Handle empty input
  }

  const inputIds = tokens.map(token => token.charCodeAt(0)); // Simple encoding
  const attentionMask = inputIds.map(() => 1); // Create an attention mask

  const inputIdsTensor = tf.tensor([inputIds], [1, inputIds.length], 'int32');
  const attentionMaskTensor = tf.tensor([attentionMask], [1, attentionMask.length], 'int32');

  const predictions = await classifier.executeAsync({
    input_ids: inputIdsTensor,
    attention_mask: attentionMaskTensor
  });

  const result = predictions.arraySync();
  const score = result[0][0];
  return score > threshold;
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
  return keywordMatch || isCosineMatch;
}

// Set threshold
function setThreshold(newThreshold) {
  threshold = newThreshold;
  console.log(`New threshold set to: ${threshold}`);
}

export { loadEmbeddings, loadZeroShotModel, keywordMatching, cosineSimilarityDetection, combinedDetection, zeroShotClassification, setThreshold };
