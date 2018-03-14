angular.module('app.spinalforge.plugin').run(["spinalModelDictionary", "$mdDialog", "$mdToast", "authService", "$rootScope", "$compile",
  function (spinalModelDictionary, $mdDialog, $mdToast, authService, $rootScope, $compile) {

    class PanelAnnotation {
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


        $rootScope.execute_func = (name, id, other = null) => {

          switch (name) {
            case "addItem":
              this.AddItems(id)
              break;

            case "changeColor":
              this.changeColorInHub(id);
              break;

            case "view":
              this.viewOrHide(id);
              break;

            case "rename":
              this.renameNote(id);
              break;

            case "delete":
              this.deleteNoteItem(id, other);
              break;

            case "info":
              this.DetailPanel(id);
              break;
            case "selectItem":
              this.selectNote(id);
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
        var title = 'Annotation';
        this.panel = new PanelClass(this.viewer, title);

        this.initialize();

        var button1 = new Autodesk.Viewing.UI.Button('Annotation');

        button1.onClick = (e) => {
          if (!this.panel.isVisible()) {
            this.panel.setVisible(true);
          } else {
            this.panel.setVisible(false);
          }
        };

        button1.addClass('fa');
        button1.addClass('fa-pencil');
        button1.addClass('fa-2x');
        button1.setToolTip('Annotation');

        this.subToolbar = new Autodesk.Viewing.UI.ControlGroup('my-Annotation');
        this.subToolbar.addControl(button1);
        this.viewer.toolbar.addControl(this.subToolbar);
      }

      initialize() {


        this.panel.initializeMoveHandlers(this.panel.container);
        this.panel.container.appendChild(this.panel.createScrollContainer());
        var _container = this.panel.container;

        var func_success = (data) => {

          var container = _container;
          var allNotes = data;
          container.className += " panelViewer";


          var div = document.createElement('div');
          div.className = "_container";



          var con_header = document.createElement('div');
          con_header.className = "header";


          ////////////////////////////////////////////////
          //             Button Add Note                //
          ////////////////////////////////////////////////
          var headerDiv = document.createElement('div');
          headerDiv.className = "spin row head";

          //create note button
          var cDiv = document.createElement('div');
          cDiv.className = "col-sm-3 col-md-3 col-xs-3";

          var createNote = document.createElement('button');
          createNote.className = "btn btn-primary btn-sm btn-block";
          createNote.innerHTML = '<i class="fa fa-pencil-square-o" aria-hidden="true"></i> Note';

          createNote.onclick = () => {
            var confirm = $mdDialog.prompt()
              .title('New Note')
              .placeholder('Please enter the title')
              .ariaLabel('New Note')
              .clickOutsideToClose(true)
              .required(true)
              .ok('Create!')
              .cancel('Cancel');
            $mdDialog.show(confirm).then((result) => {
              this.AddNote(result);
            }, function () {});
          };

          //color all
          var vDiv = document.createElement('div');
          vDiv.className = "col-sm-3 col-md-3 col-xs-3"
          var viewButton = document.createElement('button');
          viewButton.className = "btn btn-primary btn-sm btn-block";
          viewButton.innerHTML = '<i class="fa fa-eye" aria-hidden="true"></i> View';

          viewButton.onclick = () => {
            this.changeAllItemsColor();
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
            this.restoreAllItemsColor();
            this.changeAllIcon("fa-eye", "false");
          };
          //--------------------------------------------------------------------------------------------

          ///////////////////////////////////////////////
          //            Card List                      //
          ///////////////////////////////////////////////
          var list = document.createElement('div');
          list.className = "list-group allList";
          list.id = "allList";



          var items = document.createElement('div');
          items.className = "list-group allItems";

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
              this.changeContainer(list, allNotes);
            }
          };

          //button header
          cDiv.appendChild(createNote);
          vDiv.appendChild(viewButton);
          hDiv.appendChild(hideButton);

          headerDiv.appendChild(cDiv);
          headerDiv.appendChild(vDiv);
          headerDiv.appendChild(hDiv);

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
          //          When notes change                //
          ///////////////////////////////////////////////
          allNotes.bind(() => {
            this.changeContainer(list, allNotes);
          });
        };

        spinalModelDictionary.init().then((m) => {
          if (m) {
            if (m.annotationPlugin) {
              m.annotationPlugin.load((mod) => {
                this.model = mod;
                func_success(this.model);
              });
            } else {
              this.model = new Lst();
              m.add_attr({
                annotationPlugin: new Ptr(this.model)
              });

              func_success(this.model);
            }

          }

        });
      }

      AddNote(title, color = "#000000") {
        var notes = this.model;
        var id = newGUID();

        var newNote = new NoteModel();
        newNote.title.set(title);
        newNote.color.set(color);
        newNote.id.set(id);
        newNote.date.set(Date.now());
        newNote.owner.set(this.user.id);
        newNote.username.set(this.user.username);

        var otherNotes = notes;
        otherNotes.push(newNote);
        notes.mod_attr(otherNotes);
      }

      AddItems(id) {
        var noteSelected, indexNote;
        var items = this.viewer.getSelection();
        var notes = this.model;


        if (items.length == 0) {
          alert('No model selected !');
          return;
        }

        this.viewer.model.getBulkProperties(items, {
          propFilter: ['name']
        }, (models) => {

          for (var i = 0; i < notes.length; i++) {
            if (notes[i].id == id) {
              noteSelected = notes[i].allObject;
              indexNote = i;
              break;
            }
          }

          for (var j = 0; j < models.length; j++) {
            noteSelected.push(models[j]);
          }
          notes[indexNote].allObject = noteSelected;

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
        var notes = this.model;

        var containers = notes.filter((element) => {

          return element.allObject.filter(
            (e) => {
              return e.dbId.get() == id;
            }
          ).length > 0;
        });
        callback(containers);
      }

      changeColorInHub(id, color) {

        var noteSelected, indexNote;
        var notes = this.model;

        for (var i = 0; i < notes.length; i++) {
          if (notes[i].id == id) {
            notes[i].color.set(color);
          }
        }
      }

      changeItemColor(id) {
        var ids = [];
        var selected;
        var notes = this.model;
        for (var i = 0; i < notes.length; i++) {
          if (notes[i].id == id) {
            selected = notes[i];
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
        var notes = this.model;
        for (var i = 0; i < notes.length; i++) {
          if (notes[i].id == id) {
            selected = notes[i];
            for (var j = 0; j < selected.allObject.length; j++) {
              ids.push(selected.allObject[j].dbId.get());
            }
          }
        }
        this.viewer.restoreColorMaterial(ids, id);
      }

      changeAllItemsColor() {
        var objects = [];
        var notes = this.model;
        for (var i = 0; i < notes.length; i++) {
          var ids = [];
          var color;
          for (var j = 0; j < notes[i].allObject.length; j++) {
            ids.push(notes[i].allObject[j].dbId.get());
          }
          color = notes[i].color.get();
          objects.push({
            ids: ids,
            color: color,
            id: notes[i].id
          });
        }
        this.viewer.colorAllMaterials(objects);
      }

      restoreAllItemsColor() {
        var objects = [];
        var notes = this.model;
        for (var i = 0; i < notes.length; i++) {
          var ids = [];

          for (var j = 0; j < notes[i].allObject.length; j++) {
            ids.push(notes[i].allObject[j].dbId.get());
          }
          objects.push({
            ids: ids,
            id: notes[i].id
          });
        }
        this.viewer.restoreAllMaterialColor(objects);
      }

      deleteNoteItem(note, item = null) {

        var notes = this.model;


        var dialog = $mdDialog.confirm()
          .ok("Delete !")
          .title('Do you want to remove it?')
          .cancel('Cancel')
          .clickOutsideToClose(true);

        $mdDialog.show(dialog)
          .then((result) => {

            if (item != null) {
              for (let i = 0; i < notes.length; i++) {
                if (notes[i].id == note) {
                  for (var j = 0; j < notes[i].allObject.length; j++) {
                    if (notes[i].allObject[j].dbId == item) {
                      notes[i].allObject.splice(j, 1);
                      break;
                    }
                  }
                }

              }
            } else {
              for (let i = 0; i < notes.length; i++) {
                if (notes[i].id == note) {
                  notes.splice(i, 1);
                  break;
                }
              }
            }

          }, function () {});

      }

      changeAllIcon(iconName, show) {
        var notes = this.model;

        for (var i = 0; i < notes.length; i++) {
          var element = document.getElementsByClassName("show" + notes[i].id)[0];
          element.innerHTML = `<i class="fa ${iconName}" aria-hidden="true"></i>`;
          element.setAttribute("show", show);
        }
      }

      renameNote(id) {
        var notes = this.model;

        var confirm = $mdDialog.prompt()
          .title('Rename Note')
          .placeholder('Please enter the title')
          .ariaLabel('Rename')
          .clickOutsideToClose(true)
          .required(true)
          .ok('Rename')
          .cancel('Cancel');
        $mdDialog.show(confirm).then((result) => {
          for (let i = 0; i < notes.length; i++) {
            if (notes[i].id == id) {
              notes[i].title.set(result);
              break;
            }
          }
        }, function () {});
      }


      selectNote(id) {
        var notes = this.model;
        this._sel = id;

        var div = document.getElementsByClassName("allItems")[0];
        div.innerHTML = "";

        var contener = angular.element(div);

        var header = angular.element('<div></div>')
        var content = angular.element('<md-list>\
      </md-list>');

        contener.append(header);
        contener.append(content);


        if (id != null) {
          for (let i = 0; i < notes.length; i++) {
            if (notes[i].id == id) {
              var selected = angular.element(`<h3>Note Selected : ${notes[i].title.get()}</h3>`);
              header.append(selected);

              if (notes[i].allObject.length > 0) {
                for (let j = 0; j < notes[i].allObject.length; j++) {
                  var _ob = `
                  <md-list-item>
                    <p>${notes[i].allObject[j].name.get()}</p>
        
                    <md-button class="i_btn" aria-label="delete_item" ng-click="execute_func('delete','${notes[i].id.get()}','${notes[i].allObject[j].dbId}')">
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


      createitem(parent, note, i) {

        var div = `<md-list-item>
          <p class="noteTitle" ng-click="execute_func('selectItem','${note.id.get()}')">${note.title.get()}</p>

          <md-button class="i_btn" aria-label="add_item" id=${note.id.get()} ng-click="execute_func('addItem','${note.id.get()}')">
            <i class="fa fa-plus" aria-hidden="true"></i>
          </md-button>

          <!-- <input class="i_btn input_color" value="${note.color.get()}" id="i_color" type='color' name='${note.id.get()}' ng-change="execute_func('changeColor','${note.id.get()}')" ng-model="color${i}"/> -->
          <input class="i_btn input_color" value="${note.color.get()}" id="i_color" type='color' name='${note.id.get()}'/>

          <md-button class="i_btn show${note.id.get()}" id=${note.id.get()} aria-label="view" ng-click="execute_func('view','${note.id.get()}')" show="false">
            <i class="fa fa-eye" aria-hidden="true"></i>
          </md-button>

          <md-button class="i_btn" id=${note.id.get()} aria-label="rename" ng-click="execute_func('rename','${note.id.get()}')">
            <i class="fa fa-pencil" aria-hidden="true"></i>
          </md-button>

          <md-button class="i_btn" id=${note.id.get()} aria-label="delete" ng-click="execute_func('delete','${note.id.get()}')">
            <i class="fa fa-trash" aria-hidden="true"></i>
          </md-button>

          <md-button class="i_btn" id=${note.id.get()} aria-label="info" ng-click="execute_func('info','${note.id.get()}')">
            <i class="fa fa-comment" aria-hidden="true"></i>
          </md-button>

          <md-button class="i_btn" id=${note.id.get()} aria-label="info" ng-click="execute_func('file','${note.id.get()}')">
            <i class="fa fa-paperclip" aria-hidden="true"></i>
          </md-button>

        </md-list-item>`;

        var contener = angular.element(div);

        parent.append(contener);
        $compile(contener)($rootScope);
      }


      viewOrHide(id) {

        var element = document.getElementsByClassName("show" + id)[0];
        var show = element.getAttribute("show");

        if (show == "false") {
          element.setAttribute("show", "true");
          this.changeItemColor(id);
          element.innerHTML = '<i class="fa fa-eye-slash" aria-hidden="true"></i>';
        } else {
          this.restoreColor(id);
          element.setAttribute("show", "false");
          element.innerHTML = '<i class="fa fa-eye" aria-hidden="true"></i>';

        }

      }

      //////////////////////////////////////////////////////////////
      //                  Change container                        //
      //////////////////////////////////////////////////////////////
      changeContainer(list, allNotes) {
        list.innerHTML = "";

        var _self = this;
        var contener = angular.element(list);

        var div = angular.element('<md-list>\
      </md-list>');


        contener.append(div);
        $compile(div)($rootScope);

        if (allNotes.length > 0) {
          for (let index = 0; index < allNotes.length; index++) {
            const element = allNotes[index];
            this.createitem(div, element, index);
          }
        } else {
          div.append('<h1>No note created ! create one</h1>');
        }

        this.selectNote(this._sel);
        var _self = this;

        var colors = document.getElementsByClassName("input_color");

        for (let j = 0; j < colors.length; j++) {
          colors[j].onchange = function () {
            _self.changeColorInHub(this.name, this.value);
          }

        }

      }

      DetailPanel(id) {
        var notes = this.model;


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

        for (let index = 0; index < notes.length; index++) {
          if (notes[index].id == id) {
            this._selected = notes[index];
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

            this._selected.notes.push(message);
          }

        }

        sendButtonDiv.appendChild(sendButton);

        formDiv.appendChild(textareaDiv);
        formDiv.appendChild(sendButtonDiv);

        this.detailPanel.setVisible(true);

        notes.bind(() => {
          this.DisplayMessage(formDiv)
        });


      }

      DisplayMessage(formDiv) {
        var _self = this;
        var messageContainer = document.createElement('div');
        messageContainer.className = "messageContainer";

        for (let i = 0; i < this._selected.notes.length; i++) {
          //message div
          var message_div = document.createElement('div');
          message_div.className = "message_div";

          //header message
          var _message = document.createElement('div');
          _message.className = "_message";

          //name
          var message_owner = document.createElement('div');
          message_owner.className = "message_owner";
          message_owner.innerText = this._selected.notes[i].username.get();


          //date
          var message_date = document.createElement('div');
          message_date.className = "message_date";
          var date = new Date(parseInt(this._selected.notes[i].date));
          message_date.innerText = date.getDate() + "/" + date.getMonth() + 1 + "/" + date.getFullYear();



          //message content
          var message_content = document.createElement('div');
          message_content.className = "message_content";

          var message_texte = document.createElement('div');
          message_texte.className = "message_texte";
          message_texte.innerHTML = this._selected.notes[i].message;

          if (this._selected.notes[i].owner == this.user.id) {
            var closeDiv = document.createElement('div');
            closeDiv.className = "close_div";

            var span = document.createElement('span');
            span.innerHTML = "X";
            span.className = "close";
            span.id = this._selected.notes[i].id

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

      deteteMessage(id, formDiv) {

        for (let i = 0; i < this._selected.notes.length; i++) {

          if (this._selected.notes[i].id == id) {
            this._selected.notes.splice(i, 1);
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

      DisplayFilePanel(id) {
        var notes = this.model;

        if (this.filePanel == null) {
          this.filePanel = new PanelClass(this.viewer, id);
          this.filePanel.initializeMoveHandlers(this.filePanel.container);
          this.filePanel.container.appendChild(this.filePanel.createCloseButton());
          this.filePanel.container.style.right = "0px";
          this.filePanel.container.style.width = "400px";
          this.filePanel.container.style.height = "600px";
          this.filePanel.container.padding = "0px";
          // }

          // if(this.filePanelContent == null) {
          this.filePanelContent = document.createElement('div');
          this.filePanelContent.className = "file_panel_content";

          var dragDrop = document.createElement('div');
          dragDrop.className = "dragDrop";

          var input = document.createElement('input');
          input.type = 'file';
          input.id = "modal-new-dropzone-input";
          input.setAttribute("multiple", "true");
          input.className = "modal-new-dropzone-input";

          input.onchange = () => {
            return this.handle_files(input.files);
          }

          var file_container = document.createElement('label');
          file_container.innerHTML = `
                              <span class="modal-new-span-upload">
                                click to Choose files to upload or Drop them here
                              </span>
                              <ul id="modal-new-list-upload"></ul>`;

          file_container.className = "text-center"

          file_container.ondrop = (evt) => {
            evt.stopPropagation();
            evt.preventDefault();

            this.handle_files(evt.dataTransfer.files);
          }

          file_container.ondragover = (evt) => {
            evt.preventDefault();
          }

          file_container.htmlFor = "modal-new-dropzone-input"


          dragDrop.appendChild(input);
          dragDrop.appendChild(file_container);


          this.filePanelContent.appendChild(dragDrop);

          var files_div = document.createElement('div');
          files_div.className = 'files_div';

          this.filePanelContent.appendChild(files_div);
          this.filePanel.container.appendChild(this.filePanelContent);

        }



        this.filePanel.setVisible(true);


        for (let index = 0; index < notes.length; index++) {
          if (notes[index].id == id) {
            this._file_selected = notes[index];
            break;
          }
        }

        this.filePanel.setTitle(this._file_selected.title.get());

        notes.bind(() => {
          this.files_display();
        })

      }

      displayItem(_file, parent) {
        var items = `<md-list-item>
                  <p class="noteTitle">${_file.name.get()}</p>

                  <md-button class="i_btn" aria-label="add_item" id=${_file._info.id.get()} ng-click="execute_func('delete_file','${_file._info.id.get()}')">
                    <i class="fa fa-trash" aria-hidden="true"></i>
                  </md-button>

                  <md-button class="i_btn" aria-label="add_item" id=${_file._info.id.get()} ng-click="execute_func('download','${_file._info.id.get()}')">
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
    Autodesk.Viewing.theExtensionManager.registerExtension('PanelAnnotation', PanelAnnotation);
  } // end run
]);