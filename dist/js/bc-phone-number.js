(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.bcPhoneNumber = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
angular.module("bcPhoneNumberTemplates", []).run(["$templateCache", function($templateCache) {$templateCache.put("bc-phone-number/bc-phone-number.html","<section class=\"input-group\">\r\n  <label for=\"{{name}}\" ng-if=\"label\">{{label}}</label>\r\n  <div class=\"input-group-btn\" uib-dropdown uib-keyboard-nav>\r\n    <button type=\"button\" class=\"btn btn-default\" type=\"button\" uib-dropdown-toggle>\r\n      <span class=\"glyphicon iti-flag bc-phone-number-flag\" ng-class=\"selectedCountry.iso2Code\"></span><span class=\"caret\"></span>\r\n      <span class=\"sr-only\">Select country: {{selectedCountry.name}}</span>\r\n    </button>\r\n    <ul class=\"uib-dropdown-menu bc-phone-number-dropdown-menu dropdown-menu\" role=\"menu\">\r\n      <li ng-repeat=\"country in preferredCountries\" ng-click=\"selectCountry(country)\"\r\n          ng-class=\"{active: isCountrySelected(country)}\" role=\"menuitem\">\r\n        <a href=\"#\" ng-click=\"$event.preventDefault()\" class=\"bc-phone-number-country-anchor\">\r\n          <i class=\"glyphicon iti-flag bc-phone-number-country-icon\" ng-class=\"country.iso2Code\"></i>\r\n          <span ng-bind=\"country.name\"></span>\r\n        </a>\r\n      </li>\r\n      <li role=\"separator\" class=\"divider\" ng-show=\"preferredCountries && preferredCountries.length\"></li>\r\n      <li ng-repeat=\"country in allCountries\" ng-click=\"selectCountry(country)\"\r\n          ng-class=\"{active: isCountrySelected(country)}\" role=\"menuitem\">\r\n        <a href=\"#\" ng-click=\"$event.preventDefault()\" class=\"bc-phone-number-country-anchor\">\r\n          <i class=\"glyphicon iti-flag bc-phone-number-country-icon\" ng-class=\"country.iso2Code\"></i>\r\n          <span ng-bind=\"country.name\"></span>\r\n        </a>\r\n      </li>\r\n    </ul>\r\n  </div>\r\n  <input type=\"tel\" name=\"{{name}}\" id=\"{{name}}\" class=\"form-control\" ng-model=\"number\" ng-disabled=\"ngDisabled\" ng-change=\"changed()\"/>\r\n</section>\r\n");}]);
},{}],2:[function(require,module,exports){
(function (global){
'use strict';

var bcCountries = (typeof window !== "undefined" ? window['bcCountries'] : typeof global !== "undefined" ? global['bcCountries'] : null);
var angular = (typeof window !== "undefined" ? window['angular'] : typeof global !== "undefined" ? global['angular'] : null);

global.angular = angular;
require('../build/js/templates');

angular.module('bcPhoneNumber', ['bcPhoneNumberTemplates', 'ui.bootstrap'])
.service('bcPhoneNumber', function() {

  this.isValid = bcCountries.isValidNumber;
  this.format = bcCountries.formatNumber;
})
.directive('bcPhoneNumber', function() {

  if (typeof (bcCountries) === 'undefined') {
    throw new('bc-countries not found, did you forget to load the Javascript?');
  }

  function getPreferredCountries(preferredCodes) {
    var preferredCountries = [];

    for (var i = 0; i < preferredCodes.length; i++) {
      var country = bcCountries.getCountryByIso2Code(preferredCodes[i]);
      if (country) { preferredCountries.push(country); }
    }

    return preferredCountries;
  }

  return {
    templateUrl: 'bc-phone-number/bc-phone-number.html',
    require: 'ngModel',
    scope: {
      preferredCountriesCodes: '@preferredCountries',
      defaultCountryCode: '@defaultCountry',
      selectedCountry: '=?',
      isValid: '=',
      ngModel: '=',
      ngChange: '&',
      ngDisabled: '=',
      name: '@',
      label: '@'
    },
    link: function(scope, element, attrs, ctrl) {
      scope.selectedCountry = bcCountries.getCountryByIso2Code(scope.defaultCountryCode || 'us');
      scope.allCountries = bcCountries.getAllCountries();
      scope.number = scope.ngModel;
      scope.changed = function() {
        scope.ngChange();
      }

      if (scope.preferredCountriesCodes) {
        var preferredCodes = scope.preferredCountriesCodes.split(' ');
        scope.preferredCountries = getPreferredCountries(preferredCodes);
      }

      scope.selectCountry = function(country) {
        scope.selectedCountry = country;
        scope.number = scope.ngModel = bcCountries.changeDialCode(scope.number, country.dialCode);
      };

      scope.isCountrySelected = function(country) {
        return country.iso2Code == scope.selectedCountry.iso2Code;
      };

      scope.resetCountry = function() {
        var defaultCountryCode = scope.defaultCountryCode;

        if (defaultCountryCode) {
          var defaultCountry = bcCountries.getCountryByIso2Code(defaultCountryCode);
          var number = bcCountries.changeDialCode(scope.number, defaultCountry.dialCode);

          scope.selectedCountry = defaultCountry;
          scope.ngModel = number;
          scope.number = number;
        }
      };

      scope.resetCountry();

      scope.$watch('ngModel', function(newValue) {
        scope.number = newValue;
      });

      scope.$watch('number', function(newValue) {
        ctrl.$setValidity('phoneNumber', bcCountries.isValidNumber(newValue));
        scope.isValid = bcCountries.isValidNumber(newValue);
      });

      scope.$watch('number', function(newValue) {
        if (newValue === '') { scope.ngModel = ''; }
        else if (newValue) {
          var digits = bcCountries.getDigits(newValue);
          var countryCode = bcCountries.getIso2CodeByDigits(digits);

          if (countryCode) {
            var dialCode = bcCountries.getDialCodeByDigits(digits);
            var number = bcCountries.formatNumber(newValue);

            if (dialCode !== scope.selectedCountry.dialCode) {
              scope.selectedCountry = bcCountries.getCountryByIso2Code(countryCode);
            }

            scope.ngModel = number;
            scope.number = number;
          }
          else { scope.ngModel = newValue; }
        }
      });
    }
  };
});

module.exports = 'bcPhoneNumber';

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"../build/js/templates":1}]},{},[2])(2)
});