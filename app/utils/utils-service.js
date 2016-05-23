/**
 * UtilService
 *
 * @returns {object} Dict with some utils
 */

const angular = require('angular');
angular.module('utils').service('UtilService', [
  '$rootScope',
  '$interpolate',
  'clientState',
  function ($rootScope, $interpolate, clientState) {
    var openWelcomePopup = function () {
      $rootScope.$broadcast('close_box', '');
      if (!clientState.modal.active ||
        clientState.modal.templateName !== 'landing') {
        clientState.modal.setTemplate('landing', true);
      }
    };

    var svgTemp = function (templateName, context) {
      let template = require('../svg-icons/' + templateName);
      const interpolater = $interpolate(template);
      return interpolater(context);
    };

    return {
      openWelcomePopup: openWelcomePopup,
      svgTemp: svgTemp
    };
  }
]);
