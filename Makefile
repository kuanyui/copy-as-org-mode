.PHONY: dev build xpi xpi-server clear zip-repo

NAME=Copy as Org-Mode
BIN:="node_modules/.bin"
XPI_DIR=../xpi

watch: clear
	./node_modules/.bin/webpack --mode=development --watch

build: clear
	./node_modules/.bin/webpack --mode=production

xpi: clear build
	mkdir -p ${XPI_DIR}
	zip -r -FS '${XPI_DIR}/${NAME}.xpi' dist/ img/ manifest.json README.org LICENSE package.json

xpi-server: clear xpi
	ifconfig | grep "inet " | grep --invert-match '127.0.0.1'
	cd ${XPI_DIR}; python3 -m http.server 8888

clear:
	rm -rf dist/*
	rm -f '../${NAME}-upload.zip'
	rm -f '${XPI_DIR}/${NAME}.xpi'

zip-repo: clear
	zip -r '../${NAME}-upload.zip' . -x .git/\* node_modules/\*


update-readme-screenshot:
	${BIN}/ts-node -P ./tsconfig.json ./script/update-readme-screenshot.ts