/**
 *
 * Socket stuff happens here
 */


const io = require('socket.io-client');
const socketUrl = 'http://localhost:9000/';

angular.module('global-state')
  .service('socket', function ($rootScope) {
    var socket = null;
    var socketIdentifier;

    var connectSocket = function () {
      // var oldBuffer;
        // clean message buffer to prevent flushing all kinds of obsolete
        // and/or duplicate messages over the websocket when reconnecting
      for (socketIdentifier in io.sockets) {
        if (io.sockets.hasOwnProperty(socketIdentifier)) {
          // oldBuffer = io.sockets[socketIdentifier].buffer;
          io.sockets[socketIdentifier].buffer = [];
        }
      }
      socket = io.connect(
            socketUrl, {
              resource: socket_resource,
              transports: ['websocket', 'xhr-polling']
            }
        );
        // send the session_key
      socket.emit('session_key', session_key, function () {});
      socket.on('disconnect', function () {
        console.warn('Server disconnected.');
        connectSocket();
      });
    };
    connectSocket();
    return {
      reconnect: function () {
        connectSocket();
      },
      on: function (eventName, callback) {
        socket.on(eventName, function () {
          var args = arguments;
          $rootScope.$apply(function () {
            callback.apply(socket, args);
          });
        });
      },
      emit: function () {
    	                                    if (arguments.length > 2) {
	    	                                                            var callback = arguments[arguments.length - 1];
    	}
        // TODO: check if last argument is function
        // otherwise consider it a 'normal' argument
        // slightly more complex than the usual example
        // because it should took any length of arguments

        // to prevent error '$apply already in progress'
        // from: https://coderwall.com/p/ngisma
        // TODO: if this error occurs elsewhere, monkeypatch $rootScope where
        // it comes from
        $rootScope.safeApply = function (fn) {
          var phase = this.$root.$$phase;
          if (phase == '$apply' || phase == '$digest') {
            if (fn && (typeof (fn) === 'function')) {
              fn();
            }
          } else {
            this.$apply(fn);
          }
        };

    	                                    var ngcallback = function () {
	                                                                    var args = arguments;
	                                                                    $rootScope.safeApply(function () {
	                              if (callback) {
  try {
	                                                                    callback.apply(socket, args);
  } catch (error) {
    throw new Error('error applying to callback', error);
  }
	          }
	        });
	                                              };

        var args = arguments;
        Array.prototype.splice.call(arguments, arguments.length - 1, 1);
        Array.prototype.push.call(args, ngcallback);
        // because the ngcallback is already in the args the socket.emit.apply
        // below will execute the callback
        socket.emit.apply(socket, args);
      }
    };
  });
