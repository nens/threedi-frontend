const angular = require('angular');
const showalert = require('./showalert');

require('./controllers/activesimulations-controller');
require('./controllers/backgroundlayer-controller');
require('./controllers/bootingstatus-controller');
require('./controllers/clientstate-controller');
require('./controllers/confirmation-controller');
require('./controllers/debug-controller');
require('./controllers/defaultsettings-controller');
require('./controllers/editlayer-controller');
require('./controllers/getmessage-controller');
require('./controllers/loadsave-controller');
require('./controllers/loadscenario-controller');
require('./controllers/makesure-controller');
require('./controllers/modelchooser-controller');
require('./controllers/modelchooserbutton-controller');
require('./controllers/modules-controller');
require('./controllers/panelswitcher-controller');
require('./controllers/remotecontrol-controller');
require('./controllers/resetmodel-controller');
require('./controllers/root-controller');
require('./controllers/scenarioinfo-controller');
require('./controllers/simulator-controller');
require('./controllers/status-controller');
require('./controllers/status-controller');
require('./controllers/structurelayer-controller');
require('./controllers/threedislider-controller');
require('./controllers/touchingground-controller');

/* Grants access to messages from different controllers. */
angular.module('threedi-client')
  .factory('Message', function () {
    var txtMessage = {
      confirmMessage: 'Please confirm...!' // default message
    };

    return {
      getConfirmMessage: function () {
        return txtMessage.confirmMessage;
      },
      setConfirmMessage: function (txt) {
        txtMessage.confirmMessage = txt;
      }
    };
  });

angular.module('threedi-client')
   .service('BeaufortConverterService', function () {
    // Equations based on empircal relation: v = 0.836 B^3/2 m/s
     this.beaufort_to_ms = function (speed, precision) {
       var v = 0.836 * Math.pow(speed, 1.5);
       return Number(v.toFixed(precision));
     };

     this.ms_to_beaufort = function (speed, precision) {
       var v = Math.pow(speed / 0.836, (2.0 / 3.0));
       return Number(v.toFixed(precision));
     };
   });


