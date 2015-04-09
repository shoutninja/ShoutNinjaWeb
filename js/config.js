/**
 * Config.js
 * This is a home for configuration code for the entire app
 * I.E. constants and database URLs.
 */

//API Urls
app.service("ninja.shout.urls", ["ninja.shout.constants.urls.firebase", function(fbURL) {
    this.events = fbURL + "/events";
    this.chats = fbURL + "/chats";
    this.users = fbURL + "/users";
    this.settings = fbURL + "/settings";
    this.votes = "/votes";
    this.location = "/location";
    this.comments = "/comments";
    this.settingsUsernameImageMap = this.settings + "/chats/usernameImageMap";
}]);

//==============Route Provider==============
app.config(function($routeProvider) {
    $routeProvider
        .when('/events', {
            controller: 'ninja.shout.index.events',
            templateUrl: 'view_events.html'
        }).when('/settings', {
            controller: 'ninja.shout.index.settings',
            templateUrl: 'view_settings.html'
        }).when('/events/:event_id', {
            controller: 'ninja.shout.index.event',
            templateUrl: 'view_event.html'
        }).when('/chats', {
            controller: 'ninja.shout.index.chats',
            templateUrl: 'view_chats.html'
        }).when('/lynx', {
            controller: 'ninja.shout.index.lynx',
            templateUrl: 'view_lynx.html'
        }).when('/lynx/analysis/:chartType', {
            controller: 'ninja.shout.index.lynx.analysis',
            templateUrl: 'view_lynx_analysis.html'
        }).when('/lynx/analysis/', {
            redirectTo: 'lynx/analysis/line'
        }).when('/help/:help_path', {
            controller: 'ninja.shout.index.help',
            templateUrl: 'view_help.html'
        }).when('/', {
            redirectTo: '/chats'
        }).otherwise({
            redirectTo: '/'
        });
});

//==============Defaults for database values==============
app.service("ninja.shout.defaults", function() {
    var User = function() {
        return {
                "username": "Guest",
                "href":"",
                "uid":"",
                "provider":"",
                "image": "/img/anonymous.jpg"
            };
    };
    var Chat = function() {
        return {
            //id
            "text": "",
            "timestamp": 0,
            "user":  new User()
        };
    };
    var Event = function() {
        return {
            //id
            "name": "",
            "description": "",
            "twitter": "",
            "timestamp": 0,
            "votes": [],
            "comments": []
        };
    };
    var Location = function() {
        return {
            "name": "",
            "lattitude": "",
            "longitude": ""
        }
    }
    this.User=User;
    this.Chat=Chat;
    this.Event=Event;
    
});

//==============Firebase API declarations==============
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
app.service("ninja.shout.api.event.comments", ["$firebase", "ninja.shout.urls", function($firebase, urls) {
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