/**
 * Wrapper around bootstrap modal.
 * There is a MotherModal that provides a skeleton.
 * The skeleton is now supplemented with the right contents if you
 * start the following directive:
 * <modal></modal>
 * The state as well as the templateName are in the
 * clientstate service.
 */

const angular = require('angular');
const $ = require('jquery');
window.jQuery = $;
require('bootstrap');

angular.module('bootstrap-ui').directive('modal', [
  '$compile',
  '$templateCache',
  '$q',
  '$http',
  'clientState',
  function ($compile, $templateCache, $q, $http, clientState) {
    var snippet;

    /**
    * Get template, either from cache or URL,
    * it returns a promise with a template.
    * @param {string} templateUrl - expects the url that it should get here.
    * @return {object} thennable promise
    */
    var getTemplate = function (templateUrl) {
      var deferred = $q.defer();

      snippet = $templateCache.get(templateUrl);

      if (snippet) {
        deferred.resolve(snippet);
      } else {
        $http.get(templateUrl).
          then(function (response) {
            // only return the html stuff
            return deferred.resolve(response.data);
          });
      }
      return deferred.promise;
    };

    var oldScope;

    /**
    * Replace the content with the template
    * @param {string} templateUrl - url of template
    * @param {object} element - element that should display new template
    * @param {object} scope - context of template
    * @return {void}
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
        $(element).find('.modal-dialog').html(snippet);

        // newly created scope for this particular piece of html
        // needs 'compilation' for it to be picked up by ng
        var newScope = scope.$new();
        $compile(element.contents())(newScope);
        oldScope = newScope;

        return true;
      }).
      then(function () {
        var mode = (clientState.modal.active) ? 'show' : 'hide';
        $(element).modal(mode);
      });
    };


    var link = function (scope, el) {
      scope.$watch(clientState.toString('modal.templateName'),
      function () {
        var templateUrl = './templates/' + clientState.modal.templateName + '.html';
        replaceTemplate(templateUrl, el, scope);
      });

      scope.$watch(clientState.toString('modal.active'),
      function (n, o) {
        if (n === o) { return; }
        var mode = (clientState.modal.active) ? 'show' : 'hide';
        $(el).modal(mode);
      });

      // ensures there is no conflict between Bootstrap set state and ng internals
      el.on('hide.bs.modal', function () {
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
  }
]);
