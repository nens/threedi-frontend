/***
 *
 * Because DRY we add a directive to fix all the boxes
 *
 * The way you use it:
 * <edit-number
 *    candidate="somevariable"
 *    callback="somecallback"
 *    step="optionalStepVariable">
 *  </edit-number>
 *
 *  This will be replaced with a number input and a +/- button
 *  The variable and callback should be defined within in the scope
 *  of the controller you're addressing at that moment.
 *
 *  The step variable can be a text value or a value rendered with:
 *  {[{ variable }]} from the scope. It will default to 0.5
 */
angular.module('threedi-client')
  .directive('editNumber', function () {

  var link = function (scope, elem, attrs) {
    if (attrs.step) {
      scope.step = parseFloat(attrs.step);
    } else {
      scope.step = 0.5;
    }

    // hacky but otherwise not available to callCallback
    scope.elem = elem;

    scope.callCallback = function() {
      scope.elem.removeClass('has-error');
      // allow $apply to update scope.candidate before doing callback.
      if (isNaN(scope.candidate)) {
        scope.elem.addClass('has-error');
        console.log('This is not a valid entry, skip it');
        // showalert is still a global
        showalert('You did not enter a valid number!', 'alert-danger');
        return;
      }
      setTimeout(function() {scope.callback();}, 0);
    };

    scope.changeValue = function (step) {
      scope.candidate = Number((Number(scope.candidate) + step).toFixed(2));
      scope.callCallback();
    };

    scope.$watch('candidate', function (n,o) {
      if (n === o) {return ;}
      if (typeof(n) === "string" && !isNaN(n)) {
        scope.candidate = Number(n);
      }
    });

  };

  return {
    link: link,
    templateUrl: '/template/edit_number/',
    restrict: 'E',
    replace: true,
    scope: {
      candidate: '=candidate',
      callback: '=callback'
    }
  };
});
