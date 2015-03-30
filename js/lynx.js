app.service("ninja.shout.lynx.urls", ["ninja.shout.constants.urls.firebase", function(fbURL) {
    this.lynx = fbURL + "/lynx";
    this.forum = this.lynx + "/categories/forum";
}]);
app.factory("ninja.shout.lynx.api.forum", ["$firebase", "ninja.shout.lynx.urls", function($firebase, urls) {
    return $firebase(new Firebase(urls.forum)).$asArray();
}]);
app.service("ninja.shout.lynx.abstract", ["ninja.shout.lynx.api.forum", function(forum) {
    this.submit = function(url, success, failure, notify) {
        forum.$add({
            url: url,
            timestamp: Firebase.ServerValue.TIMESTAMP
        }).then(success, failure, notify);
    };
    this.getUrl = function() {
        return forum[Math.floor((Math.random() * forum.length))].url;
    }
}]);