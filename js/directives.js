app.directive("shoutNinjaChat", function() {
    return {
        scope: {
            sidebar: "=sidebar"
        },
        templateUrl: 'fragment_chats.html'
    };
});
//Credit to: http://stackoverflow.com/questions/17416992/angular-js-adsense
app.directive('myAdSense', function() {
  return {
    restrict: 'A',
    transclude: true,
    replace: true,
    template: '<div ng-transclude></div>',
    link: function ($scope, element, attrs) {}
  }
})