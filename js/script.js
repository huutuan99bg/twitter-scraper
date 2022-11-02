window.onload = () => {
    /* -----------------------Handle followers----------------------- */
    async function loadUserInfo(screen_name) {
        try {
            $('.progress-control-followers').addClass('hidden')
            $('#btn-load-user').attr('disabled', true);
            $('#btn-scrapy-followers').attr('disabled', true);
            let csrf_token = await getCookie('https://twitter.com/', 'ct0')
            var query_params = { screen_name: screen_name, withSafetyModeUserFields: true, withSuperFollowsUserFields: true }
            query_params = encodeURIComponent(JSON.stringify(query_params))
            var url = "https://twitter.com/i/api/graphql/mCbpQvZAw6zu_4PvuAUVVQ/UserByScreenName?variables=" + query_params;
            let user_info = await axios({
                method: 'get',
                url: url,
                headers: {
                    'authorization': tw_authorization,
                    "x-csrf-token": csrf_token,
                },
            });
            // Update info
            $('.user-info-link').attr('href', 'https://twitter.com/' + user_info.data.data.user.result.legacy.screen_name)
            $('.user-info-avatar img').attr('src', user_info.data.data.user.result.legacy.profile_image_url_https.replace(/normal/, '200x200'));
            $('.user-info-name').text(user_info.data.data.user.result.legacy.name);
            $('.user-info-username').text('@' + user_info.data.data.user.result.legacy.screen_name);
            $('.user-info-following').text(user_info.data.data.user.result.legacy.friends_count);
            $('.user-info-followers').text(user_info.data.data.user.result.legacy.followers_count);
            let current_limit = $('#followers-limit').val();
            $('#followers-limit').attr('max', user_info.data.data.user.result.legacy.followers_count)
            if (current_limit > user_info.data.data.user.result.legacy.followers_count) {
                $('#followers-limit').val(user_info.data.data.user.result.legacy.followers_count)
            }
            $('.user-info-id').text(user_info.data.data.user.result.rest_id);
            $('#followers-user-loaded').text(user_info.data.data.user.result.legacy.name)
            $('.user-info-panel').removeClass('hidden')
            $('#btn-scrapy-followers').attr('disabled', false);
        } catch (err) {
            $('.user-info-panel').addClass('hidden');
        } finally {
            $('#btn-load-user').attr('disabled', false);
        }
    }

    window.flag_crawl_followers = false;
    async function scrapyFollowersHandler() {
        window.flag_crawl_followers = true
        $('.progress-control-followers').removeClass('hidden');
        $('#btn-load-user').attr('disabled', true);
        $('#btn-scrapy-followers').attr('disabled', true);
        $('#btn-copy-scrapy-followers').attr('disabled', true);
        $('#followers-username').attr('disabled', true);
        $('#followers-limit').attr('disabled', true);
        let limit_crawl = $('#followers-limit').val();
        let cursor = null;
        let followers = new Set();
        $('#crawl-progress').text('Crawling ' + followers.size + '/' + limit_crawl)
        while (followers.size < limit_crawl) {
            followers_data = await scrapyFollowersRequests(cursor);
            cursor = followers_data.cursor;
            for (i = 0; i < followers_data.followers.length; i++) {
                if (followers.size < limit_crawl) {
                    try {
                        followers.add(followers_data.followers[i].content.itemContent.user_results.result.legacy.screen_name)
                    } catch (err) { }
                }
            }
            $('#crawl-progress').text('Crawling ' + followers.size + '/' + limit_crawl)
            if (window.flag_crawl_followers == false) {
                break;
            }
        }
        $(document).on('click', '#btn-copy-scrapy-followers', function () {
            copyToClipboard(Array.from(followers).join('\n'))
        })
        $('#btn-load-user').attr('disabled', false);
        $('#btn-scrapy-followers').attr('disabled', false);
        $('#btn-copy-scrapy-followers').attr('disabled', false);
        $('#followers-username').attr('disabled', false);
        $('#followers-limit').attr('disabled', false);
    }
    // -- End Handle followers
    /* -----------------------Handle Retweets----------------------- */

    function updateLimitScrapyRetweets() {
        let current_limit = parseFloat($('#retweets-limit').val());
        let crawl_option = $('input[name="retweets-scrapy-option"]:checked').val();
        if (crawl_option == 1) {
            $('#retweets-limit').attr('max', $('#retweets-limit').attr('limit-retweets'))
            if (current_limit > parseFloat($('#retweets-limit').attr('limit-retweets'))) {
                $('#retweets-limit').val($('#retweets-limit').attr('limit-retweets')).change()
            }
        } else if (crawl_option == 2 || crawl_option == 3) {
            $('#retweets-limit').attr('max', $('#retweets-limit').attr('limit-quotes'))
            if (current_limit > parseFloat($('#retweets-limit').attr('limit-quotes'))) {
                $('#retweets-limit').val($('#retweets-limit').attr('limit-quotes')).change()
            }
        } else if (crawl_option == 4) {
            $('#retweets-limit').attr('max', $('#retweets-limit').attr('limit-replies'))
            if (current_limit > parseFloat($('#retweets-limit').attr('limit-replies'))) {
                $('#retweets-limit').val($('#retweets-limit').attr('limit-replies')).change()
            }
        }
    }

    async function loadTweetInfo(tweetid) {
        try {
            $('.progress-control-retweets').addClass('hidden');
            $('#btn-load-tweet').attr('disabled', true);
            $('#btn-scrapy-retweets').attr('disabled', true);
            let csrf_token = await getCookie('https://twitter.com/', 'ct0')
            let query_params_variables = { focalTweetId: tweetid, with_rux_injections: false, includePromotedContent: true, withCommunity: true, withQuickPromoteEligibilityTweetFields: true, withBirdwatchNotes: false, withSuperFollowsUserFields: true, withDownvotePerspective: false, withReactionsMetadata: false, withReactionsPerspective: false, withSuperFollowsTweetFields: true, withVoice: true, withV2Timeline: true }
            let query_params_features = { dont_mention_me_view_api_enabled: true, interactive_text_enabled: true, responsive_web_uc_gql_enabled: true, vibe_api_enabled: true, responsive_web_edit_tweet_api_enabled: false, standardized_nudges_misinfo: true, tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled: false, responsive_web_enhance_cards_enabled: false }
            query_params_variables = encodeURIComponent(JSON.stringify(query_params_variables))
            query_params_features = encodeURIComponent(JSON.stringify(query_params_features))
            // Prepare tokens
            tw_authorization = await getLocalStorage('tw_authorization');
            csrf_token = await getCookie('https://twitter.com/', 'ct0');
            let url = "https://twitter.com/i/api/graphql/WyMlJ14PO-bRWaO5ZNUgBA/TweetDetail?variables=" + query_params_variables + '&features=' + query_params_features
            let response = await axios({
                method: 'get',
                url: url,
                headers: {
                    'authorization': tw_authorization,
                    "x-csrf-token": csrf_token,
                    "x-twitter-active-user": "yes",
                    "x-twitter-auth-type": "OAuth2Session",
                    "x-twitter-client-language": "vi",
                },
            });

            let entries = response.data.data.threaded_conversation_with_injections_v2.instructions.filter(function (el) {
                return el.type == "TimelineAddEntries";
            });
            let tweet_details = entries[0].entries.filter(function (el) {
                return el.entryId.match(/tweet/);
            });

            let author = tweet_details[0].content.itemContent.tweet_results.result.core.user_results.result.legacy;
            let tweet = tweet_details[0].content.itemContent.tweet_results.result.legacy
            $('.tweet-info-author-avt img').attr('src', author.profile_image_url_https);
            $('.tweet-info-author-name').text(author.name);
            $('.tweet-info-author-username').text(author.screen_name);

            let tweet_content = tweet.full_text.replace(/(?:\r\n|\r|\n)/g, '<br>');
            let hashtags = tweet_content.match(/\#(\w+)|\$(\w+)/gi) //, '<a href=""></a>'
            if (hashtags != null && hashtags.length > 0) {
                for (i = 0; i < hashtags.length; i++) {
                    let hastag_link = '<a href="https://twitter.com/hashtag/' + hashtags[i].replace(/\#|\$/g, '') + '">' + hashtags[i] + '</a>';
                    tweet_content = tweet_content.replace(hashtags[i], hastag_link)
                }
            }
            $('.tweet-content').html(tweet_content)
            const tweet_time = new Date(tweet.created_at);
            $('.tweet-time').text(tweet_time.toLocaleString())
            $('.retweets-count-link').attr('href', 'https://twitter.com/' + author.screen_name + '/status/' + tweetid + '/retweets')
            $('.retweets-quote-count-link').attr('href', 'https://twitter.com/' + author.screen_name + '/status/' + tweetid + '/retweets/with_comments')
            $('.like-count-link').attr('href', 'https://twitter.com/' + author.screen_name + '/status/' + tweetid + '/likes')
            $('.reply-count-link').attr('href', 'https://twitter.com/' + author.screen_name + '/status/' + tweetid)
            $('.retweets-count').text(tweet.retweet_count);
            $('.retweets-quote-count').text(tweet.quote_count);
            $('.like-count').text(tweet.favorite_count);
            $('.reply-count').text(tweet.reply_count);
            $('#retweets-limit').attr('limit-retweets', tweet.retweet_count).attr('limit-quotes', tweet.quote_count).attr('limit-replies', tweet.reply_count)
            $('.tweet-info-author-link').attr('href', 'https://twitter.com/' + author.screen_name);
            $('.tweet-info-panel').removeClass('hidden')
            updateLimitScrapyRetweets();

        } catch (err) { updateLimitScrapyRetweets() }
        finally {
            // Enable controls
            $('#btn-load-tweet').attr('disabled', false);
            $('#btn-scrapy-retweets').attr('disabled', false);
        }
    }

    // 
    window.flag_crawl_retweets = false;
    async function scrapyRetweetsHandler() {
        try {
            window.flag_crawl_retweets = true;
            $(document).off('click', '#btn-copy-scrapy-retweets')
            $('.progress-control-retweets').removeClass('hidden');
            $('#tweet-id').attr('disabled', true);
            $('#retweets-limit').attr('disabled', true);
            $('#btn-load-tweet').attr('disabled', true);
            $('input[name="retweets-scrapy-option"]').attr('disabled', true);
            $('#btn-scrapy-retweets').attr('disabled', true);
            $('#btn-copy-scrapy-retweets').attr('disabled', true);

            let limit_crawl = $('#retweets-limit').val();
            let cursor = null;
            let data_retweets = new Set();
            $('#crawl-progress').text('Crawling ' + data_retweets.size + '/' + limit_crawl)
            let tweet_id = $('#tweet-id').val().replace(/@/, '');
            if (tweet_id.match(/twitter\.com/)) {
                tweet_id = tweet_id.match(/status.*\d+/)[0].replace(/status|\//g, '')
            }

            let crawl_option = $('input[name="retweets-scrapy-option"]:checked').val();
            if (crawl_option == 1) {
                let retweeters = new Set();
                while (retweeters.size < limit_crawl) {
                    let retweeters_data = await scrapyRetweetersRequests(tweet_id, cursor)
                    cursor = retweeters_data.cursor;

                    for (i = 0; i < retweeters_data.retweeters.length; i++) {
                        if (retweeters.size < limit_crawl) {
                            try {
                                retweeters.add(retweeters_data.retweeters[i].content.itemContent.user_results.result.legacy.screen_name)
                            } catch (err) { }
                        } else {
                            break;
                        }
                    }
                    $('#crawl-retweets-progress').text('Crawling ' + retweeters.size + '/' + limit_crawl)
                    if (window.flag_crawl_retweets == false) {
                        break;
                    }
                }
                $(document).on('click', '#btn-copy-scrapy-retweets', function () {
                    copyToClipboard(Array.from(retweeters).join('\n'))
                })
            } else if (crawl_option == 2 || crawl_option == 3) {
                let tweets = new Set();
                while (tweets.size < limit_crawl) {
                    quote_tweets = await scrapyQuoteRetweetsRequests(tweet_id, cursor)
                    cursor = quote_tweets.cursor;
                    for (i = 0; i < quote_tweets.tweets.length; i++) {
                        if (tweets.size < limit_crawl) {
                            try {
                                if (crawl_option == 2) {
                                    tweets.add('https://twitter.com/' + quote_tweets.tweets[i].author + '/status/' + quote_tweets.tweets[i].tweet)
                                } else if (crawl_option == 3) {
                                    tweets.add('https://twitter.com/' + quote_tweets.tweets[i].author + '/status/' + quote_tweets.tweets[i].tweet + '|' + quote_tweets.tweets[i].author)
                                }
                            } catch (err) { }

                        } else {
                            break;
                        }
                    }
                    $('#crawl-retweets-progress').text('Crawling ' + tweets.size + '/' + limit_crawl)
                    if (window.flag_crawl_retweets == false) {
                        break;
                    }
                }
                $(document).on('click', '#btn-copy-scrapy-retweets', function () {
                    copyToClipboard(Array.from(tweets).join('\n'))
                })
            } else if (crawl_option == 4) {
                let replies = new Set();
                // let replies_data = await scrapyRepliesRequests(tweet_id, cursor)
                while (replies.size < limit_crawl) {
                    let replies_data = await scrapyRepliesRequests(tweet_id, cursor)
                    cursor = replies_data.cursor;
                    for (i = 0; i < replies_data.replies.length; i++) {
                        if (replies.size < limit_crawl) {
                            try {
                                replies.add(replies_data.replies[i])
                            } catch (err) { }
                        } else {
                            break;
                        }
                    }
                    $('#crawl-retweets-progress').text('Crawling ' + replies.size + '/' + limit_crawl)
                    if (window.flag_crawl_retweets == false) {
                        break;
                    }
                }
                $(document).on('click', '#btn-copy-scrapy-retweets', function () {
                    copyToClipboard(Array.from(replies).join('\n'))
                })
            }
        } catch (err) { }
        finally {
            $('#tweet-id').attr('disabled', false);
            $('#retweets-limit').attr('disabled', false);
            $('#btn-load-tweet').attr('disabled', false);
            $('input[name="retweets-scrapy-option"]').attr('disabled', false);
            $('#btn-scrapy-retweets').attr('disabled', false);
            $('#btn-copy-scrapy-retweets').attr('disabled', false);
        }
    }
    // -- End Handle Retweets

    /* -----------------------Main program----------------------- */
    var tw_authorization = null;
    var csrf_token = null;
    async function init() {
        // get Tokens
        tw_authorization = await getLocalStorage('tw_authorization');
        csrf_token = await getCookie('https://twitter.com/', 'ct0')

        if (tw_authorization && csrf_token) {
            // check username from query parameters
            const queryString = window.location.search;
            const urlParams = new URLSearchParams(queryString);
            if (urlParams.get('crawl_follower') != null) {
                $('#followers-username').val(urlParams.get('crawl_follower'))
                loadUserInfo(urlParams.get('crawl_follower'))
            }
            // Crawl followers
            $(document).on('click', '#btn-load-user', function () {
                loadUserInfo($('#followers-username').val().replace(/@/, ''))
            })
            $(document).on('click', '#btn-scrapy-followers', scrapyFollowersHandler)
            $(document).on('click', '#btn-stop-scrapy-followers', function () {
                window.flag_crawl_followers = false;
            })


            // Crawl retweets 
            $(document).on('click', '#btn-load-tweet', function () {
                let tweet_id = $('#tweet-id').val().replace(/@/, '');
                if (tweet_id.match(/twitter\.com/)) {
                    tweet_id = tweet_id.match(/status.*\d+/)[0].replace(/status|\//g, '')
                }
                loadTweetInfo(tweet_id)
                $(document).on('click', '#btn-scrapy-retweets', scrapyRetweetsHandler)
            })
            $(document).on('click', '#btn-stop-scrapy-retweets', function () {
                window.flag_crawl_retweets = false;
            })
            $('input[name="retweets-scrapy-option"]').change(function () {
                updateLimitScrapyRetweets()
            })
            $(document).on('change', '#retweets-limit', function () {
                if (parseFloat($(this).val()) > parseFloat($(this).attr('max'))) {
                    $(this).val($(this).attr('max'));
                }
            })
        } else {
            $('.panel-group').addClass('hidden');
            $('.login-warning').removeClass('hidden');
        }
    }
    init()







}
