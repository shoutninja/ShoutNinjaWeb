/**
 * Index.js
 * A home for the root index controller.  This also serves as a miscellaneous for small controllers.
 * Bad practice but whatever we'll fix it later :/
 */
app.controller("ninja.shout.index", ["$scope", "$rootScope", "$location", "ninja.shout.local.settings", "ninja.shout.api.auth",
    function ($scope, $rootScope, $location, localSettings, auth) {
        $scope.$location = $location;
        $rootScope.$watch(function () {
            return localSettings.getCookieAlias("advertisingEnabled");
        }, function (val) {
            $scope.advertisingEnabled = val;
            $scope.mainViewClass = val ? "main-view-ad" : "main-view-no-ad";
        });
        $rootScope.$watch(function () {
            if (auth.getAuth()) return auth.getAuth().uid;
            return null;
        }, function () {
            $scope.authData = auth.getAuth();
        });

        $scope.login = function () {
            auth.auth();
        };
        $scope.logout = function () {
            auth.unAuth();
        }
    }
]);

app.controller("ninja.shout.index.help", ["$scope", "$routeParams", function ($scope, $routeParams) {
    $scope.helpPath = "/help/" + $routeParams.help_path + ".html";
}]);

app.controller("ninja.shout.index.chats", function () {
    //Exists mostly because it should.
});

app.controller("ninja.shout.index.lynx", ["$scope", "$rootScope", "$window", "$location",
    "ninja.shout.lynx.abstract", "ninja.shout.local.notifications",
    function ($scope, $rootScope, $window, $location, abstract, notifications) {
        $scope.$location=$location;

        $rootScope.$watch(abstract.getPostCount, function (newVal) {
            $scope.postCount = newVal;
        });

        $scope.formData = {
            url: ""
        };

        $scope.submitForm = function () {
            abstract.submit($scope.formData.url, function () {
                $scope.formData.url = "";
                notifications.attemptNotification("Success", {
                    body: "Your page was successfully submitted.",
                    tag: "_success",
                    icon: "img/Lynx_0.1.png"
                });
            }, function () {
                notifications.attemptNotification("Error", {
                    body: "Your page submission was unsuccessful.",
                    tag: "_fail",
                    icon: "img/Lynx_0.1.png"
                });
            });
        };

        $scope.go = function () {
            $window.location.assign(abstract.getUrl());
        };
    }
]);

app.controller("ninja.shout.index.lynx.analysis", ["$scope", "$rootScope", "$routeParams", "$location", "ninja.shout.lynx.api.forum",
    function ($scope, $rootScope, $routeParams, $location, forum) {
        var now = new Date();
        $scope.startDate = moment([now.getFullYear(), now.getMonth(), now.getDate()]).subtract(14, "days");
        $scope.endDate = moment([now.getFullYear(), now.getMonth(), now.getDate()]).add(2, "days");

        $scope.regex = new RegExp("((?!-)[A-Za-z0-9-]{1,63}(?!-)\\.)+[A-Za-z]{2,6}");
        $scope.domainCount = 5;

        $scope.pieChartColorTags = {
            "www.youtube.com": "red",
            "www.bing.com": "blue",
            "www.google.com": "green"
        };

        $scope.forEachInRange = function (callback) {
            angular.forEach(forum, function (post) {
                var postDate = moment(new Date(post.timestamp));
                if (postDate.diff($scope.startDate) >= 0 &&
                    postDate.diff($scope.endDate) < 0) {
                    callback(post, postDate);
                }
            });
        };

        $scope.setChartType = function (chartType) {
            $location.path("/lynx/analysis/" + chartType);
        };

        $scope.chartTypes = {
            pie: {
                name: "pie",
                displayName: "Pie",
                update: function () {
                    var data = {};

                    $scope.forEachInRange(function (post) {

                        var domain = $scope.regex.exec(post.url)[0];
                        if (!data[domain]) {
                            data[domain] = 1;
                        } else {
                            data[domain]++;
                        }
                    });

                    var otherCount;
                    var formattedData;
                    var minimumSubmissions = 2;

                    do {
                        console.log($scope.domainCount+","+minimumSubmissions);
                        otherCount=0;
                        formattedData = [];

                        angular.forEach(Object.keys(data), function (key) {
                            if (data[key] > minimumSubmissions) {
                                var color;
                                if (Object.keys($scope.pieChartColorTags).indexOf(key) > -1) {
                                    color = $scope.pieChartColorTags[key];
                                } else {
                                    color = "rgb("+Math.floor(Math.random()*256)+", "+
                                    Math.floor(Math.random()*256)+", "+
                                    Math.floor(Math.random()*256)+")";
                                }

                                formattedData.push({label: key, value: data[key], color: color});
                            } else {
                                otherCount++;
                            }
                        });

                        minimumSubmissions++;
                    } while (formattedData.length>$scope.domainCount&&minimumSubmissions>1);

                    formattedData.push({label:"Other", value:otherCount, color: "#7E7E7E"});

                    $scope.data = formattedData;

                    $scope.options = {thickness: 100};
                }
            },
            line: {
                name: "line",
                displayName: "Line",
                update: function () {
                    if (forum.length < 1) return;

                    var numDays = $scope.endDate.diff($scope.startDate, "days");
                    for (var i = 0; i < numDays; i++) {
                        $scope.data[i] = {x: i, value: 0};
                    }

                    $scope.forEachInRange(function (post, postDate) {
                        $scope.data[postDate.diff($scope.startDate, "days")].value++;
                    });

                    $scope.options = {
                        series: [
                            {
                                y: "value",
                                label: "Number of Links Submitted",
                                color: "#1f77b4",
                                axis: "y",
                                type: "line",
                                thickness: "1px",
                                dotSize: 2,
                                id: "series_0"
                            }
                        ],
                        stacks: [],
                        axes: {
                            x: {
                                type: "linear", key: "x", labelFunction: function (value) {
                                    return $scope.startDate.clone().add(value, "days").format("dd MM/DD")
                                }
                            },
                            y: {type: "linear"}
                        },
                        lineMode: "linear",
                        tension: 0.7,
                        tooltip: {
                            mode: "scrubber", formatter: function (x, y, series) {
                                return $scope.startDate.clone().add(x, "days").format("ddd MM/DD/YYYY") + ": " + y
                            }
                        },
                        drawLegend: true,
                        drawDots: true,
                        columnsHGap: 5
                    };
                }
            }
        };

        $rootScope.$watch(function () {
            return JSON.stringify(forum) + $routeParams.chartType +
                $scope.startDate +
                $scope.endDate +
                $scope.regex +
                $scope.domainCount;
        }, function () {
            $scope.data = [];
            $scope.chartType = $routeParams.chartType;

            if (forum.length>0 && Object.keys($scope.chartTypes).indexOf($routeParams.chartType) > -1)
                $scope.chartTypes[$routeParams.chartType].update();
        });
    }]);