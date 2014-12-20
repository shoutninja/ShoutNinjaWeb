app.directive("shoutNinjaChat", function() {
    return {
        scope: {
            sidebar: "=sidebar"
        },
        templateUrl: 'fragment_chats.html'
    };
});