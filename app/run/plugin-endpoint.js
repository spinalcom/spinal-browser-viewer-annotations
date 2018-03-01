import {
  endPoint
} from "spinal-lib-forgefile/endPoint";

angular.module('app.spinalforge.plugin').run(["spinalModelDictionary", "$mdDialog", "$mdToast", "authService", "$rootScope", "$compile", "$routeParams", "ngSpinalCore",
  function (spinalModelDictionary, $mdDialog, $mdToast, authService, $rootScope, $compile, $routeParams, ngSpinalCore) {

    class PannelendPoint {
      constructor(viewer, options) {
        Autodesk.Viewing.Extension.call(this, viewer, options);

        viewer.registerContextMenuCallback('rightClickMenu', (menu, status) => {
          menu.push({
            title: 'See Annotation',
            target: () => {
              var items = this.viewer.getSelection();

              if (items.length == 1) {
                document.getElementById("search").value = items[0];
                var list = document.getElementById("allList");

                this.getContainer(items[0], (data) => {
                  this.changeContainer(list, data);
                });
              } else
                alert("you must select 1 item");
            }
          })
        });

        this.viewer = viewer;
        this.panel = null;
        this.user = authService.get_user();

        //message panel
        this.detailPanelContent = null;
        this.detailPanel = null;

        //files panel
        this.filePanel = null;
        this.filePanelContent = null;

        this._selected = null; //item affiché dans le panel message
        this._sel = null; // item selected
        this._file_selected = null; //item affiché dans le panel fichiers


        $rootScope.execute_func_endpoint = (name, id, other = null) => {

          switch (name) {
            case "addItem":
              this.AddItems(id)
              break;

            case "changeColor":
              this.changeColorInHub(id);
              break;

            case "view":
              this.setview(id);
              break;

            case "rename":
              this.renameEndPoint(id);
              break;

            case "delete":
              this.deleteEndPointItem(id, other);
              break;

            case "info":
              this.DetailPanel(id);
              break;
            case "selectItem":
              this.selectEndPoint(id);
              break;
            case "file":
              this.DisplayFilePanel(id);
              break;
            case "download":
              this.DownloadFile(id);
              break;
            case "delete_file":
              this.RemoveFile(id);
              break;

          }
        }

      }


      load() {
        if (this.viewer.toolbar) {
          this.createUI();
        } else {
          this.onToolbarCreatedBinded = this.onToolbarCreated.bind(this);
          this.viewer.addEventListener(av.TOOLBAR_CREATED_EVENT, this.onToolbarCreatedBinded);
        }
        return true;
      }

      onToolbarCreated() {
        this.viewer.removeEventListener(av.TOOLBAR_CREATED_EVENT, this.onToolbarCreatedBinded);
        this.onToolbarCreatedBinded = null;
        this.createUI();
      }

      unload() {
        this.viewer.toolbar.removeControl(this.subToolbar);
        return true;
      }

      createUI() {
        var title = 'Endpoint';
        this.panel = new PanelClass(this.viewer, title);

        this.initialize();

        var button1 = new Autodesk.Viewing.UI.Button('Endpoint');

        button1.onClick = (e) => {
          if (!this.panel.isVisible()) {
            this.panel.setVisible(true);
          } else {
            this.panel.setVisible(false);
          }
        };

        button1.addClass('fa');
        button1.addClass('fa-book');
        button1.addClass('fa-2x');
        button1.setToolTip('Endpoint');

        this.subToolbar = new Autodesk.Viewing.UI.ControlGroup('my-Endpoint');
        this.subToolbar.addControl(button1);
        this.viewer.toolbar.addControl(this.subToolbar);
      }

      initialize() {


        // this.panel.initializeMoveHandlers(this.panel.container);

        var _container = this.panel.createScrollContainer();
        this.panel.container.appendChild(_container);
        var func_success = (data) => {

          var container = _container;
          var allEndPoints = data;
          container.className += " panelViewer";


          var div = document.createElement('div');
          div.className = "_container";



          var con_header = document.createElement('div');
          con_header.className = "header";


          ////////////////////////////////////////////////
          //             Button Add EndPoint                //
          ////////////////////////////////////////////////
          var headerDiv = document.createElement('div');
          headerDiv.className = "spin row head";

          //create endpoint button
          var cDiv = document.createElement('div');
          cDiv.className = "col-sm-3 col-md-3 col-xs-3";

          var createEndPoint = document.createElement('button');
          createEndPoint.className = "btn btn-primary btn-sm btn-block";
          createEndPoint.innerHTML = '<i class="fa fa-pencil-square-o" aria-hidden="true"></i> End point';

          createEndPoint.onclick = () => {
            var confirm = $mdDialog.prompt()
              .title('New End point')
              .placeholder('Please enter the title')
              .ariaLabel('New End point')
              .clickOutsideToClose(true)
              .required(true)
              .ok('Create!')
              .cancel('Cancel');
            $mdDialog.show(confirm).then((result) => {
              this.AddEndPoint(result);
            }, function () {});
          };

          //color all
          var vDiv = document.createElement('div');
          vDiv.className = "col-sm-3 col-md-3 col-xs-3"
          var viewButton = document.createElement('button');
          viewButton.className = "btn btn-primary btn-sm btn-block";
          viewButton.innerHTML = '<i class="fa fa-eye" aria-hidden="true"></i> View';

          viewButton.onclick = () => {
            this.changeEndPointsColor();
            this.changeAllIcon("fa-eye-slash", "true");
          };

          //hide all
          var hDiv = document.createElement('div');
          hDiv.className = "col-sm-3 col-md-3 col-xs-3";
          var hideButton = document.createElement('button');
          hideButton.className = "btn btn-primary btn-sm btn-block";
          hideButton.innerHTML = '<i class="fa fa-eye-slash" aria-hidden="true"></i> Hide';

          //--------------------------------------------------------------------------------------------
          hideButton.onclick = () => {
            this.restoreEndPointsColor();
            this.changeAllIcon("fa-eye", "false");
          };

          //export all
          var eDiv = document.createElement('div');
          eDiv.className = "col-sm-3 col-md-3 col-xs-3";
          var exportButton = document.createElement('button');
          exportButton.className = "btn btn-primary btn-sm btn-block";
          exportButton.innerHTML = '<i class="fa fa-eye-slash" aria-hidden="true"></i> export';

          exportButton.onclick = () => {
            let path = $routeParams.filepath;
            path = atob(path);
            console.log(path);
            var res = path.split("/");
            console.log(res);
            var res2 = '';
            let i;
            for (i = 1; i < res.length - 1; i++) {
              res2 = res2 + '/' + res[i];
            }
            res2 += '/' + 'endPoints';
            ngSpinalCore.store(this.model, res2).then((m) => {
              console.log(res2);
            })
          }

          //--------------------------------------------------------------------------------------------

          ///////////////////////////////////////////////
          //            Card List                      //
          ///////////////////////////////////////////////
          var list = document.createElement('div');
          list.className = "list-group allList";
          list.id = "allList";



          var items = document.createElement('div');
          items.className = "list-group endPoints";

          ///////////////////////////////////////////////
          //             Search Input                  //
          ///////////////////////////////////////////////
          var searchDiv = document.createElement('div');
          searchDiv.className = "spin input-group";

          var searchIcon = document.createElement('span');
          searchIcon.className = "icon input-group-addon";
          searchIcon.innerHTML = '<i class="fa fa-search" aria-hidden="true"></i>';

          var search = document.createElement('input');
          search.className = "input form-control toolbar-search-box";
          search.type = "number";
          search.id = "search";
          search.placeholder = "item id";

          search.onclick = function () {
            search.focus();
          };

          search.oninput = () => {
            if (search.value != "") {
              this.getContainer(parseInt(search.value), (data) => {
                this.changeContainer(list, data);
              });
            } else {
              this.changeContainer(list, allEndPoints);
            }
          };

          //button header
          cDiv.appendChild(createEndPoint);
          vDiv.appendChild(viewButton);
          hDiv.appendChild(hideButton);
          eDiv.appendChild(exportButton);

          headerDiv.appendChild(cDiv);
          headerDiv.appendChild(vDiv);
          headerDiv.appendChild(hDiv);
          headerDiv.appendChild(eDiv);

          con_header.appendChild(headerDiv);

          //search
          searchDiv.appendChild(searchIcon);
          searchDiv.appendChild(search);
          con_header.appendChild(searchDiv);




          div.appendChild(con_header);
          div.appendChild(list);
          div.appendChild(items);


          //list
          container.appendChild(div);

          ///////////////////////////////////////////////
          //          When endpoints change                //
          ///////////////////////////////////////////////
          allEndPoints.bind(() => {
            this.changeContainer(list, allEndPoints);
            this.viewOrHide();
          });
        };
        this.my_start = this.start.bind(this, func_success);
        this.viewer.addEventListener(av.GEOMETRY_LOADED_EVENT, this.my_start);


      }

      start(func_success) {
        this.viewer.removeEventListener(av.GEOMETRY_LOADED_EVENT, this.my_start);

        spinalModelDictionary.init().then((m) => {
          if (m) {
            if (m.endPointPlugin) {
              m.endPointPlugin.load((mod) => {
                this.model = mod;
                func_success(this.model);
              });
            } else {
              this.model = new Lst();
              m.add_attr({
                endPointPlugin: new Ptr(this.model)
              });

              func_success(this.model);
            }

          }

        });
      }

      AddEndPoint(title, color = "#000000") {
        var endpoints = this.model;
        console.log(endpoints);
        var id = newGUID();

        var newEndPoint = new endPoint();
        newEndPoint.title.set(title);
        newEndPoint.color.set(color);
        newEndPoint.id.set(id);
        newEndPoint.date.set(Date.now());

        console.log(newEndPoint);
        var otherEndPoints = endpoints;
        otherEndPoints.push(newEndPoint);
        endpoints.mod_attr(otherEndPoints);
      }

      AddItems(id) {
        var endpointSelected, indexEndPoint;
        var items = this.viewer.getSelection();
        var endpoints = this.model;


        if (items.length == 0) {
          alert('No model selected !');
          return;
        }

        this.viewer.model.getBulkProperties(items, {
          propFilter: ['name']
        }, (models) => {

          for (var i = 0; i < endpoints.length; i++) {
            if (endpoints[i].id == id) {
              endpointSelected = endpoints[i].allObject;
              indexEndPoint = i;
              break;
            }
          }
          console.log(endpointSelected);
          for (var j = 0; j < models.length; j++) {
            endpointSelected.push(models[j]);
          }
          endpoints[indexEndPoint].allObject = endpointSelected;

          var toast = $mdToast.simple()
            .content("Item added !")
            .action('OK')
            .highlightAction(true)
            .hideDelay(0)
            .position('bottom right')
            .parent("body");

          $mdToast.show(toast);
        }, function () {
          console.log("error");
        });


      }

      getContainer(id, callback) {
        var endpoints = this.model;

        var containers = endpoints.filter((element) => {

          return element.allObject.filter(
            (e) => {
              return e.dbId.get() == id;
            }
          ).length > 0;
        });
        callback(containers);
      }

      changeColorInHub(id, color) {

        var endpointSelected, indexEndPoint;
        var endpoints = this.model;

        for (var i = 0; i < endpoints.length; i++) {
          if (endpoints[i].id == id) {
            endpoints[i].color.set(color);
          }
        }
      }

      changeItemColor(id) {
        var ids = [];
        var selected;
        var endpoints = this.model;
        for (var i = 0; i < endpoints.length; i++) {
          if (endpoints[i].id == id) {
            selected = endpoints[i];
            for (var j = 0; j < selected.allObject.length; j++) {

              ids.push(selected.allObject[j].dbId.get());
            }
          }
        }
        this.viewer.setColorMaterial(ids, selected.color.get(), selected.id.get());
      }

      restoreColor(id) {
        var ids = [];
        var selected;
        var endpoints = this.model;
        for (var i = 0; i < endpoints.length; i++) {
          if (endpoints[i].id == id) {
            selected = endpoints[i];
            for (var j = 0; j < selected.allObject.length; j++) {
              ids.push(selected.allObject[j].dbId.get());
            }
          }
        }
        this.viewer.restoreColorMaterial(ids, id);
      }

      changeEndPointsColor() {
        var objects = [];
        var endpoints = this.model;
        for (var i = 0; i < endpoints.length; i++) {
          var ids = [];
          var color;
          for (var j = 0; j < endpoints[i].allObject.length; j++) {
            ids.push(endpoints[i].allObject[j].dbId.get());
          }
          color = endpoints[i].color.get();
          objects.push({
            ids: ids,
            color: color,
            id: endpoints[i].id
          });
        }
        this.viewer.colorAllMaterials(objects);
      }

      restoreEndPointsColor() {
        var objects = [];
        var endpoints = this.model;
        for (var i = 0; i < endpoints.length; i++) {
          var ids = [];

          for (var j = 0; j < endpoints[i].allObject.length; j++) {
            ids.push(endpoints[i].allObject[j].dbId.get());
          }
          objects.push({
            ids: ids,
            id: endpoints[i].id
          });
        }
        this.viewer.restoreAllMaterialColor(objects);
      }

      deleteEndPointItem(endpoint, item = null) {

        var endpoints = this.model;

        var dialog = $mdDialog.confirm()
          .ok("Delete !")
          .title('Do you want to remove it?')
          .cancel('Cancel')
          .clickOutsideToClose(true);

        $mdDialog.show(dialog)
          .then((result) => {

            if (item != null) {
              for (let i = 0; i < endpoints.length; i++) {
                if (endpoints[i].id == endpoint) {
                  for (var j = 0; j < endpoints[i].allObject.length; j++) {
                    if (endpoints[i].allObject[j].dbId == item) {
                      endpoints[i].allObject.splice(j, 1);
                      break;
                    }
                  }
                }

              }
            } else {
              for (let i = 0; i < endpoints.length; i++) {
                if (endpoints[i].id == endpoint) {
                  endpoints.splice(i, 1);
                  break;
                }
              }
            }

          }, function () {});

      }

      changeAllIcon(iconName, show) {
        var endpoints = this.model;

        for (var i = 0; i < endpoints.length; i++) {
          var element = document.getElementsByClassName("show" + endpoints[i].id)[0];
          element.innerHTML = `<i class="fa ${iconName}" aria-hidden="true"></i>`;
          element.setAttribute("show", show);
        }
      }

      renameEndPoint(id) {
        var endpoints = this.model;

        var confirm = $mdDialog.prompt()
          .title('Rename EndPoint')
          .placeholder('Please enter the title')
          .ariaLabel('Rename')
          .clickOutsideToClose(true)
          .required(true)
          .ok('Rename')
          .cancel('Cancel');
        $mdDialog.show(confirm).then((result) => {
          for (let i = 0; i < endpoints.length; i++) {
            if (endpoints[i].id == id) {
              endpoints[i].title.set(result);
              break;
            }
          }
        }, function () {});
      }


      selectEndPoint(id) {
        var endpoints = this.model;
        this._sel = id;

        var div = document.getElementsByClassName("endPoints")[0];
        div.innerHTML = "";

        var contener = angular.element(div);

        var header = angular.element('<div></div>')
        var content = angular.element('<md-list>\
      </md-list>');

        contener.append(header);
        contener.append(content);


        if (id != null) {
          for (let i = 0; i < endpoints.length; i++) {
            if (endpoints[i].id == id) {
              var selected = angular.element(`<h3>EndPoint Selected : ${endpoints[i].title.get()}</h3>`);
              header.append(selected);

              if (endpoints[i].allObject.length > 0) {
                for (let j = 0; j < endpoints[i].allObject.length; j++) {
                  var _ob = `
                  <md-list-item>
                    <p>${endpoints[i].allObject[j].name.get()}</p>
        
                    <md-button class="i_btn" aria-label="delete_item" ng-click="execute_func_endpoint('delete','${endpoints[i].id.get()}','${endpoints[i].allObject[j].dbId}')">
                      <i class="fa fa-trash" aria-hidden="true"></i>
                    </md-button>
                  </md-list-item>
                `
                  content.append(_ob);
                }
              } else {
                content.append('<h5>No item inside</h5>');
              }
            }
          }
        } else {
          content.append('<h5>No item selected</h5>');
        }

        $compile(header)($rootScope);
        $compile(content)($rootScope);

      }


      createitem(parent, endpoint, i) {

        var div = `<md-list-item>
          <p class="endpointTitle" ng-click="execute_func_endpoint('selectItem','${endpoint.id.get()}')">${endpoint.title.get()}</p>

          <md-button class="i_btn" aria-label="add_item" id=${endpoint.id.get()} ng-click="execute_func_endpoint('addItem','${endpoint.id.get()}')">
            <i class="fa fa-plus" aria-hidden="true"></i>
          </md-button>

          <!-- <input class="i_btn input_color" value="${endpoint.color.get()}" id="i_color" type='color' name='${endpoint.id.get()}' ng-change="execute_func_endpoint('changeColor','${endpoint.id.get()}')" ng-model="color${i}"/> -->
          <input class="i_btn input_color" value="${endpoint.color.get()}" id="i_color" type='color' name='${endpoint.id.get()}'/>

          <md-button class="i_btn show${endpoint.id.get()}" id=${endpoint.id.get()} aria-label="view" ng-click="execute_func_endpoint('view','${endpoint.id.get()}')" show="false">
            <i class="fa fa-eye" aria-hidden="true"></i>
          </md-button>

          <md-button class="i_btn" id=${endpoint.id.get()} aria-label="rename" ng-click="execute_func_endpoint('rename','${endpoint.id.get()}')">
            <i class="fa fa-pencil" aria-hidden="true"></i>
          </md-button>

          <md-button class="i_btn" id=${endpoint.id.get()} aria-label="delete" ng-click="execute_func_endpoint('delete','${endpoint.id.get()}')">
            <i class="fa fa-trash" aria-hidden="true"></i>
          </md-button>

          <md-button class="i_btn" id=${endpoint.id.get()} aria-label="info" ng-click="execute_func_endpoint('info','${endpoint.id.get()}')">
            <i class="fa fa-comment" aria-hidden="true"></i>
          </md-button>

          <md-button class="i_btn" id=${endpoint.id.get()} aria-label="info" ng-click="execute_func_endpoint('file','${endpoint.id.get()}')">
            <i class="fa fa-bar-chart" aria-hidden="true"></i>
          </md-button>

        </md-list-item>`;

        var contener = angular.element(div);

        parent.append(contener);
        $compile(contener)($rootScope);
      }


      viewOrHide() {
        var endpoints = this.model;
        var tab_true = [];
        var tab_false = [];
        var i = 0;
        var j = 0;

        console.log(endpoints);
        for (var j = 0; j < endpoints.length; j++) {
          if (endpoints[j].display.get() == true)
            tab_true.push(endpoints[j]);
          else
            tab_false.push(endpoints[j]);
        }
        for (j = 0; j < tab_true.length; j++) {
          this.changeItemColor(tab_true[j].id.get());
        }
        for (i = 0; i < tab_false.length; i++) {
          this.restoreColor(tab_false[i].id.get());
        }

      }

      // viewOrHide(id) {

      //   var element = document.getElementsByClassName("show" + id)[0];
      //   var show = element.getAttribute("show");
      //   console.log(element);
      //   if (show == "false") {
      //     element.setAttribute("show", "true");
      //     this.changeItemColor(id);
      //     element.innerHTML = '<i class="fa fa-eye-slash" aria-hidden="true"></i>';
      //   } else {
      //     this.restoreColor(id);
      //     element.setAttribute("show", "false");
      //     element.innerHTML = '<i class="fa fa-eye" aria-hidden="true"></i>';
      //   }

      // }

      //////////////////////////////////////////////////////////////
      //                  Change container                        //
      //////////////////////////////////////////////////////////////
      changeContainer(list, allEndPoints) {
        list.innerHTML = "";

        var _self = this;
        var contener = angular.element(list);

        var div = angular.element('<md-list>\
      </md-list>');


        contener.append(div);
        $compile(div)($rootScope);

        if (allEndPoints.length > 0) {
          for (let index = 0; index < allEndPoints.length; index++) {
            const element = allEndPoints[index];
            this.createitem(div, element, index);
          }
        } else {
          div.append('<h1>No endpoint created ! create one</h1>');
        }

        this.selectEndPoint(this._sel);
        var _self = this;

        var colors = document.getElementsByClassName("input_color");

        for (let j = 0; j < colors.length; j++) {
          colors[j].onchange = function () {
            _self.changeColorInHub(this.name, this.value);
          }

        }

      }

      DetailPanel(id) {
        var endpoints = this.model;


        if (this.detailPanelContent == null) {
          this.detailPanelContent = document.createElement('div');
          this.detailPanelContent.className = "content";
        }

        if (this.detailPanel == null) {
          this.detailPanel = new PanelClass(this.viewer, id);
          this.detailPanel.initializeMoveHandlers(this.detailPanel.container);
          this.detailPanel.container.appendChild(this.detailPanel.createCloseButton());
          this.detailPanel.container.style.right = "0px";
          this.detailPanel.container.style.width = "400px";
          this.detailPanel.container.style.height = "600px";
          this.detailPanel.container.padding = "0px";

        }

        for (let index = 0; index < endpoints.length; index++) {
          if (endpoints[index].id == id) {
            this._selected = endpoints[index];
            break;
          }
        }

        var formDiv = document.createElement('div');
        formDiv.className = "form_div";


        var textareaDiv = document.createElement('div');
        textareaDiv.className = "textarea_div";

        var inputText = document.createElement('textarea');
        inputText.className = "form-control";
        inputText.setAttribute('rows', '2')
        inputText.id = id;
        inputText.placeholder = "add texte";

        inputText.onclick = () => {
          inputText.focus();
        }

        textareaDiv.appendChild(inputText);

        var sendButtonDiv = document.createElement('div');
        sendButtonDiv.className = "send_button_div"

        var sendButton = document.createElement('button');
        sendButton.className = "btn btn-block";
        sendButton.textContent = "Add";
        sendButton.id = id;

        sendButton.onclick = () => {
          var textAreaValue = document.querySelector(`textarea[id='${sendButton.id}']`).value;
          document.querySelector(`textarea[id='${sendButton.id}']`).value = "";

          if (textAreaValue != "" && textAreaValue.trim() != "") {
            var message = new MessageModel();
            message.id.set(newGUID());
            message.owner.set(this.user.id);
            message.username.set(this.user.username);
            message.date.set(Date.now());
            message.message.set(textAreaValue);

            this._selected.endpoints.push(message);
          }

        }

        sendButtonDiv.appendChild(sendButton);

        formDiv.appendChild(textareaDiv);
        formDiv.appendChild(sendButtonDiv);

        this.detailPanel.setVisible(true);

        endpoints.bind(() => {
          this.DisplayMessage(formDiv)
        });


      }

      DisplayMessage(formDiv) {
        var _self = this;
        var messageContainer = document.createElement('div');
        messageContainer.className = "messageContainer";

        for (let i = 0; i < this._selected.endpoints.length; i++) {
          //message div
          var message_div = document.createElement('div');
          message_div.className = "message_div";

          //header message
          var _message = document.createElement('div');
          _message.className = "_message";

          //name
          var message_owner = document.createElement('div');
          message_owner.className = "message_owner";
          message_owner.innerText = this._selected.endpoints[i].username.get();


          //date
          var message_date = document.createElement('div');
          message_date.className = "message_date";
          var date = new Date(parseInt(this._selected.endpoints[i].date));
          message_date.innerText = date.getDate() + "/" + date.getMonth() + 1 + "/" + date.getFullYear();



          //message content
          var message_content = document.createElement('div');
          message_content.className = "message_content";

          var message_texte = document.createElement('div');
          message_texte.className = "message_texte";
          message_texte.innerHTML = this._selected.endpoints[i].message;

          if (this._selected.endpoints[i].owner == this.user.id) {
            var closeDiv = document.createElement('div');
            closeDiv.className = "close_div";

            var span = document.createElement('span');
            span.innerHTML = "X";
            span.className = "close";
            span.id = this._selected.endpoints[i].id

            span.onclick = function () {
              var dialog = $mdDialog.confirm()
                .ok("Delete !")
                .title('Do you want to remove it?')
                .cancel('Cancel')
                .clickOutsideToClose(true);

              $mdDialog.show(dialog)
                .then((result) => {
                  _self.deteteMessage(this.id, formDiv);
                }, function () {});

            }

            closeDiv.appendChild(span);
            message_content.appendChild(closeDiv);
          }

          message_content.appendChild(message_texte);

          _message.appendChild(message_owner);
          _message.appendChild(message_content);



          message_div.appendChild(message_date);
          message_div.appendChild(_message);


          messageContainer.appendChild(message_div);

        }


        this.detailPanelContent.innerHTML = "";

        this.detailPanelContent.appendChild(messageContainer);
        this.detailPanelContent.appendChild(formDiv);

        this.detailPanel.setTitle(this._selected.title.get());
        this.detailPanel.container.appendChild(this.detailPanelContent);

        var d = document.getElementsByClassName("messageContainer")[0];
        d.scrollTop = d.scrollHeight;

      }

      setview(id) {
        var endpoints = this.model;
        console.log(endpoints);
        for (var i = 0; i < endpoints.length; i++) {
          if (endpoints[i].id.get() == id) {
            console.log(endpoints[i].display.get());
            if (endpoints[i].display.get() == false) {
              endpoints[i].display.set(true);
            } else {
              endpoints[i].display.set(false);
            }
            console.log(endpoints[i].display.get());
          }
        }
      }

      deteteMessage(id, formDiv) {

        for (let i = 0; i < this._selected.endpoints.length; i++) {

          if (this._selected.endpoints[i].id == id) {
            this._selected.endpoints.splice(i, 1);
            // this.DisplayMessage(formDiv);
            break;
          }

        }


      }

      /////////////////////////////////////////////// Files ///////////////////////

      DownloadFile(id) {
        var selected;
        for (let i = 0; i < this._file_selected.files.length; i++) {
          selected = this._file_selected.files[i];
          if (selected._info.id == id) {
            selected.load((model, error) => {
              if (model instanceof Path) {
                // window.open("/sceen/_?u=" + model._server_id, "Download");
                var element = document.createElement('a');
                element.setAttribute('href', "/sceen/_?u=" + model._server_id);
                element.setAttribute('download', selected.name);

                element.style.display = 'none';
                document.body.appendChild(element);

                element.click();

                document.body.removeChild(element);
              }
            });
            break;
          }
        }
      }

      RemoveFile(id) {
        var dialog = $mdDialog.confirm()
          .ok("Delete !")
          .title('Do you want to remove it?')
          .cancel('Cancel')
          .clickOutsideToClose(true);

        $mdDialog.show(dialog)
          .then((result) => {
            for (let i = 0; i < this._file_selected.files.length; i++) {
              if (this._file_selected.files[i]._info.id == id) {
                this._file_selected.files.splice(i, 1);
                break;
              }

            }
          }, function () {});
      }

      handle_files(files) {
        var file, filePath, mod_file;

        if (files.length > 0) {
          for (let i = 0; i < files.length; i++) {
            filePath = new Path(files[i]);

            this._file_selected.files.force_add_file(files[i].name, filePath, {
              id: newGUID()
            })

          }
        }
      }

      onEndpointChange(timeseries, chartEndpoint) {
        console.log("debug");
        console.log(this.current_timeseries);
        console.log(timeseries);
        console.log(chartEndpoint);
        // this.filePanelContent
        if (!this.data)
          this.data = {
            datasets: [{
              label: '',
              data: [],
              fill: false,
              backgroundColor: '#FFFFFF',
              borderColor: '#FFFFFF'
            }]
          };
        this.data.datasets[0].data = this.dataset = [];
        this.data.datasets[0].label = chartEndpoint.title.get();


        for (let i = 0; i < timeseries.value.length; i++) {
          this.dataset.push({
            y: timeseries.value[i].get(),
            x: timeseries.time[i].get()
          });
        }
        // console.log(data);
        if (this.myLineChart)
          this.myLineChart.update();
        else {
          this.myLineChart = new Chart(this.canvas, {
            type: 'line',
            data: this.data,
            options: {
              //responsive: false,
              scales: {
                yAxes: [{
                  display: true
                }],
                xAxes: [{
                  gridLines: {},
                  type: 'time'
                }]
              }
            }
          });
        }

        console.log(this.data)
      }

      DisplayFilePanel(id) {
        var endpoints = this.model;

        if (this.endpointBinded === true) {
          this.current_timeseries.unbind(this.current_timeseriesBindedFunc);
          this.endpointBinded = false;
        }

        if (this.filePanel == null) {
          this.filePanel = new PanelClass(this.viewer, 'chart');
          this.filePanel.initializeMoveHandlers(this.filePanel.container);
          this.filePanel.container.appendChild(this.filePanel.createCloseButton());
          this.filePanel.container.style.right = "0px";
          this.filePanel.container.style.width = "400px";
          this.filePanel.container.style.height = "300px";
          this.filePanel.container.padding = "0px";
          // }

          // if(this.filePanelContent == null) {
          this.filePanelContent = document.createElement('div');
          this.filePanel.container.appendChild(this.filePanelContent);

          this.filePanelContent.className = "file_panel_content";
          this.canvas = document.createElement('canvas');
          this.canvas.id = "my_chartEndPoint";
          this.canvas.style.width = 400;
          this.canvas.style.height = 300;
          this.filePanelContent.appendChild(this.canvas);
          var clear_chart = document.createElement('button');
          clear_chart.className = "btn btn-primary btn-sm btn-block";
          clear_chart.innerHTML = '<i class="fa fa-pencil-square-o" aria-hidden="true"></i> Clear';

          clear_chart.onclick = () => {
            var confirm = $mdDialog.confirm()
              .title('Confirm clear')
              .ariaLabel('confirm clear chart')
              .clickOutsideToClose(true)
              .ok('Clear!')
              .cancel('Cancel');
            $mdDialog.show(confirm).then((result) => {
              // this.AddEndPoint(result);
              this.current_timeseries.value.clear();
              this.current_timeseries.time.clear();
            }, function () {});
          };
          // clear_chart.style.width = 100;
          // clear_chart.style.height = 30;
          this.filePanelContent.appendChild(clear_chart);
        }
        var chartEndpoint;
        console.log(endpoints);
        for (let i = 0; i < endpoints.length; i++) {
          if (endpoints[i].id.get() === id) {
            chartEndpoint = endpoints[i];
            break;
          }
        }
        chartEndpoint.TimeSerie.load((mod) => {
          if (!mod)
            return;
          else {
            console.log(mod);
            //console.log(mod.get());
            this.current_timeseries = mod;
            this.endpointBinded = true;
            console.log(this.current_timeseries);
            this.current_timeseriesBindedFunc = this.onEndpointChange.bind(this, this.current_timeseries, chartEndpoint);
            this.current_timeseries.bind(this.current_timeseriesBindedFunc);
          }

        });


        this.filePanel.setVisible(true);


        // for (let index = 0; index < endpoints.length; index++) {
        //   if (endpoints[index].id == id) {
        //     this._file_selected = endpoints[index];
        //     break;
        //   }
        // }

        this.filePanel.setTitle('charts');

        // endpoints.bind(() => {
        //   this.files_display();
        // })

      }

      displayItem(_file, parent) {
        var items = `<md-list-item>
                  <p class="endpointTitle">${_file.name.get()}</p>

                  <md-button class="i_btn" aria-label="add_item" id=${_file._info.id.get()} ng-click="execute_func_endpoint('delete_file','${_file._info.id.get()}')">
                    <i class="fa fa-trash" aria-hidden="true"></i>
                  </md-button>

                  <md-button class="i_btn" aria-label="add_item" id=${_file._info.id.get()} ng-click="execute_func_endpoint('download','${_file._info.id.get()}')">
                    <i class="fa fa-download" aria-hidden="true"></i>
                  </md-button>
                </md-list-item>`;

        var content = angular.element(items);

        parent.append(content);
        $compile(content)($rootScope);
      }

      files_display() {

        var files = document.getElementsByClassName("files_div")[0];
        files.innerHTML = "";

        var contener = angular.element(files);

        var div = angular.element('<md-list>\
        </md-list>');


        contener.append(div);
        $compile(div)($rootScope);

        var _file;

        for (let i = 0; i < this._file_selected.files.length; i++) {
          _file = this._file_selected.files[i];
          this.displayItem(_file, div);
        }




      }

    } // end class
    Autodesk.Viewing.theExtensionManager.registerExtension('PannelendPoint', PannelendPoint);
  } // end run
]);