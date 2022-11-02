var s = document.createElement('script');
window.addEventListener("load", function () {
    if (window.location.toString().match(/twitter\.com/i)) {

        ext_url = chrome.extension.getURL("index.html")
        $(document).on('click', '.btn-twitter-scrapper', function () {
            chrome.runtime.sendMessage({type: 'showOptions', action: 'followers', username: $(this).attr('data-link')});
        })
        setInterval(function () {
            $('main a').each(function () {
                if ($(this).attr('href').match(/followers$/)) {
                    if ($(this).closest('div').find('button.btn-twitter-scrapper').length == 0) {
                        $(this).closest('div').append('<button class="btn-twitter-scrapper" data-link="' + $(this).attr('href').replace(/https:\/\/twitter\.com|followers|\//gi, '') + '">Crawl followers</button>');
                    }
                }
            });
        }, 250);
    }

});
