
all: node_modules
	@node src/single-flow.js


node_modules:
	yarn install

format:
	./node_modules/standardx/bin/cmd.js -v --fix "src/*.js" "src/core/*.js"


-include Makefile.local