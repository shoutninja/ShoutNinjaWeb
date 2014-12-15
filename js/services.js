/**
 * Services.js
 * Not necessarily the angular type serivices.  Factories, etc. are allowed too.
 * This is a home for services global to the entire app such as authentication and cookie management.
 */
app.service("ninja.shout.cookies", ["ninja.shout.constants.local.cookies.prefix", function(prefix) {
    this.advertisingEnabled = prefix + ".advertisingEnabled";
    this.filterEventsWithoutOwners = prefix + ".filterEventsWithoutOwners";
    this.disableNotifications = prefix + ".disableNotifications";
}]);

app.service("ninja.shout.local.notifications", ["$window", "ninja.shout.constants.local.notifications.length",
function($window, length) {
    this.bannedChatNotifications=[];
    
    var requestPermission = function () {
        $window.Notification.requestPermission();
    };
    
    if ($window.Notification) {
        var attemptNotification = function(title, body) {
            var n = new $window.Notification(title, body);
            n.onclick = function() {
                $window.focus();
                this.close();
            };
            $window.setTimeout(function() {
                n.close();
            },length);
        };

        if ($window.Notification.permission === "default") {
            requestPermission();
        }

        this.isPermissionGranted = function() {
            return $window.Notification.permission == "granted";
        };
        
        this.requestPermission=requestPermission;

        this.attemptNotification = attemptNotification;
    }
}]);

app.run(["$rootScope", "$window", "ninja.shout.api.chats", "ninja.shout.local.settings", "ninja.shout.local.notifications",
    function($rootScope, $window, chats, settings, notifications) {
        var chatWatchRegistered = false;
        $rootScope.$watch(notifications.isPermissionGranted, function(granted) {
            if (granted && !chatWatchRegistered) {
                chats.$loaded(function() {
                    chatWatchRegistered = true;
                    chats.$watch(function(e) {
                        if (!settings.getCookieAlias("disableNotifications")&&e.event === "child_added") {
                            $window.setTimeout(function() {
                                var key = e.key;
                                if (notifications.bannedChatNotifications.indexOf(key)<0) {
                                    var chat = chats.$getRecord(key);
                                    notifications.attemptNotification(chat.user.username, {
                                        body: chat.text,
                                        tag: chat.text + chat.timestamp + chat.user.username,
                                        icon: chat.user.image
                                    });
                                }
                            },300);
                        }
                    });
                });
            }
        });
    }
]);

app.service("ninja.shout.local.settings", ["$cookieStore", "ninja.shout.cookies", function($cookieStore, cookies) {
    this.watcher = function() {
        var values = "";
        for (var key in cookies) {
            if (cookies.hasOwnProperty(key)) {
                values += $cookieStore.get(cookies[key]);
            }
        }
        return values;
    }
    this.setCookie = function(cookie, val) {
        if (val) {
            $cookieStore.put(cookie, val);
        }
        else {
            $cookieStore.remove(cookie);
        }
    };
    this.getCookie = function(cookie) {
        var value = $cookieStore.get(cookie);
        if (value) {
            return value;
        }
        else {
            return false;
        }
    };
    this.setCookieAlias = function(cookieAlias, val) {
        return this.setCookie(cookies[cookieAlias], val);
    };
    this.getCookieAlias = function(cookieAlias) {
        return this.getCookie(cookies[cookieAlias]);
    };
}]);

app.service("ninja.shout.api.auth", ["$firebaseAuth", "ninja.shout.defaults",
    "ninja.shout.constants.urls.twitter", "ninja.shout.api.users", "ninja.shout.api.raw.ref",
    function($firebaseAuth, defaults, twitterURL, users, ref) {
        this.__auth = $firebaseAuth(ref);

        var addMethods = function(authData) {
            if (authData) {
                authData.getUsername = function() {
                    return "@" + this.twitter.username;
                };
                authData.getImage = function() {
                    return this.twitter.cachedUserProfile.profile_image_url_https;
                };
                authData.getURL = function() {
                    return twitterURL + "/" + this.twitter.username;
                };
                return authData;
            }
        };

        this.__auth.$onAuth(function(authData) {
            authData = addMethods(authData);
            if (authData) {
                var user = new defaults.User();
                user.uid = authData.uid;
                user.provider = authData.provider;
                user.username = authData.getUsername();
                user.href = authData.getURL();
                user.image = authData.getImage();
                users.$set(authData.uid, user);
            }
        });

        this.auth = function(provider) {
            if (!provider) provider = "twitter";

            return this.__auth.$authWithOAuthPopup(provider).then(function(authData) {}).catch(function(e) {
                alert("Authorization failed.");
            });
        };

        this.getAuth = function(authData) {
            if (!authData) authData = this.__auth.$getAuth();
            if (authData) {
                return addMethods(authData);
            }
            else {
                return null;
            }
        };

        this.authMessage = function(authData) {
            var auth = this.getAuth(authData);
            if (!auth) {
                //todo localize/extract to constant
                //localization service?
                alert("Unauthorized: You must be authenticated to do that.  You can log in with witter in settings.");
            }
            return auth;
        };

        this.unAuth = function() {
            this.__auth.$unauth();
        };
    }
]);
