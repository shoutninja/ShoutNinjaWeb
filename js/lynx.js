app.service("ninja.shout.lynx.urls", ["ninja.shout.constants.urls.firebase", function(fbURL) {
    this.lynx = fbURL + "/lynx";
    this.forum = this.lynx + "/categories/forum";
}]);
app.factory("ninja.shout.lynx.api.forum", ["$firebase", "ninja.shout.lynx.urls", function($firebase, urls) {
    return $firebase(new Firebase(urls.forum)).$asArray();
}]);
app.service("ninja.shout.lynx.abstract", ["ninja.shout.lynx.api.forum", function(forum) {
    this.allowedPrefixes = ["http://","https://"];
    this.getPostCount = function () {
        return forum.length;
    };
    
    this.isValid = function(url) {
        var valid = false;
        angular.forEach(this.allowedPrefixes, function(prefix) {
            if (url.indexOf(prefix)==0) valid=true;
        });
        return valid;
    };
    
    this.validate = function() {
        var urls = [];
        angular.forEach(forum, function(post) {
            //Strip trailing slash
            var postUrl = post.url;
            if (postUrl.substr(-1) == '/') {
                postUrl = postUrl.substr(0, postUrl.length - 1);
            }
            //Check validity
            if (urls.indexOf(postUrl) > 0 || !this.isValid(postUrl)) {
                forum.$remove(post);
            }
            else {
                urls.push(postUrl);
            }
        },this);
    };

    this.submit = function(url, success, failure, notify) {
        for (var i = 0; i < forum.length; i++) {
            if (forum[i].url == url) {
                if (success) success("Duplicate");
                if (notify) notify();
                this.validate();
                return false;
            }
        }
        forum.$add({
            url: url,
            timestamp: Firebase.ServerValue.TIMESTAMP
        }).then(success, failure, function(arg) {
            this.validate();
            if (notify) notify();
        });
        return true;
    };
    this.getUrl = function() {
        return forum[Math.floor((Math.random() * forum.length))].url;
    }
}]);