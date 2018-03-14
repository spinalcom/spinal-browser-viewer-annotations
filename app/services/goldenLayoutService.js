angular.module('app.services')
  .factory('goldenLayoutService', ['$q', '$window', '$templateCache', '$rootScope', '$compile',
    function ($q, $window, $templateCache, $rootScope, $compile) {
      var config = {
        content: [{
          type: 'row',
          content: [{
            isClosable: false,
            title: "Viewer",
            type: 'component',
            componentName: 'SpinalHome',
            componentState: {
              template: 'forgeviewer.html',
              controller: 'forgeViewerCtrl'
            }
          }]
        }]
      };
      let myLayout = 0;
      let factory = {};
      factory.init = () => {
        if (myLayout == 0) {
          myLayout = new GoldenLayout(config, $("#g-layout"));
          myLayout.registerComponent('SpinalHome', function (container, state) {
            var element = container.getElement();
            if (state.template == '') {

              element.html();
              $compile(element.contents())($rootScope);
            } else {
              element.html("<div class=\"gpanel-content\" ng-controller=\"" + state.controller + "\" ng-cloak>" +
                $templateCache.get(state.template) + "</div>");
              $compile(element.contents())($rootScope);
            }
          });

          myLayout.init();
          angular.element($window).bind('resize', function () {
            myLayout.updateSize();
          });
          $rootScope.$emit("GoldenLayout_READY");
        }
      };

      factory.wait_ready = () => {
        return $q(function (resolve, reject) {
          $rootScope.$on("GoldenLayout_READY", () => {
            resolve();
          });
        });
      };



      factory.createChild = (config) => {
        myLayout.root.contentItems[0].addChild(config);
      };

      factory.createDragSource = (element, config) => {
        myLayout.createDragSource(element, config);

      };


      return factory;
    }
  ])
  .factory('layout_uid', function () {
    let uid = 0;
    return ({
      get: () => {
        let id = uid++;
        return id;
      }
    });
  });