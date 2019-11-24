DOCKER_IMAGE=andremiras/mysodexojs
SYSTEM_DEPENDENCIES= \
	build-essential \
	curl \
	git \
	make \
	nodejs \
	python3

system_dependencies:
	sudo apt update -qq > /dev/null && sudo apt -qq install --yes --no-install-recommends $(SYSTEM_DEPENDENCIES)

install:
	yarn install

clean:
	rm -rf node_modules/

test: install
	yarn test --watchAll=false

lint: install
	yarn lint

docker/build:
	docker build --cache-from=$(DOCKER_IMAGE) --tag=$(DOCKER_IMAGE) .

docker/run/make/%:
	docker run -it --rm $(DOCKER_IMAGE) make $*

docker/run/shell:
	docker run -it --rm $(DOCKER_IMAGE)
