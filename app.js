var app = angular.module("ninja.shout",["ngRoute","luegg.directives","firebase"]);

app.constant("ninja.shout.constants.urls.firebase", "https://eakjb-shout-ninja2.firebaseio.com");

app.service("ninja.shout.urls", ["ninja.shout.constants.urls.firebase", function (fbURL) {
    this.events=fbURL+"/events";
    this.chats=fbURL+"/chats";
    this.settings=fbURL+"/settings";
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
                "username": "Guest"
            }
        };
    };
    this.Event=function () {
        return {
            "name":"",
            "description":"",
            "twitter":""
        };
    };
});

app.controller("ninja.shout.index.chats",["$scope","ninja.shout.defaults","ninja.shout.api.chats",
function ($scope,defaults,chats) {
    $scope.chats=chats;
    
    $scope.submitForm = function () {
        $scope.chats.$add($scope.formData);
    
        //while (chats.length>10) {
          //  chats.$remove(0);
        //}
    
        $scope.resetForm();
    };
    $scope.resetForm = function () {
        $scope.formData.text="";
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
    
    $scope.submitForm = function () {
        votes = 0;
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
        votes++;
        alert(votes);
        events.$save($scope.event);
    }
    $scope.resetForm();
}]);

app.controller("ninja.shout.index.event",["$scope","$routeParams","ninja.shout.api.events",function($scope,$routeParams,events) {
    events.$loaded(function () {
        $scope.event=events.$getRecord($routeParams.event_id);
    });
    $scope.sumbitTwitterForm=function () {
        events.$save($scope.event);
    };
}]);