const angular = require('angular');

angular.module("threedi-client")
.filter("serverTimeToMinutes", function () {
  return function (seconds) {
      if (seconds === undefined) {
        return '00:00';
      }
      // format time in HH:MM from seconds
      var hours = Math.floor(seconds / 3600);
      var minutes = Math.floor((seconds - (hours * 3600)) / 60);
      var days = 0;

      // count days and set hours to be the remainder
      // of a division by 24
      if (hours >= 24) {
        days = Math.floor((hours / 24));
        hours = hours % 24;
      }

      if (hours < 10) { hours = "0" + hours;}
      if (days < 10) { days = "0" + days;}
      if (minutes < 10) { minutes = "0" + minutes;}

      // if the calculation has gone on for more than 0 days
      // add the days. Otherwise result with emtpy string
      var time = (days !== "00") ? days + ':' : '';
      time += hours + ':' + minutes;
      return time;
  };
});

angular.module("threedi-client")
.filter('capitalize', function () {
    return function(input) {
        if (input !== null)
            input = input.toLowerCase();
        return input.substring(0,1).toUpperCase() + input.substring(1);
    }
});

angular.module("threedi-client")
.filter('stripInvSuffix', function () {
    return function(input) {
        if (input !== null) {
            var index = input.indexOf('(inv)')
            if (index > -1) {
                return input.slice(0, index);
            }
            else {
                return input;
            }
        } else {
            return null;
        }
    }
});
