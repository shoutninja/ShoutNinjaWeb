app.service("ninja.shout.local.notifications", ["$window", "ninja.shout.constants.local.notifications.length",
function($window, length) {
    this.bannedChatNotifications=[];
    
    var requestPermission = function () {
        $window.Notification.requestPermission();
    };
    
    if ($window.Notification) {
        var attemptNotification = function(title, body) {
            var n = new $window.Notification(title, body);
            n.onclick = function() {
                $window.focus();
                this.close();
            };
            $window.setTimeout(function() {
                n.close();
            },length);
        };

        if ($window.Notification.permission === "default") {
            requestPermission();
        }

        this.isPermissionGranted = function() {
            return $window.Notification.permission == "granted";
        };
        
        this.requestPermission=requestPermission;

        this.attemptNotification = attemptNotification;
    }
}]);