/**
 * Events.js
 * This is a file for all event-related controllers.
 * I.E.The list controller, detail controller, and other helper controllers.
 */
 app.controller("ninja.shout.index.events", ["$scope", "$rootScope", "$location",
    "ninja.shout.defaults", "ninja.shout.api.events", "ninja.shout.api.events.votes",
    "ninja.shout.api.auth",
    function($scope, $rootScope, $location, defaults, events, votes, auth) {
        $scope.events = events;
        $scope.searchText = "";

        $scope.submitForm = function() {
            if (auth.authMessage()) {
                $scope.formData.timestamp=Firebase.ServerValue.TIMESTAMP;
                $scope.events.$add($scope.formData);
                $scope.resetForm();
            }
        };
        $scope.resetForm = function() {
            $scope.formData = new defaults.Event();
        };
        $scope.deleteEvent = function(event) {
            $scope.events.$remove(event);
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
                voteArray.$set(vote.uid, vote);

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

app.controller("ninja.shout.index.event", ["$scope", "$location", "$routeParams",
"ninja.shout.api.events", "ninja.shout.api.event.comments", "ninja.shout.api.auth", "ninja.shout.defaults",
    function($scope, $location, $routeParams, events, comments, auth, defaults) {
        $scope.$location = $location;
        events.$loaded(function() {
            $scope.event = events.$getRecord($routeParams.event_id);
        });
        $scope.getComments=comments.getComments;
        $scope.getCommentsArray=function (e) {
            return $scope.getComments(e).$asArray();
        }
        $scope.sumbitTwitterForm = function() {
            events.$save($scope.event);
        };
        $scope.addComment = function(event) {
            var myAuth = auth.authMessage();
            if (myAuth) {
                var commentArray = $scope.getCommentsArray(event);
                var comment = new defaults.Chat();//Comments have the same data structure as chats
                comment.user.uid = auth.getAuth().uid;
                comment.user.username = auth.getAuth().getUsername();
                comment.provider = auth.getAuth().provider;
                console.log(commentArray);
                console.log(console);
                commentArray.$add(comment);
                commentArray.$save(comment);
            }
        }
    }
]);