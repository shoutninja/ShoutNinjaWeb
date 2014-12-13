var app = angular.module("ninja.shout", ["ngRoute", "ngCookies", "luegg.directives", "firebase"]);

app.constant("ninja.shout.constants.urls.firebase", "https://eakjb-shout-ninja2.firebaseio.com");
app.constant("ninja.shout.constants.urls.twitter", "https://twitter.com");

app.service("ninja.shout.urls", ["ninja.shout.constants.urls.firebase", function(fbURL) {
    this.events = fbURL + "/events";
    this.chats = fbURL + "/chats";
    this.users = fbURL + "/users";
    this.settings = fbURL + "/settings";
    this.votes = "/votes";
    this.location = "/location";
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
        .when('/help/:help_path', {
            controller: 'ninja.shout.index.help',
            templateUrl: 'view_help.html'
        })
        .when('/', {
            redirectTo: '/chats'
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

app.service("ninja.shout.api.events.votes", ["$firebase", "ninja.shout.urls", function($firebase, urls) {
    this.getVotes = function(event) {
        return $firebase(new Firebase(urls.events + "/" + event.$id + urls.votes));
    };
}]);
app.service("ninja.shout.api.events.comments", ["$firebase", "ninja.shout.urls", function($firebase, urls) {
    this.getComments = function(event) {
        return $firebase(new Firebase(urls.events + "/" + event.$id + urls.comments));
    };
}]);
app.service("ninja.shout.api.events.location", ["$firebase", "ninja.shout.urls", function($firebase, urls) {
    this.getLocation = function(event) {

    }
}]);

app.factory("ninja.shout.api.chats", ["$firebase", "ninja.shout.api.settings", "ninja.shout.urls",
    function($firebase, settings, urls) {
        return $firebase(new Firebase(urls.chats)).$asArray();
    }
]);

app.factory("ninja.shout.api.users", ["$firebase", "ninja.shout.api.settings", "ninja.shout.urls",
    function($firebase, settings, urls) {
        return $firebase(new Firebase(urls.users));
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
            "votes": [],
            "comments": []
        };
    };
    this.User = function() {
        return {
            //id
            "provider": "",
            "username": ""
        };
    };
    this.Location = function() {
        return {
            "name": "",
            "lattitude": "",
            "longitude": ""
        }
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
    "ninja.shout.constants.urls.twitter", "ninja.shout.api.users", "ninja.shout.api.raw.ref",
    function($firebaseAuth, defaults, twitterURL, users, ref) {
        this.__auth = $firebaseAuth(ref);

        var fixUsername = function(username, provider) {
            return "@" + username;
        };

        this.__auth.$onAuth(function(authData) {
            if (authData) {
                var user = new defaults.User();
                user.uid = authData.uid;
                user.provider = authData.provider;
                user.username = fixUsername(authData[authData.provider].username, authData.provider);
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
            if (!authData) authData = this.__auth;
            if (authData.$getAuth()) {
                authData.$getAuth().getUsername = function() {
                    return fixUsername(this[this.provider].username, this.provider);
                };
                authData.$getAuth().getImage = function() {
                    return this.twitter.cachedUserProfile.profile_image_url_https;
                };
                authData.$getAuth().getURL = function() {
                    return twitterURL + "/" + this.twitter.username;
                };
                return authData.$getAuth();
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
            $scope.formData.user.image = "";
            $scope.formData.user.uid = "";
            $scope.formData.user.href = "";
            if (usernameImageMapping) {
                $scope.formData.user.image = usernameImageMapping.$value;
            }
            else if (auth.getAuth() && auth.getAuth().getUsername() == $scope.formData.user.username) {
                $scope.formData.user.image = auth.getAuth().getImage();
                $scope.formData.user.uid = auth.getAuth().uid;
                $scope.formData.user.href = auth.getAuth().getURL();
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

app.controller("ninja.shout.index.comments", ["$scope", function() {

}]);

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

app.controller("ninja.shout.index.help", ["$scope", "$routeParams", function($scope, $routeParams) {
    $scope.helpPath = "/help/" + $routeParams.help_path + ".html";
}]);

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

app.controller("ninja.shout.index.events", ["$scope", "$rootScope", "$location",
    "ninja.shout.defaults", "ninja.shout.api.events", "ninja.shout.api.events.votes",
    "ninja.shout.api.auth",
    function($scope, $rootScope, $location, defaults, events, votes, auth) {
        $scope.events = events;
        $scope.searchText = "";

        $scope.submitForm = function() {
            if (auth.getAuth()) {
                $scope.events.$add($scope.formData);

                $scope.resetForm();
            }
            else {
                alert('You need to be signed in first before doing that.')
            }
        };
        $scope.resetForm = function() {
            $scope.formData = new defaults.Event;
        };
        $scope.deleteEvent = function(event) {
            $scope.events.$remove(event);
        };
        $scope.detailEvent = function(event) {
            $location.path('events/' + event.$id)
        };
        $scope.getVotes = votes.getVotes;
        $scope.getVotesArray = function(e) {
            return $scope.getVotes(e).$asArray();
        }
        $scope.addVote = function(event) {
            if (auth.getAuth()) {
                var votesArray = $scope.getVotes(event);
                var vote = new defaults.User();
                vote.uid = auth.getAuth().uid;
                vote.username = auth.getAuth().getUsername();
                vote.provider = auth.getAuth().provider;
                votesArray.$set(vote.uid, vote);
            }
            else {
                alert('You need to be signed in first before doing that.')
            }
        }
        $scope.resetForm();
    }
]);

app.controller("ninja.shout.index.events.event", ["$scope", "$rootScope",
    "ninja.shout.defaults", "ninja.shout.api.events", "ninja.shout.api.events.votes",
    "ninja.shout.api.auth",
    function($scope, $rootScope, defaults, events, votes, auth) {
        $scope.getVotesArray($scope.event).$loaded(function(votes) {
            $scope.event.voteCount = votes.length;
            $scope.voteCount = votes.length;
            votes.$watch(function(e) {
                $rootScope.$apply(function() {
                    $scope.voteCount = votes.length;
                    $scope.event.voteCount = votes.length;
                });
            });eakjb
        });
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