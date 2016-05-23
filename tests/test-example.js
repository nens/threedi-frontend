describe('Testing threedi', function() {

  // Example of a test for threedi
  // setup some globals
  var $compile,
      $rootScope,
      $httpBackend,
      data,
      $controller,
      ctrl,
      element,
      scope;

  // this is called before Each test
  beforeEach(module('threedi-client'));

  // state service mock. 
  beforeEach(module(function ($provide) {
    $provide.value('state', {
      state: {
        player_extent: "[0,3,0,3]",
        timestep: 30
      }
    });
  }));

  beforeEach(inject(function (_$rootScope_, _$httpBackend_) {
    $rootScope = _$rootScope_;
    $httpBackend = _$httpBackend_;
  }));

  // the actual test
  describe('Test DirectorCtrl', function () {
    // get some angular internals
    beforeEach(inject(function ($controller, $compile) {
      element = angular.element('<div ng-controller="Director"></div>');
      element = $compile(element)($rootScope);
      scope = element.scope();
      ctrl = $controller('Director', {$scope: scope});
    }));

    it('should assert something', function () {
      expect(true).toBe(true);
    });
  })

});
