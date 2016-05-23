(function() {
var app = angular.module('chart-tab-directives', []);

  app.directive("chartTabs", function() {
    console.log('Hallo');
    return  {
      restrict: "E",

      templateUrl: "chart-tabs.html",
      controller: function() {
        this.tab = 1;

        this.isSet = function(checkTab) {
          return this.tab === checkTab;
        };

        this.setTab = function(activeTab) {
          this.tab = activeTab;
        };
      },
      controllerAs: "tab"


    };
  });

})();
