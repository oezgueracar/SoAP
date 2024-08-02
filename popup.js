document.addEventListener('DOMContentLoaded', function () {
  const detectionMethodSelect = document.getElementById('detection-method');
  const thresholdSliderContainer = document.getElementById('threshold-slider-container');
  const thresholdSlider = document.getElementById('threshold-slider');
  const thresholdValue = document.getElementById('threshold-value');
  const statusMessage = document.getElementById('status');
  const toggleActiveButton = document.getElementById('toggle-active');
  const exemptedSiteButton = document.getElementById('exempted-site-button');
  const exemptedSitesList = document.getElementById('exempted-sites');

  // Load saved settings
  browser.storage.local.get(['detectionMethod', 'threshold', 'isActive', 'exemptedSites'], function (result) {
    console.log('Loaded settings:', result);
    if (result.detectionMethod) {
      detectionMethodSelect.value = result.detectionMethod;
      updateThresholdVisibility(result.detectionMethod);
    }
    if (result.threshold !== undefined) {
      thresholdSlider.value = result.threshold;
      thresholdValue.textContent = result.threshold;
    }
    if (result.isActive !== undefined) {
      toggleActiveButton.textContent = result.isActive ? 'Deactivate' : 'Activate';
    }
    if (result.exemptedSites) {
      exemptedSitesList.innerHTML = '';
      result.exemptedSites.forEach(site => {
        const listItem = document.createElement('li');
        listItem.textContent = site;
        listItem.addEventListener('click', function () {
          browser.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            browser.tabs.sendMessage(tabs[0].id, { action: 'removeExemptedSite', site });
          });
        });
        exemptedSitesList.appendChild(listItem);
      });
    }

    // Check if the current site is exempted
    browser.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      const url = new URL(tabs[0].url);
      const site = url.hostname;
      if (result.exemptedSites && result.exemptedSites.includes(site)) {
        exemptedSiteButton.textContent = 'Remove Current Site from Exempted Sites';
      } else {
        exemptedSiteButton.textContent = 'Add Current Site to Exempted Sites';
      }
    });
  });

  function showReloadMessage() {
    statusMessage.style.display = 'block';
  }

  function updateThresholdVisibility(method) {
    if (method === 'keyword') {
      thresholdSliderContainer.style.display = 'none';
    } else {
      thresholdSliderContainer.style.display = 'block';
    }
  }

  detectionMethodSelect.addEventListener('change', function () {
    const method = detectionMethodSelect.value;
    console.log('Detection method changed to:', method);
    browser.storage.local.set({ detectionMethod: method });
    updateThresholdVisibility(method);
    browser.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      browser.tabs.sendMessage(tabs[0].id, { action: 'setDetectionMethod', method: method });
    });
    showReloadMessage();
  });

  thresholdSlider.addEventListener('input', function () {
    thresholdValue.textContent = thresholdSlider.value;
  });

  thresholdSlider.addEventListener('change', function () {
    const newThreshold = parseFloat(thresholdSlider.value);
    console.log('Threshold changed to:', newThreshold);
    browser.storage.local.set({ threshold: newThreshold });
    browser.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      browser.tabs.sendMessage(tabs[0].id, { action: 'setThreshold', threshold: newThreshold });
    });
    showReloadMessage();
  });

  toggleActiveButton.addEventListener('click', function () {
    const newIsActive = toggleActiveButton.textContent === 'Activate';
    toggleActiveButton.textContent = newIsActive ? 'Deactivate' : 'Activate';
    browser.storage.local.set({ isActive: newIsActive });
    browser.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      browser.tabs.sendMessage(tabs[0].id, { action: 'toggleActive', isActive: newIsActive });
    });
  });

  exemptedSiteButton.addEventListener('click', function () {
    browser.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      const url = new URL(tabs[0].url);
      const site = url.hostname;
      if (site) {
        browser.storage.local.get(['exemptedSites'], function (result) {
          let exemptedSites = result.exemptedSites || [];
          if (exemptedSites.includes(site)) {
            exemptedSites = exemptedSites.filter(s => s !== site);
            exemptedSiteButton.textContent = 'Add Current Site to Exempted Sites';
            browser.tabs.sendMessage(tabs[0].id, { action: 'removeExemptedSite', site });
          } else {
            exemptedSites.push(site);
            exemptedSiteButton.textContent = 'Remove Current Site from Exempted Sites';
            browser.tabs.sendMessage(tabs[0].id, { action: 'addExemptedSite', site });
          }
          browser.storage.local.set({ exemptedSites });
        });
      }
    });
  });
});
