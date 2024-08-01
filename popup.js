let enabled = true;

document.getElementById('toggle').addEventListener('click', () => {
  enabled = !enabled;
  document.getElementById('status').textContent = enabled ? 'enabled' : 'disabled';
  browser.tabs.query({active: true, currentWindow: true}, (tabs) => {
    browser.tabs.sendMessage(tabs[0].id, {enabled: enabled});
  });
});