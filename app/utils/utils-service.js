/**
 * UtilService
 *
 * @returns {object} Dict with some utils
 */


angular.module('utils').service('UtilService', [
  '$rootScope',
  '$interpolate',
  '$templateCache',
  'clientState',
  function ($rootScope, $interpolate, $templateCache, clientState) {
    var utils = {};

    utils.openWelcomePopup = function () {
      $rootScope.$broadcast('close_box', '');
      if (!clientState.modal.active ||
        clientState.modal.templateName !== 'landing') {
        clientState.modal.setTemplate('landing', true);
      } else {
        clientState.modal.setTemplate('landing', true);        
      }
    };

    utils.svgTemp = function (templateName, context) {
      let template = $templateCache.get('svg-icons/' + templateName);
      const interpolater = $interpolate(template);
      return interpolater(context);
    };

    utils.contains = function (ls, x) {
      // Check whether an element is in a JS list/"array"
      return ls.indexOf(x) > -1;
    };

    utils.updatePercentage = function (value, max, min) {
      const fullPercentage = 100;
      return fullPercentage * (value - min) / (max - min);
    };

    utils.updatePercentagePow2 = function (value, max, min) {
      const fullPercentage = 100;
      const powerBy = 0.5;
      return fullPercentage * Math.pow((value - min) / (max - min), powerBy);
    };

    return utils;
  }
]);
