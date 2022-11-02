const getLocalStorage = async (key) => {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get([key], function (result) {
            if (result[key] === undefined) {
                reject();
            } else {
                resolve(result[key]);
            }
        });
    });
};

const getCookie = async (domain, name) => {
    return new Promise((resolve, reject) => {
        chrome.cookies.get({ "url": domain, "name": name }, function (cookie) {
            if (cookie.value === undefined) {
                reject();
            } else {
                resolve(cookie.value);
            }
        });
    });
};

function copyToClipboard(text) {
    var input = document.createElement('textarea');
    input.innerHTML = text;
    document.body.appendChild(input);
    input.select();
    var result = document.execCommand('copy');
    document.body.removeChild(input);
    return result;
}
async function scrapyFollowersRequests(cursor) {
    // prepare data
    let user_id = $('.user-info-id').text();
    let query_params_variables = {
        userId: user_id,
        count: 100,
        includePromotedContent: false, withSuperFollowsUserFields: true, withDownvotePerspective: false, withReactionsMetadata: false, withReactionsPerspective: false, withSuperFollowsTweetFields: true
    }
    if (cursor !== null) {
        query_params_variables.cursor = cursor;
    }
    let query_params_features = { "dont_mention_me_view_api_enabled": true, "interactive_text_enabled": true, "responsive_web_uc_gql_enabled": false, "vibe_api_enabled": true, "responsive_web_edit_tweet_api_enabled": false, "standardized_nudges_misinfo": true, "tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled": false, "responsive_web_enhance_cards_enabled": false }

    query_params_variables = encodeURIComponent(JSON.stringify(query_params_variables))
    query_params_features = encodeURIComponent(JSON.stringify(query_params_features))
    // Prepare tokens
    tw_authorization = await getLocalStorage('tw_authorization');
    csrf_token = await getCookie('https://twitter.com/', 'ct0');
    let url = "https://twitter.com/i/api/graphql/a-axzHukYWqtkmMyYMVe1g/Followers?variables=" + query_params_variables + '&features=' + query_params_features
    // Get data
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
    // console.log(followers.data.data.user.result.timeline.timeline.instructions[2].entries);
    let entries = response.data.data.user.result.timeline.timeline.instructions.filter(function (el) {
        return el.type == "TimelineAddEntries";
    });
    console.log(entries[0].entries);
    let followers = entries[0].entries.filter(function (el) {
        return el.entryId.match(/user/);
    });
    let cursur_data = entries[0].entries.filter(function (el) {
        return el.entryId.match(/cursor-bottom/);
    });
    cursor = cursur_data[0].content.value;
    return { followers: followers, cursor: cursor }
}

async function scrapyQuoteRetweetsRequests(tweet_id, cursor) {
    // Prepare tokens
    tw_authorization = await getLocalStorage('tw_authorization');
    csrf_token = await getCookie('https://twitter.com/', 'ct0');
    let url = 'https://twitter.com/i/api/2/search/adaptive.json?include_profile_interstitial_type=1&include_blocking=1&include_blocked_by=1&include_followed_by=1&include_want_retweets=1&include_mute_edge=1&include_can_dm=1&include_can_media_tag=1&include_ext_has_nft_avatar=1&skip_status=1&cards_platform=Web-12&include_cards=1&include_ext_alt_text=true&include_quote_count=true&include_reply_count=1&tweet_mode=extended&include_ext_collab_control=false&include_entities=true&include_user_entities=true&include_ext_media_color=true&include_ext_media_availability=true&include_ext_sensitive_media_warning=true&include_ext_trusted_friends_metadata=true&send_error_codes=true&simple_quoted_tweet=true&q=quoted_tweet_id:' + tweet_id + '&vertical=tweet_detail_quote&count=50&pc=1&spelling_corrections=1&include_ext_edit_control=false&ext=mediaStats,highlightedLabel,hasNftAvatar,voiceInfo,enrichments,superFollowMetadata,unmentionInfo,vibe'
    if (cursor != null) {
        url += '&cursor=' + cursor
    }
    // Get data
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
    let tweets = response.data.globalObjects.tweets;
    let users = response.data.globalObjects.users;
    let output = []
    let new_cursor = '';
    let tweets_keys = Object.keys(tweets)
    for (i = 0; i < tweets_keys.length; i++) {
        if (tweets[tweets_keys[i]].is_quote_status == true) {
            output.push({ tweet: tweets[tweets_keys[i]].conversation_id_str, author: users[tweets[tweets_keys[i]].user_id_str].screen_name })
        }
    }
    let entries = response.data.timeline.instructions.filter(function (el) {
        return el.addEntries;
    });
    let cursur_data = entries[0].addEntries.entries.filter(function (el) {
        return el.entryId.match(/cursor-bottom/);
    });
    if (cursur_data.length == 0) {
        let replaceEntries = response.data.timeline.instructions.filter(function (el) {
            try { return el.replaceEntry.entryIdToReplace.match(/cursor-bottom/); }
            catch (err) { return false }
        });
        new_cursor = replaceEntries[0].replaceEntry.entry.content.operation.cursor.value;
    } else {
        new_cursor = cursur_data[0].content.operation.cursor.value
    }
    return { tweets: output, cursor: new_cursor }
}