angular.module('threedi-client').service('state', [
  '$rootScope', 'modes', 'clientState',
  function ($rootScope, modes, clientState) {
    /**
     * @function
     * @description make sure booting modal is open and update progress
     * @return {void}
     */
    function openBootingModal () {
      clientState.modal.setTemplate('booting', true);
    }

    return {
    // TODO: use this object, not derivatives like master, time, ...
      state: null,
      scenarios: null,
      master: false,
    // to be filled by setPlayerState
      status_label: null,
      state_text: '',
      machines_busy: false,
      detail_info: '',

    // set this.master according to state and sessid
    // side effect: can send broadcast close_box
      setMaster: function (state, sessid) {
        if (!state.hasOwnProperty('player')) { return "there's no state to read";}
        this.have_master = (state.player.master_sessid !== undefined);
        // Check if you're the master
        if (state.player.master_sessid === sessid) {
          if (!this.master) {
            console.log('You just became master');
          }
          this.master = true;
        } else {
          if (this.master) {
            console.log('You just became slave');
                // close all open boxes
            $rootScope.$broadcast('close_box', '');
                // In case you just quit the session, you want the landing page.
                // In other cases we can close the modal.
            if (clientState.modal.templateName !== 'landing') {
              clientState.modal.active = false;
            }
          }
          this.master = false;
        }
        return state;
      },
    // prepare global tile_url, onedee_url
    // can broadcast new-model, close_box, animation-update
    // can close modal
    // manipulate clientState variables
      setPlayerstate: function (state, old_state) {
        if (!state.hasOwnProperty('player')) { return "there's no state to read";}
        if ((state.player.mode === 'sim') || (state.player.mode === 'play')) {  // always??

          if ((state.loaded_model !== undefined) &&  // server has a loaded model
                (state.loaded_model !== 'None') &&
                ( ( (old_state !== null) &&
                    (old_state.loaded_model !== state.loaded_model) ) ||  // new loaded model
                  (old_state === null) ) ) // initial
                {

                // update tile_url for foregroundlayers
            tile_url = tile_url_template
                    .replace('_model_name_', state.loaded_model)
                    .replace('_model_version_', state.loaded_model_version);

            onedee_url = onedee_url_template
                    .replace('_model_name_', state.loaded_model)
                    .replace('_model_version_', state.loaded_model_version);

            console.log('new model detected');
            if (old_state === null) {
                    // freshly loaded page: set onedee inversion correctly
              $rootScope.$broadcast('new-model', backgroundLayerDefaultInversion);
            } else {
              $rootScope.$broadcast('new-model');
            }

                // reset some variables
            clientState.edit_mode = modes.EDIT_MODE_DEFAULT;
            clientState.setMode(modes.MODE_INFO_POINT);
            clientState.info_startingpoint = 0;

            showalert('Using model ' + state.loaded_model_display_name + '.');

                // Close AwesomeBox if open.
            $rootScope.$broadcast('close_box', '');

                // Close modal windows if open
            clientState.modal.active = false;
          }

            // in some states windows can always be closed.
          if ((state.state === 'standby') ||
                (state.state === 'load-model') ||
                (state.state === 'wait-load-model')) {

                // there is no model loaded, so close all existing windows.
            console.log('Close all boxes and modals.');
                // Close AwesomeBox if open.
            $rootScope.$broadcast('close_box', '');
                // Close modal windows if open, if it is not the load screen.
            if ((clientState.modal.templateName !== 'model_picker') &&
                    (clientState.modal.templateName !== 'landing') &&
                    (clientState.modal.templateName !== 'booting')) {
              clientState.modal.active = false;
            }
          }

          $rootScope.$broadcast('animation-update');
        }

        // set textual derivatives in this + clientState
        var state_text = state.state;
        if (state.state_extra !== undefined) {
          state_text = state_text + ', ' + state.state_extra;
        }
        this.state_text = state_text;

        clientState.normal_message_for_controller = '';
        clientState.error_message_for_controller = '';

        switch (state.state) {
        case 'standby':
          this.status_label = 'Standby (no model loaded)';
          break;
        case 'wait':
          this.status_label = 'Wait for instructions.';
          break;
        case 'sim':
          this.status_label = 'Simulation running';
          break;
        case 'prepare-wms':
          this.status_label = 'Preparing wms before loading model';
          break;
        case 'load-model':
          this.status_label = 'Loading model';
          break;
        case 'init-modules':
          this.status_label = 'Init modules: ' + state.state_extra;
          break;
        case 'loaded-model':
          this.status_label = 'Preparing model data';
          break;
        case 'archive':
          this.status_label = 'Archiving';
          break;
        case 'stopping':
          this.status_label = 'Stopping simulation';
          break;
        case 'wait-load-model':
          this.status_label = 'Wait for user to choose model';
          if (this.master) {
            clientState.normal_message_for_controller =
                        'There is no model loaded. Choose an initial model.';
            clientState.modal.setTemplate('message', true);
          }
          break;
        case 'crashed-model':
          this.status_label = 'Model crashed. Wait for user to choose model';
          if (this.master) {
            clientState.normal_message_for_controller = '';
            clientState.error_message_for_controller = state.state_extra;
            clientState.modal.setTemplate('message', true);
          }
          break;
        case 'machine-requested':
        case 'machine-requesting':
        case 'machine-powering':
        case 'machine-powered':
          var detail_info_raw = state.state;
          this.detail_info = detail_info_raw.replace('-', ' ');
          this.machines_busy = false;
          this.status_label = 'Machine is booting';
          openBootingModal();
          break;
        case 'machine-unavailable-limit-reached':
        case 'machine-unavailable-perform-scaling':
          this.machines_busy = true;
          this.status_label = 'but there is no machine available at this moment.' +
                    ' Please try again later.' + this.state_text;
          openBootingModal();
          break;
        case 'machine-unavailable':
          this.machines_busy = true;
          this.status_label = state.state_extra +
                    ' Please try again later.';
          openBootingModal();
          break;
        case 'timed_out':
          clientstate.modal.setTemplate('timeout', true);
          break;
        }
      },
    // broadcast scenario_events
      setScenarioEvents: function (state) {
        if (typeof state.scenario_events != 'undefined') {
          $rootScope.$broadcast('scenario_events', state.scenario_events);
        }
      },
      showAlertIfAny: function (state) {
        if (typeof state.message != 'undefined') {
          showalert(state.message, 'alert-' + state.message_type);
        }
      },
      setState: function (state, sessid) {
        // this function is performs all the
        // different steps involved with the state
        var old_state = this.state;

        if (JSON.stringify(state) === JSON.stringify(old_state)) {
          return; // do nothing the state hasn't changed.
        }

        this.state = state;  // store state
        this.setMaster(state, sessid);
        this.setPlayerstate(state, old_state);
        this.setScenarioEvents(state);
        // this.setAfterModelChange(state);
        this.showAlertIfAny(state);

        $rootScope.$broadcast('serverState');  // Let everybody react
      },
      setAvailableScenarios: function (scenarios) {
        // process a new list of available scenarios
        // this.available_scenarios = scenarios;
        this.scenarios = scenarios;
        // so, where does the "available-scenarios" go?
        $rootScope.$broadcast('available-scenarios');
      }
    };
  }]);
