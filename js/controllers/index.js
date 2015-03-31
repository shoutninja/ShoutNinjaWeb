/**
 * Index.js
 * A home for the root index controller.  This also serves as a miscellaneous for small controllers.
 * Bad practice but whatever we'll fix it later :/
 */
app.controller("ninja.shout.index", ["$scope", "$rootScope", "$location", "ninja.shout.local.settings", "ninja.shout.api.auth",
    function($scope, $rootScope, $location, localSettings, auth) {
        $scope.$location = $location;
        $rootScope.$watch(function() {
            return localSettings.getCookieAlias("advertisingEnabled");
        }, function(val) {
            $scope.advertisingEnabled = val;
            $scope.mainViewClass = val ? "main-view-ad" : "main-view-no-ad";
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

app.controller("ninja.shout.index.lynx", ["$scope", "$rootScope", "$window", "ninja.shout.lynx.abstract", "ninja.shout.local.notifications",
    function($scope, $rootScope, $window, abstract, notifications) {
        $rootScope.$watch(abstract.getPostCount,function (newVal) {
            $scope.postCount=newVal;
        });
        
        $scope.formData = {
            url:""
        }
        
        $scope.submitForm = function() {
            abstract.submit($scope.formData.url,function() {
                $scope.formData.url="";
                notifications.attemptNotification("Success",{
                                        body: "Your page was successfully submitted.",
                                        tag: "_success",
                                        icon: "img/Lynx_0.1.png"
                                    });
            },function() {
                notifications.attemptNotification("Error",{
                                        body: "Your page submission was unsuccessful.",
                                        tag: "_fail",
                                        icon: "img/Lynx_0.1.png"
                                    });
            });
        };

        $scope.go = function() {
            $window.location.assign(abstract.getUrl());
        };
    }
]);