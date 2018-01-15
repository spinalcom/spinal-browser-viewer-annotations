angular.module('app.FileExplorer', ['jsTree.directive', 'app.services', 'app.spinalcom', 'ngMaterial', 'md.data.table'])
  .controller('FileExplorerCtrl', ["$scope", "$rootScope", "spinalFileSystem", "$mdDialog", "authService", "$compile", "$injector", "layout_uid",
    function ($scope, $rootScope, spinalFileSystem, $mdDialog, authService, $compile, $injector, layout_uid) {
      $scope.injector = $injector;
      $scope.uid = layout_uid.get();
      $scope.curr_dir = 0;
      $scope.lastSelected = 0;
      $scope.fs_path = [];
      var newFolder_prompt = $mdDialog.prompt()
        .title('Input the name of the new folder')
        .placeholder('Folder Name')
        .initialValue('New Folder')
        .required(true)
        .ok('Ok')
        .cancel('Cancel');

      $scope.onFocus = () => {
        spinalFileSystem.FileExplorer_focus($scope);
      };
      $scope.onFocus();
      $scope.directory = [];
      $scope.user = authService.get_user();


      $scope.fsmoveToParent = (dir) => {
        let idx = $scope.fs_path.indexOf(dir);
        $scope.fs_path.splice(idx + 1);
        let f = FileSystem._objects[dir._server_id];
        if (f) {
          if (f instanceof File) {
            f.load((m) => {
              if (m) {
                $scope.change_curr_dir(m, $scope.fs_path);
              }
            });
          } else if (f instanceof Directory) {
            $scope.change_curr_dir(f, $scope.fs_path);
          }
        }
        // $scope.change_curr_dir(FileSystem._objects[dir._server_id], $scope.fs_path);
      };
      $scope.getIcon = (type) => {
        return spinalDrive_Env.context_file_exp_app_icon[type] ? spinalDrive_Env.context_file_exp_app_icon[type] : spinalDrive_Env.context_file_exp_app_icon.default;
        // }

        // if (type == "Directory") {
        //   return "folder";
        // }
        // if (type == "Session") {
        //   return "desktop_windows";
        // }
        // return "insert_drive_file";
      };

      $scope.selectFile = (event, file) => {
        if (event.ctrlKey == false) {
          for (var i = 0; i < $scope.directory.length; i++) {
            $scope.directory[i].selected = false;
            $scope.directory[i].over = false;
            $scope.directory[i].selectdrop = false;
          }
          console.log(file);
        }
        file.selected = !file.selected;
      };
      $scope.ondblclick = (file) => {
        console.log("dbl click");
        console.log(file);
        if (file.model_type == "Directory") {
          let f = FileSystem._objects[file._server_id];
          if (f) {
            f.load((m) => {
              if (m) {
                $scope.fs_path.push({
                  name: file.name,
                  _server_id: file._server_id
                });
                $scope.change_curr_dir(m, $scope.fs_path);
              }
            });
          }
        }
      };

      $scope.change_curr_dir = (dir, path) => {
        $scope.curr_dir = dir;
        $scope.fs_path = path;
        handleDirectoryFiles();
      };

      function handleDirectoryFiles() {
        // let olddirectory = $scope.directory;
        // $scope.directory = []
        return spinalFileSystem.getFolderFiles($scope).then((res) => {
          let i = 0;
          let find_idx_in_dir = (res, i) => {
            return res.findIndex((elem) => {
              return $scope.directory[i]._server_id == elem._server_id;
            });
          };
          while (i < $scope.directory.length) {
            if (find_idx_in_dir(res, i) == -1) {
              $scope.directory.splice(i, 1);
              i = 0;
            } else
              i++;
          }
          let found = false;
          for (i = 0; i < res.length; i++) {
            found = false;
            for (var y = 0; y < $scope.directory.length; y++) {
              if ($scope.directory[y]._server_id === res[i]._server_id) {
                $scope.directory[y].name = res[i].name;
                $scope.directory[y].model_type = res[i].model_type;
                $scope.directory[y].owner = res[i].owner;
                $scope.directory[y].last_modified = res[i].last_modified;
                $scope.directory[y].version = res[i].version;
                if (res[i].upload_pecent)
                  $scope.directory[y].upload_pecent = res[i].upload_pecent;
                else
                  $scope.directory[y].upload_pecent = res[i].upload_pecent;
                found = true;
                break;
              }
            }
            if (found == false) {
              $scope.directory.splice(y, 0, res[i]);
            }
          }
        });
      }
      let listener_destructor = spinalFileSystem.subcribe('SPINAL_FS_ONCHANGE', handleDirectoryFiles);
      $scope.$on('$destroy', listener_destructor);

      $scope.enterTarget = 0;
      $scope.getNbSelectedIcon = (type) => {
        console.log(type);
        let nb_selected = 0;
        for (var i = 0; i < $scope.directory.length; i++) {
          if ($scope.directory[i].selected)
            nb_selected++;
        }

        if (nb_selected == 1) {
          return $scope.getIcon(type);
        } else if (nb_selected <= 9) {
          return "filter_" + nb_selected;
        }
        return "filter_9_plus";
      };

      $scope.dragCfg = {
        "dragstart": (event, obj) => {
          console.log("dragstart");
          console.log(event);
          if (obj.selected == false && event.ctrlKey != true) {
            for (let i = 0; i < $scope.directory.length; i++) {
              $scope.directory[i].selected = false;
            }
          }
          obj.selected = true;
          let clone = $("<div id=\"drag-extra\" class=\"fs-drag-item\"><ng-md-icon icon=\"" +
            $scope.getNbSelectedIcon(obj.model_type) +
            "\" style=\"fill: white;height: 24px;\" class=\"md-avatar-icon\"></ng-md-icon>" +
            "<div style=\"float: left;margin-left: 20px;width: -webkit-fill-available;overflow: hidden;text-overflow: ellipsis;\">" +
            "<span style=\"white-space: nowrap;\">" + obj.name + "</span></div></div>");
          $compile(clone[0])($rootScope);
          clone.appendTo("body");
          event.dataTransfer.setDragImage(clone[0], 0, 0);
          spinalFileSystem.FE_selected_drag = [];
          for (let i = 0; i < $scope.directory.length; i++) {
            if ($scope.directory[i].selected == true) {
              $scope.directory[i].selectdrop = true;
              spinalFileSystem.FE_selected_drag.push($scope.directory[i]);
            }
          }
          spinalFileSystem.FE_init_dir_drag = $scope.curr_dir;
          spinalFileSystem.FE_fspath_drag = $scope.fs_path;

          spinalFileSystem.addScopeVisted($scope);
          $rootScope.current_scope_drag = $scope;
          $scope.$apply();
          return false;
        },
        "dragend": (event, obj) => {
          console.log("dragend");
          console.log(obj);
          for (let i = 0; i < $scope.directory.length; i++) {
            $scope.directory[i].selectdrop = false;
            $scope.directory[i].over = false;

          }
          $scope.enterTarget = 0;
          $scope.dropOnFolder = false;

          for (var i = 0; i < spinalFileSystem.FE_visited_scope.length; i++) {
            let scope = spinalFileSystem.FE_visited_scope[i];
            for (var j = 0; j < scope.directory.length; j++) {
              if (scope.directory[j].over == true) {
                scope.directory[j].over = false;
                break;
              }
            }
            scope.dropOnFolder = false;
            scope.$apply();

          }
          spinalFileSystem.FE_visited_scope = [];
          // $scope.$apply();
          return false;
        },
        "dragenter": (event) => {
          event.preventDefault();
          // console.log($scope.curr_dir);

        },
        "dragover": (event, obj) => {
          event.preventDefault();
          event.stopPropagation(); // Stops some browsers from redirecting.
          console.log("over");
          if (obj._server_id == $scope.enterTarget._server_id)
            return false;
          // console.log("ENTER DRAG");
          if (obj.selected == true || obj.model_type != "Directory") {
            $scope.enterTarget = 0;
          } else {
            $scope.enterTarget = obj;
          }
          for (let i = 0; i < $scope.directory.length; i++) {
            $scope.directory[i].over = false;
          }
          if ($scope.enterTarget) {
            event.dataTransfer.dropEffect = "move";
            event.dataTransfer.effectAllowed = "move";
            obj.over = true;
          }
          $scope.dropOnFolder = false;
          $scope.$apply();
          spinalFileSystem.addScopeVisted($scope);
          for (var i = 0; i < spinalFileSystem.FE_visited_scope.length; i++) {
            let scope = spinalFileSystem.FE_visited_scope[i];
            if (scope != $scope) {
              for (var j = 0; j < scope.directory.length; j++) {
                if (scope.directory[j].over == true) {
                  scope.directory[j].over = false;
                  break;
                }
              }
              scope.dropOnFolder = false;
              scope.$apply();
            }
          }
        },
        "drop": (event, obj) => {
          event.stopPropagation(); // Stops some browsers from redirecting.
          event.preventDefault();
          console.log("drop");
          let curr_dir = spinalFileSystem.FE_init_dir_drag;
          let target = 0;
          let i = 0;
          for (; i < $scope.directory.length; i++) {
            if ($scope.directory[i].over) {
              target = $scope.directory[i];
              break;
            }
          }
          if (!target || target.model_type != "Directory")
            return false;
          let files = event.target.files;
          if (!files || files.length === 0)
            files = (event.dataTransfer ? event.dataTransfer.files : event.originalEvent.dataTransfer.files);
          if (files.length > 0) {
            // dnd files
            console.log("folderDropCfg drop Files");
            console.log(files);
            let m_tar = FileSystem._objects[target._server_id];
            if (m_tar) {
              $scope.upload_files(files, m_tar);
            }
            $scope.dropOnFolder = false;
            $scope.$apply();

            return false;
          }

          if (!target || target.model_type != "Directory")
            return false;
          let selected = spinalFileSystem.FE_selected_drag;
          let m_tar = FileSystem._objects[target._server_id];
          if (m_tar) {
            for (i = 0; i < $scope.fs_path.length; i++) {
              let path = FileSystem._objects[$scope.fs_path[i]._server_id];
              if (path) {
                if (path instanceof File) {
                  if (path._ptr.data.value == curr_dir._server_id) {
                    return false;
                  }
                } else if (path instanceof Directory) {
                  if (path._server_id == curr_dir._server_id) {
                    let found = false;
                    if ($scope.fs_path.length >= 2) {
                      console.log($scope.fs_path);
                      for (var y = 0; y < selected.length; y++) {
                        if (selected[y]._server_id == FileSystem._objects[$scope.fs_path[1]._server_id]._server_id) {
                          found = true;
                          break;
                        }

                      }
                    }
                    if (found == false)
                      continue;
                    return false;
                  }
                }
              }

            }
          }
          for (i = 0; i < selected.length; i++) {
            let s = FileSystem._objects[selected[i]._server_id];
            if (s)
              curr_dir.remove_ref(s);
          }
          // let m_tar = FileSystem._objects[target._server_id];
          if (m_tar) {
            m_tar.load((m) => {
              for (var i = 0; i < selected.length; i++) {
                let s = FileSystem._objects[selected[i]._server_id];
                if (s)
                  m.push(s);
              }

            });
          }
          return false;
        }
      };
      $scope.upload_files = (files, directory_target) => {
        if (files.length > 0) {
          for (var i = 0; i < files.length; i++) {
            let file = files[i];
            let filePath = new Path(file);
            let name = $scope.get_unused_name(file.name, directory_target);
            let mod_file = directory_target.add_file(file.name, filePath);
          }
        }
      };
      $scope.get_unused_name = (name, directory_target, idx) => {
        let found = false;
        for (let i = 0; i < directory_target.length; i++) {
          if (directory_target[i].name.get() == name)
            found = true;
        }
        if (found == true) {
          if (!idx) {
            idx = 0;
            name += '(' + idx + ')';
          } else ++idx;
          let reg = /\(\d+\)$/gm;
          name = name.replace(reg, '(' + idx + ')');
          return $scope.get_unused_name(name, directory_target, idx);
        }
        return name;
      };


      $scope.folderDropCfg = {
        "drop": (event) => {
          event.stopPropagation(); // Stops some browsers from redirecting.
          event.preventDefault();
          console.log("folderDropCfg drop");
          var files = event.target.files;
          if (!files || files.length === 0)
            files = (event.dataTransfer ? event.dataTransfer.files : event.originalEvent.dataTransfer.files);
          if (files.length > 0) {
            // dnd files
            console.log("folderDropCfg drop Files");
            console.log(files);
            let m_tar = $scope.curr_dir;
            console.log($scope.directory);
            $scope.upload_files(files, m_tar);
            $scope.dropOnFolder = false;
            $scope.$apply();
            return false;
          }
          let curr_dir = spinalFileSystem.FE_init_dir_drag;
          if (curr_dir == $scope.curr_dir)
            return false;
          let selected = spinalFileSystem.FE_selected_drag;

          let m_tar = $scope.curr_dir;
          if (m_tar) {
            let i;
            for (i = 0; i < $scope.fs_path.length; i++) {
              let path = FileSystem._objects[$scope.fs_path[i]._server_id];

              if (path) {
                if (path instanceof File) {
                  if (path._ptr.data.value == curr_dir._server_id) {
                    return false;
                  }
                } else if (path instanceof Directory) {
                  if (path._server_id == curr_dir._server_id) {
                    let found = false;
                    if ($scope.fs_path.length >= 1) {
                      for (var y = 0; y < selected.length; y++) {
                        if (selected[y]._server_id == FileSystem._objects[$scope.fs_path[1]._server_id]._server_id) {
                          found = true;
                          break;
                        }

                      }
                    }
                    if (found == false)
                      continue;
                    return false;
                  }
                }
              }

            }
          }

          for (let i = 0; i < selected.length; i++) {
            let s = FileSystem._objects[selected[i]._server_id];
            if (s)
              curr_dir.remove_ref(s);
          }
          if (m_tar) {
            for (var i = 0; i < selected.length; i++) {
              let s = FileSystem._objects[selected[i]._server_id];
              if (s)
                m_tar.push(s);
            }
          }
          $scope.dropOnFolder = false;
          return false;
        },
        "dragover": (event) => {
          event.preventDefault();
          console.log("folderDropCfg over");
          for (var i = 0; i < $scope.directory.length; i++) {
            if ($scope.directory[i].over == true) {
              $scope.directory[i].over = false;
              break;
            }
          }
          $scope.enterTarget = 0;
          $scope.dropOnFolder = true;
          spinalFileSystem.addScopeVisted($scope);
          for (i = 0; i < spinalFileSystem.FE_visited_scope.length; i++) {
            let scope = spinalFileSystem.FE_visited_scope[i];
            if (scope != $scope) {
              for (var j = 0; j < scope.directory.length; j++) {
                if (scope.directory[j].over == true) {
                  scope.directory[j].over = false;
                  break;
                }
              }
              scope.dropOnFolder = false;
              scope.$apply();
            }
          }
          $scope.$apply();
          return false;
        },
        "dragenter": (event) => {
          event.preventDefault();
          return false;
        }

      };

      handleDirectoryFiles();

      $scope.context_menu_file = [];
      $scope.onrightclick = (index) => {
        setTimeout(() => {
          // console.log('#fe-menu-' + $scope.uid + '-' + index);
          $('#fe-menu-' + $scope.uid + '-' + index).click();
        });
      };

      $scope.open_context_menu_file = ($mdMenu, ev, file) => {
        $scope.context_menu_file = spinalDrive_Env.get_applications('FileExplorer', {
          file: file,
          scope: $scope,
        });
        console.log($scope.context_menu_file);
        console.log(file);
        $mdMenu.open(ev);
      };
      $scope.context_menu_file_action = ($event, item, file) => {
        console.log("ACTION");
        console.log($event);
        console.log(item);
        console.log(file);
        item.launch_action({
          evt: $event,
          item: item,
          file: file,
          scope: $scope,
        });
      };

      $scope.context_menu_curr_dir = [];

      $scope.open_context_menu_curr_dir = ($mdMenu, ev) => {
        $scope.context_menu_curr_dir = spinalDrive_Env.get_applications('FileExplorerCurrDir', {
          scope: $scope,
          model: $scope.curr_dir
        });
        console.log($scope.context_menu_curr_dir);
        $mdMenu.open(ev);
      };
      $scope.context_menu_curr_dir_action = ($event, item) => {
        item.launch_action({
          evt: $event,
          item: item,
          model: $scope.curr_dir,
          scope: $scope,
        });
      };


    }
  ]);