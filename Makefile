DOCKER_IMAGE=andremiras/mysodexojs
SYSTEM_DEPENDENCIES= \
	nodejs
ifdef CI
YARN_TEST=test:coveralls
else
YARN_TEST=test
endif

system_dependencies:
	apt update -qq > /dev/null && apt -qq install --yes --no-install-recommends $(SYSTEM_DEPENDENCIES)

install:
	yarn install

clean:
	rm -rf node_modules/

test: install
	yarn $(YARN_TEST)

test/debug: install
	yarn test:debug

test/inspect: install
	yarn test:inspect

run: install
	yarn run:main

run/debug: install
	yarn run:debug

run/inspect: install
	@echo chrome://inspect
	yarn run:inspect

lint: install
	yarn lint

docker/build:
	docker build --cache-from=$(DOCKER_IMAGE) --tag=$(DOCKER_IMAGE) .

docker/run/make/%:
	docker run --env-file env.list -it --rm $(DOCKER_IMAGE) make $*

docker/run/shell:
	docker run --env-file env.list -it --rm $(DOCKER_IMAGE)
