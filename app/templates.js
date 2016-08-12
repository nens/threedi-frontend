// a temporary necessary evil.

const module = angular.module('templates', []);

function putTemplateInCache (template, templateName) {
  module.run(['$templateCache', function ($templateCache) {
    $templateCache.put(templateName, template);
  }]);
}

putTemplateInCache(require('./components/slider/slider.html'), './components/slider/slider.html');

putTemplateInCache(require('./templates/design_rain_choice.html'), './templates/design_rain_choice.html');
putTemplateInCache(require('./templates/landing.html'), './templates/landing.html');
putTemplateInCache(require('./templates/modal.html'), './templates/modal.html');
putTemplateInCache(require('./templates/message.html'), './templates/message.html');
putTemplateInCache(require('./templates/timeout.html'), './templates/timeout.html');
putTemplateInCache(require('./templates/datetimepicker.html'), './templates/datetimepicker.html');
putTemplateInCache(require('./templates/edit_number.html'), './templates/edit_number.html');
putTemplateInCache(require('./templates/model_picker.html'), './templates/model_picker.html');
putTemplateInCache(require('./templates/design_rain_messages.html'), './templates/design_rain_messages.html');
putTemplateInCache(require('./templates/make_sure.html'), './templates/make_sure.html');
putTemplateInCache(require('./templates/make_sure_log_out.html'), './templates/make_sure_log_out.html');
putTemplateInCache(require('./templates/progress.html'), './templates/progress.html');
putTemplateInCache(require('./templates/edit_settings.html'), './templates/edit_settings.html');
putTemplateInCache(require('./templates/windrose.html'), './templates/windrose.html');
putTemplateInCache(require('./templates/confirmation.html'), './templates/confirmation.html');
putTemplateInCache(require('./templates/booting.html'), './templates/booting.html');
putTemplateInCache(require('./templates/archive_scenario.html'), './templates/archive_scenario.html');
putTemplateInCache(require('./templates/awesome/sewerage-orifice.html'), './templates/awesome/sewerage-orifice.html');
putTemplateInCache(require('./templates/awesome/sewerage-weir.html'), './templates/awesome/sewerage-weir.html');
putTemplateInCache(require('./templates/awesome/pumpstation.html'), './templates/awesome/pumpstation.html');
putTemplateInCache(require('./templates/awesome/culvert.html'), './templates/awesome/culvert.html');
putTemplateInCache(require('./templates/awesome/floodfill.html'), './templates/awesome/floodfill.html');
putTemplateInCache(require('./templates/awesome/orifice.html'), './templates/awesome/orifice.html');
putTemplateInCache(require('./templates/awesome/node.html'), './templates/awesome/node.html');
putTemplateInCache(require('./templates/awesome/manhole.html'), './templates/awesome/manhole.html');
putTemplateInCache(require('./templates/awesome/raincloud.html'), './templates/awesome/raincloud.html');
putTemplateInCache(require('./templates/awesome/infoline.html'), './templates/awesome/infoline.html');
putTemplateInCache(require('./templates/awesome/generic-info.html'), './templates/awesome/generic-info.html');
putTemplateInCache(require('./templates/awesome/sewerage-pumpstation.html'), './templates/awesome/sewerage-pumpstation.html');
putTemplateInCache(require('./templates/awesome/infopoint.html'), './templates/awesome/infopoint.html');
putTemplateInCache(require('./templates/awesome/weir.html'), './templates/awesome/weir.html');


// svg icons
putTemplateInCache(require('./svg-icons/boundary-node.html'), 'svg-icons/boundary-node');
putTemplateInCache(require('./svg-icons/culvert.html'), 'svg-icons/culvert');
putTemplateInCache(require('./svg-icons/node-circle.html'), 'svg-icons/node-circle');
putTemplateInCache(require('./svg-icons/orifice.html'), 'svg-icons/orifice');
putTemplateInCache(require('./svg-icons/pumpstation.html'), 'svg-icons/pumpstation');
putTemplateInCache(require('./svg-icons/sewerage-orifice.html'), 'svg-icons/sewerage-orifice');
putTemplateInCache(require('./svg-icons/sewerage-pumpstation.html'), 'svg-icons/sewerage-pumpstation');
putTemplateInCache(require('./svg-icons/sewerage-weir.html'), 'svg-icons/sewerage-weir');
putTemplateInCache(require('./svg-icons/v2-breach.html'), 'svg-icons/v2-breach');
putTemplateInCache(require('./svg-icons/v2-connection-nodes.html'), 'svg-icons/v2-connection-nodes');
putTemplateInCache(require('./svg-icons/v2-manhole.html'), 'svg-icons/v2-breach');
putTemplateInCache(require('./svg-icons/v2-node.html'), 'svg-icons/v2-node');
putTemplateInCache(require('./svg-icons/v2-pumpstation.html'), 'svg-icons/v2-pumpstation');
putTemplateInCache(require('./svg-icons/v2-weir.html'), 'svg-icons/v2-weir');
putTemplateInCache(require('./svg-icons/weir.html'), 'svg-icons/weir');
