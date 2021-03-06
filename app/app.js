'use strict';

var evid = angular.module('evid', [
    'ngRoute',
    'ngSanitize',
    'ngMaterial',
    'ngAnimate',
    'hljs',
    'hc.marked',
    'evid.definition',
    'evid.registry',
    'evid.schema',
    'evid.api',
    'evid.page'
]);

evid.provider('evid', function () {
    var url = null;
    var exclude = null;
    var menu = null;
    var examples = false;

    this.setUrl = function (_url) {
        url = _url;
    };

    this.setExclude = function (_exclude) {
        exclude = _exclude;
    };

    this.setMenu = function (_menu) {
        menu = _menu;
    };

    this.setExamples = function (_examples) {
        examples = _examples;
    };

    this.guessEndpointUrl = function (urlRewrite) {
        var url = window.location.href;
        var removePart = function (url, sign) {
            var count = (url.match(/\//g) || []).length;
            var pos = url.lastIndexOf(sign);
            if (count > 2 && pos !== -1) {
                return url.substring(0, pos);
            }
            return url;
        };
        var parts = ['#', '?', '/', '/'];
        for (var i = 0; i < parts.length; i++) {
            url = removePart(url, parts[i]);
        }
        return url + (urlRewrite ? '/' : '/index.php/');
    };

    this.$get = function () {
        // BC workaround if the base url was not configured but the fusio_url is
        // available we use it else we guess the url
        if (url === null && typeof fusio_url !== 'undefined') {
            url = fusio_url;
        } else if (url === null) {
            url = this.guessFusioEndpointUrl(false);
        }

        return {
            url: url,
            exclude: exclude,
            menu: menu,
            examples: examples
        };
    };
});

evid.config(['$routeProvider', function ($routeProvider) {
    $routeProvider
        .when('/api/:api*?', {
            templateUrl: 'app/partials/api.html',
            controller: 'ApiCtrl'
        })
        .when('/page/:page?', {
            templateUrl: 'app/partials/page.html',
            controller: 'PageCtrl'
        })
        .otherwise({
            redirectTo: '/api/'
        });
}]);

evid.config(function ($mdThemingProvider) {
    $mdThemingProvider.theme('default')
        .primaryPalette('deep-orange')
        .accentPalette('grey');
});

evid.config(['markedProvider', function (markedProvider) {
    markedProvider.setOptions({
        gfm: true,
        tables: true,
        highlight: function (code, lang) {
            if (lang) {
                return hljs.highlight(lang, code, true).value;
            } else {
                return hljs.highlightAuto(code).value;
            }
        }
    });
}]);

evid.filter('slugify', function () {
    return function (input) {
        if (input) {
            return input.toLowerCase().replace(/\W+/g, '-');
        }

        return '';
    };
});

evid.filter('ucfirst', function () {
    return function (input) {
        if (input) {
            return input.charAt(0).toUpperCase() + input.substring(1);
        }

        return '';
    };
});

evid.controller('AppCtrl', ['$scope', '$http', '$mdSidenav', 'evid', 'definition', 'registry', function ($scope, $http, $mdSidenav, evid, definition, registry) {

    $scope.menus = evid.menu;
    $scope.categories = [];
    $scope.apps = [];
    $scope.routings = [];

    $scope.toggleSidebar = function () {
        $mdSidenav('left').toggle();
    };

    $scope.loadRoutings = function () {
        definition.initialize().then(function (result) {
            $scope.apiVersion = result.home.apiVersion;
            $scope.title = result.home.title;
            $scope.description = result.home.description;
            $scope.contactUrl = result.home.contactUrl;
            $scope.contactEmail = result.home.contactEmail;
            $scope.apps = result.home.apps;
            $scope.categories = result.home.categories;
            $scope.scopes = result.home.scopes;
            $scope.links = result.home.links;

            $scope.routings = result.def.getRoutings();
        });
    };

    $scope.loadCategory = function(category) {
        definition.initialize(category).then(function (result) {
            $scope.routings = result.def.getRoutings();
        });
    }

    $scope.isAppsNotEmpty = function() {
        return angular.isObject($scope.apps) && Object.keys($scope.apps).length > 0;
    }

    $scope.loadRoutings();

}]);

evid.run(function () {

});

