require('../tests-helper');

describe('Testing the Modal stuff in Bootstrap ui module', function () {

  var el,
      clientState,
      scope,
      templateCache;

  beforeEach(module('bootstrap-ui'));
  beforeEach(module('global-state'));
  beforeEach(inject(function ($compile, $injector, $rootScope) {
    clientState = $injector.get('clientState');
    templateCache = $injector.get('$templateCache');
    scope = $rootScope.$new();
    // HTTP MOCKS
    templateCache.put('/template/modal/', '<div><div class="modal-dialog"></div></div>');
    templateCache.put('/template/landing/', '<div class="landing"></div>');
    templateCache.put('/template/faker/', '<div class="faker"></div>');

    // Go through the motions of ng picking this up
    el = angular.element('<modal></modal>');
    var newEl = $compile(el)(scope);
    scope.$digest();
  }));

  it('should start out with the default html', function () {
    var landingHTML = el.children().html();
    expect(landingHTML).toBe(
      templateCache.get('/template/' + clientState.modal.templateName  + '/'));
  });

  it('should change to a template set in setTemplate', function () {
    clientState.modal.setTemplate('faker', true);

    // run angular magic to make sure scopes are set and
    // watches are triggered
    scope.$digest()

    var fakerHTML = el.children().html();
    expect(fakerHTML).toBe(
      templateCache.get('/template/faker/'));
  });


});
