/**
 * Wrapper around bootstrap modal.
 * There is a MotherModal that provides a skeleton.
 * The skeleton is now supplemented with the right contents if you
 * start the following directive:
 * <modal></modal>
 * The state as well as the templateName are in the
 * clientstate service.
 */
angular.module('bootstrap-ui')
  .directive('modal', [
      "$compile",
      "$http",
      "$templateCache",
      "$q",
      "clientState",
      function ($compile, $http, $templateCache, $q, clientState) {

  var snippet;

  /**
   * Get template, either from cache or URL,
   * it returns a promise with a template.
   * return {promise}
   */
  var getTemplate = function (templateUrl) {
    var deferred = $q.defer();
    console.log(templateUrl)
    snippet = $templateCache.get(templateUrl);
    if (snippet !== undefined) {
      deferred.resolve(snippet);
    } else {
      return deferred.resolve(require(templateUrl));
    }
    return deferred.promise;
  };

  var oldScope;

  /**
   * Replace the content with the template
   */
  var replaceTemplate = function (templateUrl, element, scope) {
   getTemplate(templateUrl)
      .then(function (response) {
        // The local scope contained in this snippet
        // needs destruction
        if (oldScope) { oldScope.$destroy(); }

        // The snippet loaded from the templateCache
        // is used to replace the current content
        snippet = response;
        $templateCache.put(templateUrl, response);
        element.find('.modal-dialog').html(snippet);

        // newly created scope for this particular piece of html
        // needs "compilation" for it to be picked up by ng
        var newScope = scope.$new();
        $compile(element.contents())(newScope);
        oldScope = newScope;

        return true;
      }).
      then(function () {
        var mode = (clientState.modal.active) ? 'show' : 'hide';
        element.modal(mode);
      });
  };


  var link = function (scope, el, attrs) {
    scope.$watch(clientState.toString('modal.templateName'),
        function (n, o) {
      var templateUrl = 'text!../templates/' + clientState.modal.templateName + '.html';
      replaceTemplate(templateUrl, el, scope);
    });

    scope.$watch(clientState.toString('modal.active'),
        function (n, o) {
          if (n === o) { return; }
        var mode = (clientState.modal.active) ? 'show' : 'hide';
        el.modal(mode);
    });

    // ensures there is no conflict between Bootstrap set state and ng internals
    el.on('hide.bs.modal', function (e) {
      if (clientState.modal.active) {
        clientState.modal.active = false;
      }
    });

  };



  return {
    link: link,
    template: require('../templates/modal.html'),
    restrict: 'E',
    replace: true
  };
}]);
