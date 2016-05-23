angular.module("threedi-client")
.controller("BoxAwesome",
    ["$scope",
        function($scope){
    $scope.box = {
        disabled: true,
        content: 'empty'
	};

    $scope.close_box = function(){
        // If you have to shut down some things, use a listener on this broadcast.
        $scope.$broadcast($scope.box.content.type + "-close");
        $scope.box.disabled = true;
        // Somewhat hacky: selected icon lights up
        if (($scope.box.content.marker) && ($scope.box.content.marker._icon !== null)) {
            // _icon is null when you already removed the marker
            $scope.box.content.marker._icon.classList.remove('selected-icon');
        }
        $scope.box.content = 'empty';
    };

    $scope.$on('open_box', function(message, content) {
        // Somewhat hacky: selected icon lights up
        if (($scope.box.content.marker) && ($scope.box.content.marker._icon !== null)) {
            // _icon is null when you already removed the marker
            $scope.box.content.marker._icon.classList.remove('selected-icon');
        }
        if ($scope.box.content !== 'empty') {
            $scope.close_box();  // close box and clean stuff up.
        }
        if(!$scope.$$phase) {  // Check if already in a $digest or $apply.
            $scope.$apply(function() {
                $scope.box.content = content;
                $scope.box.disabled = false;
                if ($scope.box.content.marker !== undefined){
                    $scope.box.content.marker._icon.classList.add('selected-icon');
                }
            });
        } else {
            // If already in $digest or $apply, don't have to do it again.
            $scope.box.content = content;
            $scope.box.disabled = false;
        }
        // If you have dynamic content, you should listen to this broadcast.
        $scope.$broadcast(content.type, content);
    });

    // Close the box from another scope using $rootScope.$broadcast
    // You can give a close box condition. It will only close if
    // content matches given content.
    $scope.$on('close_box', function(message, content) {
        for (var i in content) {
            if ($scope.box.content[i] !== content[i]) {
                // Close box condition not met.
                console.log('Close box condition not met.');
                return;
            }
        }

        $scope.close_box();
    });

    $scope.$on('keypress-esc', function(message, content) {
        $scope.close_box();
    });
}]);
