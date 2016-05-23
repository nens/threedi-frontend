/**
 *
 * This is a temporary place for some stuff that doesn't have a place yet.
 * This contains initiators for stuff like datetimepickers, or the
 * requestAnimationFrame wrapper.
 *
 */


/**
 * Polyfill for requestAnimationFrame.
 * requestAnimationFrame is a standard now, but is still prefixed
 * in some older browsers.
 * https://developer.mozilla.org/en-US/docs/DOM/window.requestAnimationFrame
 */
(function() {
  var requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
  window.requestAnimationFrame = requestAnimationFrame;
})();


var animation_counter = 0,
    max_animation_count = 10,
    layers = [],
    loaded_layers = 0,
    active_layer = null;

var showalert;


/**
 * @function
 * @description shows message in the bottom right.
 * Used for user feedback from subgrid or application errors.
 * TODO: move to proper templated thing
 */
function showalert(message, alert_class, timeout) {
    // what css class and timeout to use, if none, use default;
    alert_class = alert_class ? alert_class : 'alert-info';
    timeout = timeout ? timeout : 5000;

    var position = 90 + $('#alert_placeholder div').length * 55;  // pixels
    $('#alert_placeholder').append(
        '<div id="alertdiv" style="margin-bottom: 0px; bottom: ' +
        position + 'px;" class="alert ' +  alert_class +
        '"><a class="close" data-dismiss="alert">×</a><span>' +
        message +'</span></div>'
    );

   // this will automatically close the alert and
   // remove this if the users doesnt close it in 10 secs
    setTimeout(function() {
        requestAnimationFrame(function(){
            $("#alertdiv").remove();
        });
    }, timeout);
}


// Aggressive obtrusive message box if your browser is incompatible.
if (navigator.userAgent.indexOf('Firefox') != -1 &&
    parseFloat(navigator.userAgent.substring(navigator.userAgent.indexOf('Firefox') + 8)) >= 3.6){
    //Firefox
} else if (navigator.userAgent.indexOf('Chrome') != -1 &&
    parseFloat(navigator.userAgent.substring(navigator.userAgent.indexOf('Chrome') + 7).split(' ')[0]) >= 15){
    //Chrome
} else if (navigator.userAgent.indexOf('Safari') != -1 &&
    navigator.userAgent.indexOf('Version') != -1 &&
    parseFloat(navigator.userAgent.substring(navigator.userAgent.indexOf('Version') + 8).split(' ')[0]) >= 5){
    //Safari
} else if (navigator.userAgent.indexOf('PhantomJS') != -1) {
  // test browser
} else {
    alert("You are using an unsupported browser. Use a recent Chrome or Firefox instead.");
}

// Javascript is ur friend, has no keys() and doesn't afraid of anything
var keys = function (obj) {
    var result = [];
    for (var k in obj) {
        result.push(k);
    }
    return result;
};

var listKeys = function (obj) {

    var i,
        key,
        all_keys = keys(obj);

    for (i=0; i<all_keys.length; i++) {
        key = all_keys[i];
        console.log("\t(" + i + ")- " + key.toString());
    }
    console.log("\n");
};

var contains = function (ls, x) {
    // Check whether an element is in a JS list/"array"
    return ls.indexOf(x) > -1;
};
