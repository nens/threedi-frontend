
const $ = require('jquery');

/* Content of model popup */
angular.module('threedi-client').controller('ModelChooser', [
  '$scope',
  '$http',
  'socket',
  'clientState',
  'state',
  function (
    $scope,
    $http,
    socket,
    clientState,
    state
  ) {
    $scope.is_loading = false;
    $scope.load_text = 'Loading...';
    $scope.is_loading_model_data = false;
    $scope.loading_model_data_text = 'Loading model data. Please wait...';
    $scope.error_text = '';
    $scope.state_text = '';
    $scope.mode = 'model'; // 'model' or 'scenario'
    $scope.scenarios = [];
    $scope.selected_model = null;
    $scope.selected_model_name = null;
    $scope.wait_for_model_loaded = true;
    $scope.loading_model_done = false;
    $scope.landing = false;
        // model data from inpy api
    $scope.model_list = [];
    $scope.model_list_count = null;
    $scope.model_list_previous_url = null;
    $scope.model_list_next_url = null;
    $scope.model_search_query = null;
    $scope.model_sort_key = 'last_update'; // default sort key
    $scope.model_sort_direction = 'desc';  // default sort direction

    $scope.init = function () {
            // init function for this controller; loads the model list
      $scope.getModelList();
    };

    function isEmpty (obj) {
            // check if the given obj is empty: null, undefined, '' or {}
      for (var prop in obj) {
        if (obj.hasOwnProperty(prop)) {
          return false;
        }
      }
      return true;
    }

    var toggleSortDirection = function () {
      if ($scope.model_sort_direction === 'desc') {
        $scope.model_sort_direction = 'asc';
      } else {
        $scope.model_sort_direction = 'desc';
      }
    };

    var getSortString = function () {
      return $scope.model_sort_key + '_' + $scope.model_sort_direction;
    };

    $scope.getSortedModelList = function (sortKey) {
      if ($scope.model_sort_key === sortKey) {
                // same key; only toggle the sort direction
        toggleSortDirection();
      } else {
        $scope.model_sort_key = sortKey;
        if (sortKey === 'model') {
                    // default for model is ascending
          $scope.model_sort_direction = 'asc';
        } else {
          $scope.model_sort_direction = 'desc';
        }
      }
      $scope.getModelList();
    };

    $scope.do_model_search = function () {
      var searchQuery = $('#model-search input').val();
      if (searchQuery) {
        $scope.model_search_query = searchQuery;
      } else {
        $scope.model_search_query = null;
      }
      $scope.getModelList();
    };

    $scope.getModelList = function (previousNext) {
      $scope.is_loading_model_data = true;
      $scope.error_text = '';
      var url;
      switch (previousNext) {
      case 'previous':
        url = $scope.model_list_previous_url;
        break;
      case 'next':
        url = $scope.model_list_next_url;
        break;
      default:
        url = inp_server_models_api_url + '?fp=' + // eslint-disable-line
                          inp_server_filter_params + '&page_size=' + // eslint-disable-line
                          inp_server_models_api_page_size + '&sort=' + // eslint-disable-line
                          getSortString();
      }
      if ($scope.model_search_query !== null) {
        url += '&q=' + $scope.model_search_query;
      }
      console.log('URL for calling inpy (for available models):', url);
      var responsePromise = $http.get(url, {timeout: 20000});
      responsePromise.success(function (data) {
        if (isEmpty(data)) {
          console.log('No model list data at the moment');
          $scope.model_list = [];
          $scope.model_list_count = null;
          $scope.model_list_previous_url = null;
          $scope.model_list_next_url = null;
          $scope.error_text = 'No model data found. Contact helpdesk to solve this issue.';
        } else {
          console.log('model list data: ', data);
          $scope.model_list = data.results;
          $scope.model_list_count = data.count;
          $scope.model_list_previous_url = data.previous;
          $scope.model_list_next_url = data.next;
          if (data.count === 0) {
            $scope.error_text = 'No model data available for you. Contact helpdesk to solve this.';
          } else {
            $scope.error_text = '';
          }
        }
        $scope.is_loading_model_data = false;
      }).error(function () {
        $scope.model_list = [];
        console.log('Error - AJAX to retrieve models failed!');
        $scope.error_text = 'Error fetching model data: please try again or contact the helpdesk.';
        $scope.is_loading_model_data = false;
        $scope.model_list = [];
        $scope.model_list_count = null;
        $scope.model_list_previous_url = null;
        $scope.model_list_next_url = null;
      });
    };

        // setter to change to true on click event from landing.html
    $scope.touchDown = function (landing) {
      $scope.landing = landing;
    };

        // determine if the loading screen is to be showed
    $scope.show_loading = function () {
      if (clientState.error_message_for_controller !== '') {
        $scope.error_message = clientState.error_message_for_controller;
        return false;
      }
      return $scope.is_loading;
    };

    $scope.$on('no_machines_available', function () {
      $scope.is_loading = false;
      $scope.$parent.tab = 'follow';  // so, what happens then?
          // update the current list of active simulations
      $scope.get_active_simulations();
    });

    $scope.$on('serverState', function () {
            // update state_text
      var stateText = state.state.state;
      if (state.state.state_extra) {
        stateText = stateText + ', ' + state.state.state_extra;
      }
      $scope.state_text = stateText;
            // update is_loading
      if (state.state.state === 'load-model' ||
                state.state.state === 'loaded-model' ||
                state.state.state === 'init-modules') {
        $scope.is_loading = true;
      } else if (
                state.state.state === 'standby' ||
                state.state.state === 'prepare-wms') {
                // no opinion
      } else {
        $scope.is_loading = false;
        if ($scope.wait_for_model_loaded) {

/*                    // Close and reset model chooser*/
                    // var modelChooserModal = $("#modelChooserModal");
                    // modelChooserModal.find('.modal-footer').show();
                    // modelChooserModal.find('.modal-header').find('.close').show();
                    // modelChooserModal.modal('hide');
                    // $scope.wait_for_model_loaded = false;
                    // if ($scope.landing) {
                        // $scope.loading_model_done = true;
                        // var LandingModal = $("#LandingModal");
                        // LandingModal.modal('hide');
                        // $scope.touchDown(false)
                    /* }*/
        }
      }
    });

    $scope.emit_model_event = function (
      modelSlug,
      scenarioSlug,
      modelType,
      change) {
      var eventHandler;
      if (change) {
        eventHandler = 'change_model';
      } else {
        eventHandler = 'initial_model';
      }
      socket.emit(eventHandler,
            modelSlug, scenarioSlug, modelType,
            function () {
              console.log(
                    'emitted ', eventHandler, modelSlug,
                    scenarioSlug, modelType);
            });
        // socket.emit('change_model', model_name, function() {});
        // Put the chooser screen in "in progress" state.
      $scope.setMode('model');
        // show a progress
      $scope.is_loading = true;
      $scope.wait_for_model_loaded = true;  // box is now open
      $scope.load_text = 'Loading ' + $scope.selected_model_name + ' ...';
    };

    // $scope.setModel = function (modelSlug, modelDisplayName, scenarios_json, editable_maps, modelType) {
    /*
    set (load) a new model.

    function is called from model_picker.html, landing.html and timeout.html

    model object must have properties:

    slug, display_name, scenarios_json,
    editable_maps, animation_maps,
    threedi_model_repository.modelType,

    asMaster: normally true, you can set it to false
     */
    $scope.setModel = function (model, asMaster) {
      if ((state.master) || (asMaster === false)) {
        var modelSlug = model.slug;
        var modelDisplayName = model.display_name;
        var editable_maps = model.editable_maps; // eslint-disable-line
        var animation_maps = model.animation_maps; // eslint-disable-line
        var modelType = model.threedi_model_repository.model_type;
        console.log('chosen model: ', model);

            // apparently need to specify parent.
        try {
          $scope.$parent.editable_maps = JSON.parse(editable_maps);
        } catch (e) {
          console.error('editable maps are not really json', e);
          console.log(editable_maps);
          $scope.$parent.editable_maps = [];
        }
        try {
          $scope.$parent.animation_maps = JSON.parse(animation_maps);
        } catch (e) {
          console.error('animation maps are not really json', e);
          console.log(animation_maps);
        }

        $scope.selected_model = modelSlug;
        $scope.selected_model_name = modelDisplayName;
        $scope.emit_model_event(
                $scope.selected_model, null, modelType, asMaster);

            // reset error message, if any
        clientState.error_message_for_controller = '';
        $scope.error_message = clientState.error_message_for_controller;
      } else {
        console.log('cannot change model as slave, asMaster=' + asMaster);
      }
    };

    $scope.setScenario = function (scenarioSlug) {
        // now we have model and scenario -> send to server
      console.log('chosen scenario: ', scenarioSlug);
      $scope.emit_model_event($scope.selected_model, scenarioSlug);
    };

    $scope.setMode = function (newMode) {
      $scope.mode = newMode;
    };

    // call the init function that loads the models
    $scope.init();
  }]);
