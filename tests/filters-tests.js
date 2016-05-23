/**
 *
 * Test custom angular filters
 */
describe('Testing custom angular filters', function () {

  beforeEach(module('threedi-client'));

  describe('serverTimeToMinutes', function() {

    it('should convert seconds to HH:mm format',
      inject(function(serverTimeToMinutesFilter) {
        expect(serverTimeToMinutesFilter(undefined)).toBe('00:00');
        expect(serverTimeToMinutesFilter(300)).toBe('00:05');
      }));
  });


});