async function scrapyRetweetersRequests(tweet_id, cursor) {
    // prepare data
    let query_params_variables = { "tweetId": tweet_id, "count": 100, "includePromotedContent": true, "withSuperFollowsUserFields": true, "withDownvotePerspective": false, "withReactionsMetadata": false, "withReactionsPerspective": false, "withSuperFollowsTweetFields": true }
    if (cursor !== null) {
        query_params_variables.cursor = cursor;
    }
    let query_params_features = { "dont_mention_me_view_api_enabled": true, "interactive_text_enabled": true, "responsive_web_uc_gql_enabled": true, "vibe_api_enabled": true, "responsive_web_edit_tweet_api_enabled": false, "standardized_nudges_misinfo": true, "tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled": false, "responsive_web_enhance_cards_enabled": false }

    query_params_variables = encodeURIComponent(JSON.stringify(query_params_variables))
    query_params_features = encodeURIComponent(JSON.stringify(query_params_features))
    // Prepare tokens
    tw_authorization = await getLocalStorage('tw_authorization');
    csrf_token = await getCookie('https://twitter.com/', 'ct0');
    let url = "https://twitter.com/i/api/graphql/o9kVfmorISBwCTE_37H09g/Retweeters?variables=" + query_params_variables + '&features=' + query_params_features
    // Get data
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
    let entries = response.data.data.retweeters_timeline.timeline.instructions.filter(function (el) {
        return el.type == "TimelineAddEntries";
    });
    // console.log(entries[0].entries);
    let retweeters = entries[0].entries.filter(function (el) {
        return el.entryId.match(/user/);
    });
    let cursur_data = entries[0].entries.filter(function (el) {
        return el.entryId.match(/cursor-bottom/);
    });
    let new_cursor = cursur_data[0].content.value;
    return { retweeters: retweeters, cursor: new_cursor }
}

async function scrapyRepliesRequests(tweet_id, cursor) {
    // prepare data
    let query_params_variables = { "focalTweetId": tweet_id, "with_rux_injections": false, "includePromotedContent": true, "withCommunity": true, "withQuickPromoteEligibilityTweetFields": true, "withBirdwatchNotes": false, "withSuperFollowsUserFields": true, "withDownvotePerspective": false, "withReactionsMetadata": false, "withReactionsPerspective": false, "withSuperFollowsTweetFields": true, "withVoice": true, "withV2Timeline": true}
    if (cursor !== null) {
        query_params_variables.cursor = cursor;
    }
    let query_params_features = {"dont_mention_me_view_api_enabled":true,"interactive_text_enabled":true,"responsive_web_uc_gql_enabled":true,"vibe_api_enabled":true,"responsive_web_edit_tweet_api_enabled":false,"standardized_nudges_misinfo":true,"tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled":false,"responsive_web_enhance_cards_enabled":false}

    query_params_variables = encodeURIComponent(JSON.stringify(query_params_variables))
    query_params_features = encodeURIComponent(JSON.stringify(query_params_features))
    // Prepare tokens
    tw_authorization = await getLocalStorage('tw_authorization');
    csrf_token = await getCookie('https://twitter.com/', 'ct0');
    let url = "https://twitter.com/i/api/graphql/WyMlJ14PO-bRWaO5ZNUgBA/TweetDetail?variables=" + query_params_variables + '&features=' + query_params_features
    // Get data
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
    let replies = entries[0].entries.filter(function (el) {
        return el.entryId.match(/conversationthread/);
    });
    let output = [];
    for (let i = 0; i < replies.length; i++) {
        try{
            output.push('https://twitter.com/'+replies[i].content.items[0].item.itemContent.tweet_results.result.core.user_results.result.legacy.screen_name+'/status/'+replies[i].content.items[0].item.itemContent.tweet_results.result.legacy.id_str);
        }catch(err){}
    }
    let cursur_data = entries[0].entries.filter(function (el) {
        return el.entryId.match(/cursor-bottom/);
    });
    let new_cursor = cursur_data[0].content.itemContent.value;
    return { replies: output, cursor: new_cursor }
}