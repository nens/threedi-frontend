const $ = require('jquery');

/**
 * Shows message in the bottom right.
 * Used for user feedback from subgrid or application errors.
 * @param {string} message - Message of alert
 * @param {string} alertClass - Css class of alert (warning, danger succes etc)
 * @param {int} timeOut - how long the alert should be displayed
 * @returns {void}
 */
function showalert (message, alertClass, timeOut) {
  // what css class and timeout to use, if none, use default;
  const alert_class = alertClass || 'alert-info';
  const timeout = timeOut || 5000;

  var position = 90 + $('#alert_placeholder div').length * 55;  // pixels
  $('#alert_placeholder').append(
      '<div id="alertdiv" style="margin-bottom: 0px; bottom: ' +
      position + 'px;" class="alert ' +  alert_class +
      '"><a class="close" data-dismiss="alert">×</a><span>' +
      message + '</span></div>'
  );

 // this will automatically close the alert and
 // remove this if the users doesnt close it in 10 secs
  setTimeout(function () {
    requestAnimationFrame(function () {
      $("#alertdiv").remove();
    });
  }, timeout);
}

module.exports = showalert;
