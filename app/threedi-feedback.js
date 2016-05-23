function FeedbackWidget ($scope) {

    $scope.submit = function() {
        $scope.socket = parent.$('html[ng-app="threedi-client"]').injector().get('socket');
        parent.window.setTimeout(function () {
            var info = document.getElementsByClassName('messages')[0].children[0];
            $scope.socket.emit('archive_feedback', info.innerHTML.split(' - ')[1], function () {
                parent.console.info('i iz callack')
            });
            var eval = info.innerHTML != "Form is invalid.";
            if (eval) {
                parent.$('#feedback-modal').modal('hide');
            }
        }, 600);
    };
};