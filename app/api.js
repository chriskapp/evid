'use strict';

angular.module('evid.api', [])

.controller('ApiCtrl', ['$scope', '$http', '$compile', '$sce', '$mdSidenav', '$mdDialog', '$routeParams', 'definition', 'schema', function($scope, $http, $compile, $sce, $mdSidenav, $mdDialog, $routeParams, definition, schema) {

  $scope.api;
  $scope.methods;
  $scope.endpoint;
  $scope.selectedMethod;

  $scope.loadApi = function() {
    definition.initialize().then(function(def) {
      var url = def.getLinkByRel('detail');
      if (url) {
        var path = $routeParams.api ? $routeParams.api : null;
        if (!path) {
          var route = def.getFirstRoute();
          if (route) {
            path = route.path;
          }
        }

        url = url.replace('{version}', '*');
        url = url.replace('{path}', path);

        $http.get(url).then(function(resp) {
          $scope.api = resp.data;
          if ($scope.api.methods) {
            var methods = {};
            for (var methodName in $scope.api.methods) {
              methods[methodName] = $scope.getSchema(methodName, $scope.api.methods[methodName]);
            }

            $scope.methods = methods;

            // set endpoint
            var endpoint = def.getLinkByRel('endpoint');
            if (endpoint && $scope.api.path) {
              $scope.endpoint = endpoint + $scope.api.path.substring(1);
            }

            // close nav
            $mdSidenav('left').close();
          }
        });
      }
    });
  };

  $scope.getSchema = function(methodName, method) {
    var apiSchema = schema.create($scope.api);
    var html = apiSchema.getHtml(methodName, method);

    var linkFn = $compile(html);
    var el = linkFn($scope);

    return $sce.trustAsHtml(el.html());
  };

  $scope.showConsole = function(ev) {
    $mdDialog.show({
      controller: ConsoleCtrl,
      templateUrl: 'partials/console.html',
      clickOutsideToClose: true,
      targetEvent: ev,
      locals: {
        endpoint: $scope.endpoint,
        method: $scope.getSelectedMethod(),
        body: $scope.getBodySample()
      }
    });
  };

  $scope.getSelectedMethod = function() {
    var i = 0;
    for (var methodName in $scope.methods) {
      if (i == $scope.selectedMethod) {
        return methodName;
      }
      i++;
    }
    return null;
  };

  $scope.getBodySample = function() {
    var methodName = $scope.getSelectedMethod();
    if (methodName == 'GET' || methodName == 'DELETE') {
      return '';
    }

    if ($scope.api.methods[methodName]) {
      var apiSchema = schema.create($scope.api);
      var data = apiSchema.getJsonSampleRequest($scope.api.methods[methodName]);

      return JSON.stringify(data, null, 4);
    } else {
      return '';
    }
  };

  $scope.loadApi();

  function ConsoleCtrl($scope, $http, endpoint, method, body) {

    $scope.request = {
      method: method,
      url: endpoint,
      accessToken: '',
      body: body
    };

    $scope.response = {
      statusCode: null,
      statusText: null,
      body: null
    };

    $scope.methods = ['GET', 'POST', 'PUT', 'DELETE'];
    $scope.loading = false;

    $scope.sendRequest = function() {
      $scope.loading = true;

      var callback = function(resp) {
        $scope.loading = false;
        $scope.response.statusCode = resp.status;
        $scope.response.statusText = resp.statusText;
        $scope.response.body = JSON.stringify(resp.data, null, 4);
      };

      var headers = null;
      var withCredentials = false;
      if ($scope.request.accessToken) {
        headers = {'Authorization': 'Bearer ' + $scope.request.accessToken};
        withCredentials = true;
      }

      var body = null;
      if ($scope.request.method == 'POST' || $scope.request.method == 'PUT') {
        body = $scope.request.body;
      }

      var conf = {
        method: $scope.request.method,
        url: $scope.request.url,
        data: body,
        headers: headers,
        cache: false,
        withCredentials: withCredentials
      };

      $http(conf).then(callback, callback);
    };

    $scope.close = function() {
      $mdDialog.cancel();
    };

  }

}]);
