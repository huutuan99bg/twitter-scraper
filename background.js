var callback = function (info) {
    if (info.requestHeaders !== undefined && info.requestHeaders.length > 0) {
        for (i = 0; i < info.requestHeaders.length; i++) {
            if (info.requestHeaders[i].name == "authorization") {
                chrome.storage.sync.set({ 'tw_authorization': info.requestHeaders[i].value }, function () {
                    console.log('added authorization');
                });
            }
        }
    }
    if (info.url.match(/Followers/g)) {
        chrome.storage.sync.set({ 'tw_headers': info.requestHeaders }, function () {
            console.log('added headers');
        });
    }

};
var filter = {
    urls: ["<all_urls>"],
    types: ["main_frame", "sub_frame", "stylesheet", "script", "image", "object", "xmlhttprequest", "other"]
};
var addInfo = ["requestHeaders"];
chrome.webRequest.onSendHeaders.addListener(callback, filter, addInfo);

chrome.runtime.onMessage.addListener((request) => {
    if (request.type === "showOptions") {
        if (request.action === "followers") {
            chrome.tabs.create(
                {
                    url: chrome.extension.getURL("index.html?crawl_follower="+request.username)
                });
        }
    }
});