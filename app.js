var app = angular.module("ninja.shout", ["ngRoute", "ngCookies", "luegg.directives", "firebase"]);

app.constant("ninja.shout.constants.urls.firebase", "https://eakjb-shout-ninja2.firebaseio.com");
app.constant("ninja.shout.constants.urls.twitter", "https://twitter.com");

app.service("ninja.shout.urls", ["ninja.shout.constants.urls.firebase", function(fbURL) {
    this.events = fbURL + "/events";
    this.chats = fbURL + "/chats";
    this.users = fbURL + "/users";
    this.settings = fbURL + "/settings";
    this.settingsUsernameImageMap = this.settings + "/chats/usernameImageMap";
}]);

app.constant("ninja.shout.constants.local.cookies.prefix", "ninja.shout.local.cookie");

app.service("ninja.shout.cookies", ["ninja.shout.constants.local.cookies.prefix", function(prefix) {
    this.advertisingEnabled = prefix + ".advertisingEnabled";
}]);

app.config(function($routeProvider) {
    $routeProvider
        .when('/events', {
            controller: 'ninja.shout.index.events',
            templateUrl: 'view_events.html'
        })
        .when('/settings', {
            controller: 'ninja.shout.index.settings',
            templateUrl: 'view_settings.html'
        })
        .when('/events/:event_id', {
            controller: 'ninja.shout.index.event',
            templateUrl: 'view_event.html'
        })
        .when('/chats', {
            controller: 'ninja.shout.index.chats',
            templateUrl: 'view_chats.html'
        })
        .when('/', {
            redirectTo: '/events'
        })
        .otherwise({
            redirectTo: '/'
        });
});

app.factory("ninja.shout.api.raw.ref", ["$firebase", "ninja.shout.constants.urls.firebase",
    function($firebase, fbURL) {
        return new Firebase("https://eakjb-shout-ninja2.firebaseio.com/");
    }
]);

app.factory("ninja.shout.api.settings", ["$firebase", "ninja.shout.urls", function($firebase, urls) {
    return $firebase(new Firebase(urls.settings)).$asObject();
}]);

app.factory("ninja.shout.api.settings.usernameImageMap", ["$firebase", "ninja.shout.urls", function($firebase, urls) {
    return $firebase(new Firebase(urls.settingsUsernameImageMap)).$asArray();
}]);

app.factory("ninja.shout.api.events", ["$firebase", "ninja.shout.urls", function($firebase, urls) {
    return $firebase(new Firebase(urls.events)).$asArray();
}]);

app.factory("ninja.shout.api.chats", ["$firebase", "ninja.shout.api.settings", "ninja.shout.urls",
    function($firebase, settings, urls) {
        return $firebase(new Firebase(urls.chats)).$asArray();
    }
]);

app.factory("ninja.shout.api.users", ["$firebase", "ninja.shout.api.settings", "ninja.shout.urls",
    function($firebase, settings, urls) {
        return $firebase(new Firebase(urls.users)).$asArray();
    }
]);

app.service("ninja.shout.defaults", function() {
    this.Chat = function() {
        return {
            //id
            "text": "",
            "user": {
                "username": "Guest",
                "image": "/img/anonymous.jpg"
            }
        };
    };
    this.Event = function() {
        return {
            //id
            "name": "",
            "description": "",
            "twitter": "",
            "votes": 0
        };
    };
    this.User = function() {
        return {
            //id
            "uid": ""
        };
    }
});

app.service("ninja.shout.local.settings", ["$cookieStore", "ninja.shout.cookies", function($cookieStore, cookies) {
    this.setAdvertisingEnabled = function(enabled) {
        if (enabled) {
            $cookieStore.put(cookies.advertisingEnabled, enabled);
        }
        else {
            $cookieStore.remove(cookies.advertisingEnabled);
        }
    };
    this.isAdvertisingEnabled = function() {
        var value = $cookieStore.get(cookies.advertisingEnabled);
        if (value) {
            return value;
        }
        else {
            return false;
        }
    }
}]);

app.service("ninja.shout.api.auth", ["$firebaseAuth", "ninja.shout.defaults",
    "ninja.shout.constants.urls.twitter","ninja.shout.api.users", "ninja.shout.api.raw.ref",
    function($firebaseAuth, defaults, twitterURL, users, ref) {
        this.__auth = $firebaseAuth(ref);

        this.__auth.$onAuth(function(authData) {
            if (authData) {
                    users.$loaded(function(users) {
                        var user = new defaults.User();
                        user.uid = authData.uid;
                        if (users.filter(function(filterUser) {return user.uid==filterUser.uid}).length < 1) {
                            users.$add(user);
                        }
                });
            }
        });

        this.auth = function(provider) {
            if (!provider) provider = "twitter";

            return this.__auth.$authWithOAuthPopup(provider).then(function(authData) {
            }).catch(function(e) {
                alert("Authorization failed.");
            });
        };

        this.getAuth = function() {
            if (this.__auth.$getAuth()) {
                this.__auth.$getAuth().getUsername = function() {
                    return "@" + this.twitter.username;
                };
                this.__auth.$getAuth().getImage = function() {
                    return this.twitter.cachedUserProfile.profile_image_url_https;
                };
                this.__auth.$getAuth().getURL = function() {
                    return twitterURL+"/"+this.twitter.username;
                };
                return this.__auth.$getAuth();
            }
        };

        this.unAuth = function() {
            this.__auth.$unauth();
        };
    }
]);

