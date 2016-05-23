describe('Testing Threedi-boxes', function () {

  var ctrlElement = function (controller) {
      element = angular.element('<div ng-controller="' + controller +'">'
      + '</div>');
    return element;
  };

  var $compile, $rootScope, $httpBackend, data, $controller, ctrl, element, scope;

  beforeEach(module('threedi-client'));
  // service mock. 
  beforeEach(module(function ($provide) {
          $provide.value('state', {
            state: {
              player_extent: "[0,3,0,3]",
              time_seconds: 30
            }
          });
          $provide.value('leaflet', {
            // beware: this part doubles for the leaflet_service
            onedee_status: {
              current_status: {
                data: {
                  pumps: null
                }
              }
            },
            // beware: and this part doubles for the leaflet object
            removeInfoMarker: function () { 
              // dummy
              //console.info('removeInfoMarker');
            },
            removeChannelMarker: function () {
              // dummy
              //console.info('removeChannelMarker');
            }
          });
      }));
  
  beforeEach(inject(function (_$compile_, _$rootScope_, _$httpBackend_, $controller) {
    $compile = _$compile_;
    $rootScope = _$rootScope_;
    $httpBackend = _$httpBackend_;
    $controller = $controller;
  }));

  describe('Testing Pumpstation boxes', function() {
    beforeEach(inject(function ($controller, $compile) {
      element = ctrlElement('PumpStation');
      element = $compile(element)($rootScope);
      scope = element.scope();
      ctrl = $controller('PumpStation', {$scope: scope});
      //ctrl = $controller('PumpStation');
    })); 

    it('should retrieve undefined if not available', function () {
      var structure = 'pumpstation';

      var activeObject = scope.retrieveActive(structure, 1);
      expect(activeObject).toEqual(false);
    });

    it('should retrieve undefined if not available 2', function () {
      var structure = 'pumpstation';

      // mock state
      scope.leaflet_service.onedee_status.current_status.data.pumps = 
          {"capacity": {"4": 0.1}};

      var activeObject = scope.retrieveActive(structure, 4);
      expect(activeObject.hasOwnProperty('capacity')).toBe(true);
    });

  });

  // describe('Testing Manholes', function () {
  //   beforeEach(inject(function ($controller, $compile) {
  //     element = ctrlElement('Manhole');
  //     element = $compile(element)($rootScope);
  //     scope = element.scope();
  //     ctrl = $controller('Manhole', {$scope: scope});
  //   }));

  //   it('should change amount', function () {
  //     scope.properties = {
  //       amount: 3
  //     };
  //     scope.set_amount(200);
  //     expect(scope.properties.amount).toEqual(200);
  //   });

  // });

  // describe('Testing Discharges', function () {
  //   beforeEach(inject(function ($controller, $compile) {
  //     element = ctrlElement('Discharge');
  //     element = $compile(element)($rootScope);
  //     scope = element.scope();
  //     ctrl = $controller('Discharge', {$scope: scope});
  //   }));

  //   it('should change amount', function () {
  //     scope.properties = {
  //       amount: 3
  //     };
  //     // scope.set_amount(200);
  //     var content = {};
  //     content.properties = {
  //       amount: 200
  //     };
  //     scope.$parent.$broadcast('manhole', 'my message', content);
  //     expect(scope.properties.amount).toEqual(200);
  //   });

  // });

  describe('Testing InfoPoint', function () {
    var content;

    beforeEach(inject(function ($controller, $compile) {
      
      element = ctrlElement('InfoPoint');
      element = $compile(element)($rootScope);
      scope = element.scope();
      element.html("{[{ selectedInfo.name  }]} ");
      ctrl = $controller('InfoPoint', {$scope: scope});
      scope.state = {
        state: {
          loaded_model: 'test',
        }
      };
      content = {
        mode: 1,
        contenttype: 'channel'
      };
      scope.$parent.$broadcast('infopoint', content);

    })); 

    it('should have the same contenttype as being sent', function () {
      expect(scope.content.contenttype).toEqual(content.contenttype);
    });

    it('selectInfo should select an Info object', function () {
      scope.selectInfo(1);
      expect(scope.selectedInfo.name).toEqual('Discharge'); 
    });

    it('should close the infopoint and purge', function () {
      scope.$parent.$broadcast('infopoint-close');
      expect(scope.content).toBe(null);
    });

    it('should set url and counter on server state message', function () {
      scope.$parent.$broadcast('serverState', scope.state);
      expect(scope.counter).toBe(30);
    });

  });

});
