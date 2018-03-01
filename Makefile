
OUTDIR=www
TEMPLATE_OUTDIR=$(OUTDIR)/app/templates

SRC= app/app.js \
  app/app.config.js \
  app/app.route.js \
  app/directives/navbar.js \
  app/services/spinalCore.js \
  app/services/spinalModelDictionary.js \
  app/services/goldenLayoutService.js \
  app/services/authService.js \
  app/controllers/mainCtrl.js \
  app/controllers/navbarCtrl.js \
  app/controllers/forgeViewerCtrl.js \
  app/controllers/loginCtrl.js \
  app/run/plugin-annotation.js \
  app/run/plugin-endpoint.js

OUT= $(OUTDIR)/js/app.compile.min.js

LIBSRC= bower_components/angular/angular.min.js \
  bower_components/angular-aria/angular-aria.min.js \
  bower_components/angular-animate/angular-animate.min.js \
  bower_components/angular-material/angular-material.min.js \
  bower_components/angular-route/angular-route.min.js \
  bower_components/jquery/dist/jquery.min.js \
  bower_components/bootstrap/dist/js/bootstrap.min.js \
  bower_components/golden-layout/dist/goldenlayout.min.js \
  bower_components/angular-material-icons/angular-material-icons.min.js \
  bower_components/jquery-ui/jquery-ui.min.js \
  bower_components/angular-bootstrap-colorpicker/js/bootstrap-colorpicker-module.min.js \
  bower_components/chart.js/dist/Chart.bundle.min.js

LIBOUT= $(OUTDIR)/js/lib.compile.min.js

CSS= bower_components/angular-material/angular-material.css \
  bower_components/material-design-icons/iconfont/material-icons.css \
  bower_components/golden-layout/src/css/goldenlayout-base.css \
  bower_components/golden-layout/src/css/goldenlayout-dark-theme.css \
  bower_components/font-awesome/css/font-awesome.css \
  bower_components/bootstrap/dist/css/bootstrap.min.css \
  bower_components/angular-bootstrap-colorpicker/css/colorpicker.min.css \
  app/css/app.css

CSSOUT= $(OUTDIR)/css/css.compile.css

FORGELIB= ../spinal-lib-forgefile/forgefile.js
OUTPUTFORGELIB = www/js/browser.forgefile.js

all: compile
	
create_outdir:
	@mkdir -p $(TEMPLATE_OUTDIR)
	@mkdir -p $(OUTDIR)/js
	@mkdir -p $(OUTDIR)/css
	@mkdir -p $(OUTDIR)/fonts

link: create_outdir 
	cp index.html assets www/ -r
	cp app/templates/* $(TEMPLATE_OUTDIR) -r

ln:
	cd .. && ln -s spinalhome/www spinaldrive

compile: create_outdir
	npm run compile -- $(SRC) -o $(OUT)

lib: create_outdir
	cat $(LIBSRC) > $(LIBOUT)

css: create_outdir
	cat $(CSS) | csso -o $(CSSOUT) --map file
	cp bower_components/font-awesome/fonts/* $(OUTDIR)/fonts -r

watch-js-min:
	babel $(SRC) -w -o $(OUT) --presets es2015 --presets minify -s

watch-js:
	babel $(SRC) -w -o $(OUT) --presets es2015 -s

doc:
	jsdoc2md $(SRC) > README.md

bower:
	bower install --allow-root

models:
	npm run compile -- $(FORGELIB) -o $(OUTPUTFORGELIB)

init: bower compile lib css link models

run:
	@true
  
tree:
	make compile
	rm -rf ../../.browser_organs/viewer-annotations
	cp www ../../.browser_organs/viewer-annotations -r

.PHONY: all init run compile lib link css create_outdir doc bower models
