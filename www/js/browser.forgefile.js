(function(){function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s}return e})()({1:[function(require,module,exports){
(function(e){"use strict";var t=function(){function defineProperties(e,t){for(var o=0;o<t.length;o++){var r=t[o];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(e,r.key,r)}}return function(e,t,o){return t&&defineProperties(e.prototype,t),o&&defineProperties(e,o),e}}();function _classCallCheck(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}function _possibleConstructorReturn(e,t){if(!e)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return!t||"object"!=typeof t&&"function"!=typeof t?e:t}function _inherits(e,t){if("function"!=typeof t&&null!==t)throw new TypeError("Super expression must either be null or a function, not "+typeof t);e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,enumerable:!1,writable:!0,configurable:!0}}),t&&(Object.setPrototypeOf?Object.setPrototypeOf(e,t):e.__proto__=t)}var o=module.exports={},r=function(e){function ForgeFileDerivativesItem(e){var t,o,r,i,n,l,a;_classCallCheck(this,ForgeFileDerivativesItem);var s=_possibleConstructorReturn(this,(ForgeFileDerivativesItem.__proto__||Object.getPrototypeOf(ForgeFileDerivativesItem)).call(this));if(n=null!=e&&e.outputType?e.outputType:null!=e&&e.name?e.name:null!=e&&e.role?e.role:"no name",s.add_attr({_name:n,_viewable:!1,_children:[],name:n}),!e)return _possibleConstructorReturn(s);for(r in a={},e)if(e[r],e.hasOwnProperty(r)){if("name"===r)continue;if("children"===r)for(t=0,i=(l=e[r]).length;t<i;t++)o=l[t],s.add_child(new ForgeFileDerivativesItem(o));else a[r]=e[r]}return s.add_attr(a),s}return _inherits(ForgeFileDerivativesItem,Model),t(ForgeFileDerivativesItem,[{key:"display_suppl_context_actions",value:function(e){}},{key:"add_child",value:function(e){this._children.push(e)}},{key:"accept_child",value:function(e){return e instanceof ForgeFileDerivativesItem}}]),ForgeFileDerivativesItem}();o.ForgeFileDerivativesItem=r;var i=function(e){function ForgeFileItem(){var e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:"Forge File";_classCallCheck(this,ForgeFileItem);var t=_possibleConstructorReturn(this,(ForgeFileItem.__proto__||Object.getPrototypeOf(ForgeFileItem)).call(this)),o={_name:e,_viewable:!1,_children:[],name:e,filepath:new Path,state:new Choice(0,["Initial","Uploading","Uploading completed","Uploading to forge","Upload to forge completed","Translating","Translating completed","Export completed","Failed"]),urn:"",ask_token:!1,oauth:"",bucket_key:""};return t.add_attr(o),t}return _inherits(ForgeFileItem,Model),t(ForgeFileItem,[{key:"add_child",value:function(e){this._children.push(e)}},{key:"accept_child",value:function(e){return e instanceof r}}]),ForgeFileItem}();o.ForgeFileItem=i;var n=function(e){function NoteModel(){arguments.length>0&&void 0!==arguments[0]&&arguments[0];_classCallCheck(this,NoteModel);var e=_possibleConstructorReturn(this,(NoteModel.__proto__||Object.getPrototypeOf(NoteModel)).call(this));return e.add_attr({id:"",title:"",color:"",username:"",date:Date.now(),allObject:[]}),e}return _inherits(NoteModel,Model),NoteModel}();o.NoteModel=n,e._createClass=t,e._classCallCheck=_classCallCheck,e._possibleConstructorReturn=_possibleConstructorReturn,e._inherits=_inherits,e._exports=o,e.ForgeFileDerivativesItem=r,e.ForgeFileItem=i,e.NoteModel=n}).call(window,window);

},{}]},{},[1])
//# sourceMappingURL=browser.forgefile.js.map
