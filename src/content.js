import { loadEmbeddings, loadZeroShotModel, keywordMatching, cosineSimilarityDetection, combinedDetection, zeroShotClassification, setThreshold } from './detection.js';

const replacementText = 'Content Replaced. Click to reveal original content.';
let detectionMethod = 'combined'; // Default to 'combined'
let isActive = true; // Default to active
let exemptedSites = [];

// Load saved settings
browser.storage.local.get(['detectionMethod', 'threshold', 'isActive', 'exemptedSites'], async function (result) {
  if (result.detectionMethod) {
    detectionMethod = result.detectionMethod;
    console.log(`Loaded detection method: ${detectionMethod}`);
  }
  if (result.threshold !== undefined) {
    setThreshold(result.threshold);
    console.log(`Loaded threshold: ${result.threshold}`);
  }
  if (result.isActive !== undefined) {
    isActive = result.isActive;
    console.log(`Loaded active state: ${isActive}`);
  }
  if (result.exemptedSites) {
    exemptedSites = result.exemptedSites;
    console.log(`Loaded exempted sites: ${exemptedSites}`);
  }

  if (isActive && !isExemptedSite(window.location.hostname)) {
    if (detectionMethod === 'zero-shot') {
      await loadZeroShotModel(applyTextReplacement);
    } else {
      loadEmbeddings(applyTextReplacement);
    }
  }
});

// Check if the current site is exempted
function isExemptedSite(hostname) {
  return exemptedSites.some(site => hostname.includes(site));
}

// Decide if content should be censored
async function shouldCensorContent(text) {
  switch (detectionMethod) {
    case 'keyword':
      return keywordMatching(text);
    case 'cosine':
      return cosineSimilarityDetection(text);
    case 'zero-shot':
      return await zeroShotClassification(text);
    case 'combined':
    default:
      return combinedDetection(text);
  }
}

// Replace text within a container
async function replaceContainerContent(container) {
  if (!container.hasAttribute('data-processed')) {
    const originalHtml = container.innerHTML;
    if (await shouldCensorContent(originalHtml)) {
      container.setAttribute('data-original-html', originalHtml);
      container.setAttribute('data-processed', 'true');
      container.innerHTML = replacementText;
      container.style.cursor = 'pointer';
      container.addEventListener('click', revealOriginalContent, true);
      console.log(`Replacing content in container: <${container.tagName.toLowerCase()}>`);
    }
  }
}

// Process text nodes
async function processTextNodes(node) {
  if (node.nodeType === 3) { // Text node
    const text = node.nodeValue;
    if (await shouldCensorContent(text)) {
      const container = findClosestContainer(node);
      if (container) {
        await replaceContainerContent(container);
      }
    }
  } else if (node.nodeType === 1 && node.childNodes && !/(script|style|textarea|input)/i.test(node.tagName)) {
    if (!node.hasAttribute('data-processed')) {
      for (let i = 0; i < node.childNodes.length; i++) {
        await processTextNodes(node.childNodes[i]);
      }
    }
  }
}

// Find the closest container
function findClosestContainer(node) {
  while (node && node.parentNode) {
    node = node.parentNode;
    if (node.tagName === 'DIV' || node.tagName === 'P' || node.tagName === 'ARTICLE') {
      return node;
    }
  }
  return null;
}

// Reveal the original content
function revealOriginalContent(event) {
  event.preventDefault();
  event.stopPropagation();
  const container = event.currentTarget;
  observer.disconnect(); // Temporarily disconnect the observer
  revealContentRecursively(container);
  observer.observe(document.body, observerConfig); // Reconnect the observer after revealing content
}

// Recursively reveal the original content of a container and its children
function revealContentRecursively(container) {
  const originalHtml = container.getAttribute('data-original-html');
  if (originalHtml) {
    container.innerHTML = originalHtml;
    container.removeAttribute('data-original-html');
    container.removeAttribute('data-processed');
    container.style.cursor = 'auto';
    container.removeEventListener('click', revealOriginalContent, true);
  }
  for (let child of container.children) {
    revealContentRecursively(child);
  }
}

// Apply text replacement
async function applyTextReplacement() {
  await processTextNodes(document.body);

  // Create a MutationObserver to watch for changes in the DOM
  observer = new MutationObserver(async (mutations) => {
    for (let mutation of mutations) {
      for (let node of mutation.addedNodes) {
        await processTextNodes(node);
      }
    }
  });

  // Start observing the document body
  observer.observe(document.body, observerConfig);
}

// Declare observer at the correct scope
let observer;

// Configuration for the observer (which mutations to observe)
const observerConfig = {
  childList: true,
  subtree: true
};

// Listen for messages from the popup
browser.runtime.onMessage.addListener(async (message) => {
  if (message.action === 'setDetectionMethod' && ['keyword', 'cosine', 'zero-shot', 'combined'].includes(message.method)) {
    detectionMethod = message.method;
    console.log(`Detection method set to: ${message.method}`);
    if (detectionMethod === 'zero-shot' && !classifier) {
      await loadZeroShotModel();
    }
  } else if (message.action === 'setThreshold' && typeof message.threshold === 'number') {
    setThreshold(message.threshold);
    console.log(`Threshold set to: ${message.threshold}`);
  } else if (message.action === 'toggleActive' && typeof message.isActive === 'boolean') {
    isActive = message.isActive;
    browser.storage.local.set({ isActive });
    console.log(`Active state set to: ${isActive}`);
    if (isActive && !isExemptedSite(window.location.hostname)) {
      if (detectionMethod === 'zero-shot' && !classifier) {
        await loadZeroShotModel(applyTextReplacement);
      } else {
        applyTextReplacement();
      }
      observer.observe(document.body, observerConfig);
    } else {
      observer.disconnect();
      window.location.reload(); // Reload the page to clear replacements
    }
  } else if (message.action === 'addExemptedSite' && typeof message.site === 'string') {
    if (!exemptedSites.includes(message.site)) {
      exemptedSites.push(message.site);
      browser.storage.local.set({ exemptedSites });
      console.log(`Added exempted site: ${message.site}`);
    }
  } else if (message.action === 'removeExemptedSite' && typeof message.site === 'string') {
    const index = exemptedSites.indexOf(message.site);
    if (index > -1) {
      exemptedSites.splice(index, 1);
      browser.storage.local.set({ exemptedSites });
      console.log(`Removed exempted site: ${message.site}`);
    }
  }
});
