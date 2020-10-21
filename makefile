
all: node_modules
	@node src/single-flow.js


node_modules:
	yarn install

format:
	./node_modules/standard/bin/cmd.js --fix "src/*.js" "src/core/*.js"