/**
 * Chats.js
 * This is a file for all event-related controllers.
 * I.E.The list controller, detail controller, and other helper controllers.
 */
app.controller("ninja.shout.chats", ["$scope", "$rootScope", "ninja.shout.api.auth", "ninja.shout.defaults",
    "ninja.shout.api.settings.usernameImageMap", "ninja.shout.api.chats",
    function($scope, $rootScope, auth, defaults, usernameImageMap, chats) {
        $scope.chats = chats;

        $rootScope.$watch(function() {
            var uid = null;
            if (auth.getAuth()) uid=auth.getAuth().uid;
            return $scope.formData.user.username+uid;
        }, function() {
            var usernameImageMapping = usernameImageMap.$getRecord($scope.formData.user.username.toLowerCase());
            if (usernameImageMapping) {
                $scope.formData.user.image = usernameImageMapping.$value;
            }
            else if (auth.getAuth() && auth.getAuth().getUsername() == $scope.formData.user.username) {
                $scope.formData.user.image = auth.getAuth().getImage();
            }
            else {
                $scope.formData.user.image = defaults.Chat().user.image;
            }
        });

        $scope.submitForm = function() {
            $scope.formData.timestamp=Firebase.ServerValue.TIMESTAMP;
            if (auth.getAuth() && auth.getAuth().getUsername() === $scope.formData.user.username) {
                $scope.formData.user.image = auth.getAuth().getImage();
                $scope.formData.user.uid = auth.getAuth().uid;
                $scope.formData.user.provider = auth.getAuth().provider;
                $scope.formData.user.href = auth.getAuth().getURL();
            }
            $scope.chats.$add($scope.formData);
            $scope.resetForm();
        };
        $scope.resetForm = function() {
            $scope.formData.text = defaults.Chat().text;
            $scope.formData.user.uid = defaults.Chat().user.uid;
            $scope.formData.user.provider = defaults.Chat().user.provider;
            $scope.formData.user.href = defaults.Chat().user.href;
        };

        $scope.clearChats = function() {
            angular.forEach($scope.chats, function(chat) {
                $scope.chats.$remove(chat);
            });
        }

        $scope.formData = new defaults.Chat();
    }
]);