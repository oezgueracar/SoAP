const keywords = ['Trump', 'Biden', 'Obama', 'Congress', 'Senate', 'White House', 'election'];
const replacementText = '[Content Replaced]';

function containsKeyword(text) {
  return keywords.some(keyword => new RegExp(`\\b${keyword}\\b`, 'i').test(text));
}

function findClosestContainer(node) {
  // Traverse upwards to find a reasonable container like <div> or <p>
  while (node && node.parentNode) {
    node = node.parentNode;
    if (node.tagName === 'DIV' || node.tagName === 'P' || node.tagName === 'ARTICLE') {
      return node;
    }
  }
  return null;
}

function replaceText(node) {
  if (node.nodeType === 3) { // Text node
    let text = node.nodeValue;
    if (containsKeyword(text)) {
      let container = findClosestContainer(node);
      if (container) {
        container.innerHTML = replacementText;
      } else {
        node.nodeValue = replacementText;
      }
    }
  } else if (node.nodeType === 1 && node.childNodes && !/(script|style|textarea|input)/i.test(node.tagName)) {
    for (let i = 0; i < node.childNodes.length; i++) {
      replaceText(node.childNodes[i]);
    }
  }
}

function applyTextReplacement() {
  replaceText(document.body);
}

// Initial replacement on page load
applyTextReplacement();

// Create a MutationObserver to watch for changes in the DOM
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    for (let i = 0; i < mutation.addedNodes.length; i++) {
      replaceText(mutation.addedNodes[i]);
    }
  });
});

// Configuration for the observer (which mutations to observe)
const config = {
  childList: true, 
  subtree: true
};

// Start observing the document body
observer.observe(document.body, config);
