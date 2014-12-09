var app = angular.module("ninja.shout",["ngRoute","luegg.directives","firebase"]);

app.constant("ninja.shout.constants.urls.firebase", "https://eakjb-shout-ninja2.firebaseio.com");

app.service("ninja.shout.urls", ["ninja.shout.constants.urls.firebase", function (fbURL) {
    this.events=fbURL+"/events";
    this.chats=fbURL+"/chats";
    this.settings=fbURL+"/settings";
    this.settingsUsernameImageMap=this.settings+"/chats/usernameImageMap";
}]);
 
app.config(function($routeProvider) {
    $routeProvider
    .when( '/events', {
        controller: 'ninja.shout.index.events',
        templateUrl: 'view_events.html'
    })
    .when( '/events/:event_id', {
        controller: 'ninja.shout.index.event',
        templateUrl: 'view_event.html'
    })
    .when('/', {
        redirectTo:'/events'
    })
    .otherwise({
      redirectTo:'/'
    });
});

app.factory("ninja.shout.api.settings", ["$firebase","ninja.shout.urls",function($firebase,urls) {
    return $firebase(new Firebase(urls.settings)).$asObject();
}]);

app.factory("ninja.shout.api.settings.usernameImageMap", ["$firebase","ninja.shout.urls",function($firebase,urls) {
    return $firebase(new Firebase(urls.settingsUsernameImageMap)).$asArray();
}]);

app.factory("ninja.shout.api.events", ["$firebase","ninja.shout.urls",function($firebase,urls) {
    return $firebase(new Firebase(urls.events)).$asArray();
}]);

app.factory("ninja.shout.api.chats", ["$firebase","ninja.shout.api.settings","ninja.shout.urls",
function($firebase,settings,urls) {
    return $firebase(new Firebase(urls.chats)).$asArray();
}]);

app.service("ninja.shout.defaults", function () {
    this.Chat=function() {
        return {
            //id
            "text": "",
            "user": {
                //id
                "username": "Guest",
                "image":"/img/anonymous.jpg"
            }
        };
    };
    this.Event=function () {
        return {
            "name":"",
            "description":"",
            "twitter":"",
            "votes":0
        };
    };
});

app.controller("ninja.shout.index.chats",["$scope","$rootScope","ninja.shout.defaults","ninja.shout.api.settings.usernameImageMap","ninja.shout.api.chats",
function ($scope,$rootScope,defaults,usernameImageMap,chats) {
    $scope.chats=chats;
    
    $rootScope.$watch(function() {
        return $scope.formData.user.username;
    }, function () {
        var usernameImageMapping = usernameImageMap.$getRecord($scope.formData.user.username.toLowerCase());
        if (usernameImageMapping) {
            $scope.formData.user.image=usernameImageMapping.$value;
        } else {
            $scope.formData.user.image=defaults.Chat().user.image;
        }
    });
    
    $scope.submitForm = function () {
        $scope.chats.$add($scope.formData);
        $scope.resetForm();
    };
    $scope.resetForm = function () {
        $scope.formData.text=defaults.Chat().text;
    };
    
    $scope.clearChats = function () {
        angular.forEach($scope.chats,function(chat) {
            $scope.chats.$remove(chat);
        });
    }
    
    $scope.formData=new defaults.Chat();
}]);

app.controller("ninja.shout.index.events",["$scope","$location","ninja.shout.defaults","ninja.shout.api.events",
function ($scope,$location,defaults,events) {
    $scope.events=events;
    $scope.searchText="";
    
    $scope.submitForm = function () {
        $scope.events.$add($scope.formData);
        $scope.resetForm();
    };
    $scope.resetForm = function () {
        $scope.formData=new defaults.Event;
    };
    $scope.deleteEvent = function (event) {
        $scope.events.$remove(event);
    };
    $scope.detailEvent = function (event) {
        $location.path('events/'+event.$id)
    }
    $scope.addVote = function (event) {
        event.votes++;
        $scope.events.$save(event);
    }
    $scope.subtractVote = function (event) {
        if (event.votes>0) event.votes--;
        $scope.events.$save(event);
    }
    $scope.resetForm();
}]);

app.controller("ninja.shout.index.event",["$scope","$location","$routeParams","ninja.shout.api.events",
function($scope,$location,$routeParams,events) {
    $scope.$location=$location;
    events.$loaded(function () {
        $scope.event=events.$getRecord($routeParams.event_id);
    });
    $scope.sumbitTwitterForm=function () {
        events.$save($scope.event);
    };
}]);