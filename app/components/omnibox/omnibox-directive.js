
angular.module('omnibox')
.directive('omnibox', ['$compile', '$templateCache',
function ($compile, $templateCache) {
  var link = function (scope, el) {
    var replaceTemplate = function () {
      var oldScope;
      // var template = getTemplate(scope, scope.box.type);
      var templateBase = './templates/awesome/';
      var template = $templateCache.get(templateBase + scope.box.content.type + '.html');

      // we don't want the dynamic template to overwrite the search box.
      angular.element(document.querySelector('.omnibox-inner')).html(template);

      var newScope = scope.$new();
      $compile(el.contents())(newScope);
      // We need to manually destroy scopes here when switching templates.
      if (oldScope) { oldScope.$destroy(); }
      oldScope = newScope;
    };

    scope.$watch('box.content.type', replaceTemplate);
  };

  return {
    link: link,
    restrict: 'E',
    template: `
      <div class="omnibox-wrapper">
        <div class="omnibox-inner"></div>
      </div>
    `,
    replace: false
  };
}
]);
