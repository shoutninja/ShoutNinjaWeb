var app = angular.module("ninja.shout",["ngRoute","firebase"]);

app.value("ninja.shout.fbURL", "https://eakjb-shout-ninja2.firebaseio.com/events");
 
app.config(function($routeProvider) {
    $routeProvider
    .when( '/events', {
        controller: 'ninja.shout.index.events',
        templateUrl: 'view_main.html'
    })
    .when( '/events/:event_id', {
        controller: 'ninja.shout.index.event',
        templateUrl: 'view_event.html'
    }).when('/', {
        redirectTo:'/events'
    })
    .otherwise({
      redirectTo:'/'
    });
});

app.factory('ninja.shout.events', ["$firebase","ninja.shout.fbURL",function($firebase, fbURL) {
    return $firebase(new Firebase(fbURL)).$asArray();
}]);

app.controller("ninja.shout.index.events",["$scope","$location","ninja.shout.events",function ($scope,$location,events) {
    $scope.events=events;
    
    $scope.submitForm = function () {
        $scope.events.$add($scope.formData);
        $scope.resetForm();
    };
    $scope.resetForm = function () {
        $scope.formData={
            name:"",
            description:""
        };
    };
    $scope.deleteEvent = function (event) {
        $scope.events.$remove(event);
    };
    $scope.detailEvent = function (event) {
        $location.path('events/'+event.$id)
    }
    $scope.resetForm();
}]);

app.controller("ninja.shout.index.event",["$scope","$routeParams","ninja.shout.events",function($scope,$routeParams,events) {
    $scope.event=events[$routeParams.event_id];
}]);