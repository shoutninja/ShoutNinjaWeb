/**
 * Settings.js
 * A home for the settings controller
 * (Check services for ninja.shout.local.settings)
 */
app.controller("ninja.shout.index.settings", ["$scope", "$rootScope", "ninja.shout.local.settings",
    function($scope, $rootScope, localSettings) {
        $rootScope.$watch(function() {
            return localSettings.getCookieAlias("advertisingEnabled");
        }, function() {
            $scope.advertisingEnabled = localSettings.getCookieAlias("advertisingEnabled");
        });

        $scope.advertisingOptIn = function() {
            localSettings.setCookieAlias("advertisingEnabled",true);
        };
        $scope.advertisingOptOut = function() {
            localSettings.setCookieAlias("advertisingEnabled",false);
        };
    }
]);