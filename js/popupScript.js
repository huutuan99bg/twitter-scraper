document.getElementById('page_link').addEventListener('click', launchLiveHeaders, false);

function launchLiveHeaders (e) {
  e.preventDefault();
  chrome.tabs.create(
    {
      url: chrome.extension.getURL("index.html")
    }
  );
}