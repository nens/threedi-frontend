// mocking a map element for tests;
var mapEl = document.createElement('div');
var body = document.documentElement;
mapEl.id = "map";
body.appendChild(mapEl);

var wmsEl = document.createElement('div');
wmsEl.className = 'workspace-wms-layer';
wmsEl.dataset.workspaceWmsUrl = 'http://localhost:5000/3di/wms';
body.appendChild(wmsEl);

window.model_extent = [0, 0, 0, 0];
window.onedee_url = '/onedee/tiles/{z}/{x}/{y}/';

// Some dummies to prevent errors.
window.socket_url = '';
window.socket_resource = '';
window.session_key = '';
var debug = true;
var user_organisation_id = '';
