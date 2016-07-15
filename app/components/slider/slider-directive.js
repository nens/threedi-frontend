// const app = require('../../threedi');
const $ = require('jquery');


angular.module('threedi-client')
.directive('slider', function (clientState, UtilService) {
  var link = function (scope, elem, attrs) {
    const sliderWidth = 300;
    scope.localState = clientState.edit_ranges[attrs.varName];

    /**
     * toggleEditMode - toggles the edit mode that both the client
     * and backend need
     *
     * @param   {string} newMode the mode we want it to switch to
     * @returns {void}
     */
    scope.toggleEditMode = function (newMode) {
      scope.localState = clientState.edit_ranges[scope.varName];
      clientState.edit_mode = newMode;
    };

    scope.manualInput = false;
    scope.valuePercentage = UtilService.updatePercentage(
      scope.localState.value, scope.localState.max, scope.localState.min
    );

    /**
     * setValue - calculate real value using fraction and round to
     * correct number of decimals
     *
     * @param   {float} fract - fraction
     * @returns {void}
     */
    scope.setValue = function (fract) {
      var valueMax = scope.localState.max;
      var valueMin = scope.localState.min;
      var decimalFactor = Math.pow(10, scope.localState.decimals);
      var oldValue = scope.localState.value;

      if ((scope.localState.slider_type === undefined) ||
          (scope.localState.slider_type === 'linear')) {
        scope.localState.value =
              Math.round(fract * (valueMax - valueMin) *
                  decimalFactor) / decimalFactor + valueMin;
      } else if (scope.localState.slider_type === 'pow2') {
        scope.localState.value =
              Math.round(Math.pow(fract, 2) *
                  (valueMax - valueMin) * decimalFactor) /
              decimalFactor + valueMin;
      }
      scope.valuePercentage = UtilService.updatePercentage(
        scope.localState.value, valueMax, valueMin
      );
      return oldValue !== scope.localState.value;  // changed
    };


    /**
     * getX function - find the X coordinate of the mouse
     *
     * @param  {object} event - mouseEvent native to browser
     * @return {float}  the X location of the mouse.
     */
    var getX = function (event) {
      var x = event.offsetX;  // normal browsers
      if (!x) {
        // hack for firefox
        x = event.clientX - $(event.currentTarget).offset().left;
      }
      return x;
    };

    scope.mousedown = function () {
      scope.mouseisdown = true;
    };

    scope.mouseup = function (event) {
      scope.mouseisdown = false;
      return scope.setValue(getX(event) / sliderWidth);
    };

    scope.mousemove = function (event) {
      if (scope.mouseisdown) {
        return scope.setValue(getX(event) / sliderWidth);
      }
      return false;
    };
  };

  return {
    link: link,
    replace: true,
    templateUrl: './components/slider/slider.html',
    scope: {
      varName: '@'
    }
  };
});
