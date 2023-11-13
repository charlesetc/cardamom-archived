build:
	esbuild src/app.jsx --bundle --minify --sourcemap --target=chrome58,firefox58 --outfile=static/out.js

watch:
	esbuild src/app.jsx --bundle --sourcemap --target=chrome58,firefox58 --outfile=static/out.js --watch

serve:
	cd static && python -m http.server 8000
