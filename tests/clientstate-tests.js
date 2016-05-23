describe('Testing the Client State Service', function () {
  
  var clientState;

  beforeEach(module('global-state'));
  beforeEach(inject(function ($injector) {
    clientState = $injector.get('clientState');
  }));

  it('should some vital stuff in the state', function () {
    expect(clientState.program_mode).toBeDefined();
    expect(clientState.edit_mode).toBeDefined();
    expect(clientState.info_startingpoint).toBeDefined();
    expect(clientState.setInfoMode).toBeDefined();
  });

  it('should return a state variable as String', function () {
    var stringVersion = JSON.stringify(clientState.map_defaults);
    expect(clientState.toString('map_defaults')()).toEqual(stringVersion);
  });

  describe('Modal object', function () {
    it('should change the state and template of the modal object', function () {
      var oldTmpl = clientState.modal.templateName;
      var oldState = clientState.modal.active;
      clientState.modal.setTemplate('RANDOM_NON_EXISTENT', true);
      expect(clientState.modal.active).toBe(true);
      expect(clientState.modal.templateName).toBe('RANDOM_NON_EXISTENT');
      expect(clientState.modal.active).not.toBe(oldState);
      expect(clientState.modal.templateName).not.toBe(oldTmpl);
    });
  });

});
