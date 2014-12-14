/**
 * Events.js
 * This is a file for all event-related controllers.
 * I.E.The list controller, detail controller, and other helper controllers.
 */
app.controller("ninja.shout.index.events", ["$scope", "$rootScope", "$location",
    "ninja.shout.defaults", "ninja.shout.api.events", "ninja.shout.api.events.votes",
    "ninja.shout.api.auth", "ninja.shout.local.settings",
    function($scope, $rootScope, $location, defaults, events, votes, auth, localSettings) {
        $scope.events = events;
        $scope.searchText = "";
        
        var eventFilter = function() {
            $scope.filterEventsWithoutOwners = localSettings.getCookieAlias("filterEventsWithoutOwners");
            $scope.events = events.filter(function(event) {
                if (!event.user) {
                    return !$scope.filterEventsWithoutOwners;
                }
                return true;
            });
        };
        
        $scope.events.$loaded(function() {
            $rootScope.$watch(localSettings.watcher, eventFilter);
            $scope.events.$watch(function() {
                $rootScope.$apply(eventFilter);
            });
        });

        $scope.submitForm = function() {
            if (auth.getAuth()) {
                $scope.formData.user = new defaults.User();

                $scope.formData.user.uid = auth.getAuth().uid;
                $scope.formData.user.href = auth.getAuth().getURL();
                $scope.formData.user.image = auth.getAuth().getImage();
                $scope.formData.user.provider = auth.getAuth().provider;
                $scope.formData.user.username = auth.getAuth().getUsername();
            }
            $scope.formData.timestamp = Firebase.ServerValue.TIMESTAMP;

            events.$add($scope.formData);
            $scope.resetForm();
        };
        $scope.resetForm = function() {
            $scope.formData = new defaults.Event();
        };
        $scope.deleteEvent = function(event) {
            if (event.user) {
                var authData = auth.authMessage();
                if (authData&&authData.uid==event.user.uid) {
                    events.$remove(event);
                }
            } else {
                events.$remove(event);
            }
        };
        $scope.detailEvent = function(event) {
            $location.path('events/' + event.$id);
        };
        $scope.getVotes = votes.getVotes;
        $scope.getVotesArray = function(e) {
            return $scope.getVotes(e).$asArray();
        };
        $scope.addVote = function(event) {
            if (auth.authMessage()) {
                var votesArray = $scope.getVotes(event);
                var vote = new defaults.User();
                vote.uid = auth.getAuth().uid;
                vote.username = auth.getAuth().getUsername();
                vote.provider = auth.getAuth().provider;
                votesArray.$set(vote.uid, vote);

            }
        };
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
            });
        });
    }
]);

app.controller("ninja.shout.index.event", ["$scope", "$rootScope", "$location", "$routeParams",
    "ninja.shout.api.events", "ninja.shout.api.event.comments", "ninja.shout.api.auth", "ninja.shout.defaults",
    function($scope, $rootScope, $location, $routeParams, events, comments, auth, defaults) {
        $scope.$location = $location;

        $scope.commentFormData = new defaults.Chat();

        $scope.getComments = comments.getComments;
        $scope.getCommentsArray = function(e) {
            return $scope.getComments(e).$asArray();
        }

        $scope.comments = [];

        events.$loaded(function() {
            $scope.event = events.$getRecord($routeParams.event_id);

            $scope.getCommentsArray($scope.event).$loaded(function(comments) {
                $scope.comments = comments;

                comments.$watch(function(e) {
                    $rootScope.$apply(function() {
                        $scope.comments = comments;
                    });
                });

            });
        });

        $scope.sumbitTwitterForm = function() {
            events.$save($scope.event);
        };

        $scope.addComment = function(event) {
            var myAuth = auth.authMessage();
            if (myAuth) {
                var commentArray = $scope.getCommentsArray(event);

                $scope.commentFormData.user.uid = auth.getAuth().uid;
                $scope.commentFormData.user.href = auth.getAuth().getURL();
                $scope.commentFormData.user.image = auth.getAuth().getImage();
                $scope.commentFormData.user.provider = auth.getAuth().provider;
                $scope.commentFormData.user.username = auth.getAuth().getUsername();

                $scope.commentFormData.timestamp = Firebase.ServerValue.TIMESTAMP;

                commentArray.$add($scope.commentFormData);
                $scope.resetForm();
            }
        };

        $scope.resetForm = function() {
            $scope.commentFormData = new defaults.Chat();
        };
    }
]);