app.controller("ninja.shout.chats", ["$scope", "$rootScope", "ninja.shout.api.auth", "ninja.shout.defaults",
    "ninja.shout.api.settings.usernameImageMap", "ninja.shout.api.chats",
    function($scope, $rootScope, auth, defaults, usernameImageMap, chats) {
        $scope.chats = chats;

        $rootScope.$watch(function() {
            return $scope.formData.user.username;
        }, function() {
            var usernameImageMapping = usernameImageMap.$getRecord($scope.formData.user.username.toLowerCase());
            if (usernameImageMapping) {
                $scope.formData.user.image = usernameImageMapping.$value;
            }
            else if (auth.getAuth() && auth.getAuth().getUsername() == $scope.formData.user.username) {
                $scope.formData.user.image = auth.getAuth().getImage();
                $scope.formData.user.uid=auth.getAuth().uid;
                $scope.formData.user.href=auth.getAuth().getURL();
            }
            else {
                $scope.formData.user.image = defaults.Chat().user.image;
            }
        });

        $scope.submitForm = function() {
            $scope.chats.$add($scope.formData);
            $scope.resetForm();
        };
        $scope.resetForm = function() {
            $scope.formData.text = defaults.Chat().text;
        };

        $scope.clearChats = function() {
            angular.forEach($scope.chats, function(chat) {
                $scope.chats.$remove(chat);
            });
        }

        $scope.formData = new defaults.Chat();
    }
]);

app.controller("ninja.shout.index", ["$scope", "$rootScope", "$location", "ninja.shout.local.settings", "ninja.shout.api.auth",
    function($scope, $rootScope, $location, localSettings, auth) {
        $scope.$location = $location;
        $rootScope.$watch(localSettings.isAdvertisingEnabled, function() {
            $scope.advertisingEnabled = localSettings.isAdvertisingEnabled();
        });
        $rootScope.$watch(function() {
            if (auth.getAuth()) return auth.getAuth().uid;
            return null;
        }, function() {
            $scope.authData = auth.getAuth();
        });

        $scope.login = function() {
            auth.auth();
        };
        $scope.logout = function() {
            auth.unAuth();
        }
    }
]);

app.controller("ninja.shout.index.chats", function() {
    //Exists mostly because it should.
});

app.controller("ninja.shout.index.settings", ["$scope", "$rootScope", "ninja.shout.local.settings",
    function($scope, $rootScope, localSettings) {
        $rootScope.$watch(localSettings.isAdvertisingEnabled, function() {
            $scope.advertisingEnabled = localSettings.isAdvertisingEnabled();
        });

        $scope.advertisingOptIn = function() {
            localSettings.setAdvertisingEnabled(true);
        };
        $scope.advertisingOptOut = function() {
            localSettings.setAdvertisingEnabled(false);
        };
    }
]);

app.controller("ninja.shout.index.events", ["$scope", "$location", "ninja.shout.defaults", "ninja.shout.api.events", "ninja.shout.api.auth",
    function($scope, $location, defaults, events, auth) {
        $scope.events = events;
        $scope.searchText = "";

        $scope.submitForm = function() {
            $scope.events.$add($scope.formData);
            $scope.resetForm();
        };
        $scope.resetForm = function() {
            $scope.formData = new defaults.Event;
        };
        $scope.deleteEvent = function(event) {
            $scope.events.$remove(event);
        };
        $scope.detailEvent = function(event) {
            $location.path('events/' + event.$id)
        }
        $scope.addVote = function(event) {
            if (auth.getAuth()) {
                event.votes++;
                $scope.events.$save(event);
            }
        }
        $scope.resetForm();
    }
]);

app.controller("ninja.shout.index.event", ["$scope", "$location", "$routeParams", "ninja.shout.api.events",
    function($scope, $location, $routeParams, events) {
        $scope.$location = $location;
        events.$loaded(function() {
            $scope.event = events.$getRecord($routeParams.event_id);
        });
        $scope.sumbitTwitterForm = function() {
            events.$save($scope.event);
        };
    }
]);

app.directive("shoutNinjaChat", function() {
    return {
        scope: {
            sidebar: "=sidebar"
        },
        templateUrl: 'fragment_chats.html'
    };
});