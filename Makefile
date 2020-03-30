.PHONY: download build upload-assets deploy clean

slug = earnings

download:
	node process/download-doc.js

build:
	rm -rf dist/*
	npm run build

upload-assets:
	aws s3 cp dist/script.75da7f30.js s3://spectator-static-assets/$(slug)/script.e0e62486.js --acl=public-read --profile=spec
	aws s3 cp dist/script.75da7f30.js.map s3://spectator-static-assets/$(slug)/script.e0e62486.js.map --acl=public-read --profile=spec
	aws s3 cp dist/styles.164d45a1.css s3://spectator-static-assets/$(slug)/styles.022acb00.css --acl=public-read --profile=spec
	aws s3 cp dist/styles.164d45a1.css.map s3://spectator-static-assets/$(slug)/styles.022acb00.css.map --acl=public-read --profile=spec

publish: build upload-assets

# deploy-gh: build
# 	cd dist && git add . && git commit -m 'Deploy to gh-pages' && git push origin gh-pages

# deploy-arc: build upload-assets

clean:
	rm -rf dist
	git worktree prune
	mkdir dist
	git worktree add dist gh-pages
