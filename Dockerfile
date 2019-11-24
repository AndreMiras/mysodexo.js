# Docker image for installing dependencies & running tests.
# Build with:
# docker build --tag=mysodexojs .
# Run with:
# docker run mysodexojs /bin/sh -c 'make test CI=1'
# Or for interactive shell:
# docker run -it --rm mysodexojs
FROM ubuntu:18.04

ENV USER="user"
ENV HOME_DIR="/home/${USER}"
ENV WORK_DIR="${HOME_DIR}/app"

# configure locale
RUN apt update -qq > /dev/null && apt install -qq --yes --no-install-recommends \
    locales && \
    locale-gen en_US.UTF-8
ENV LANG="en_US.UTF-8" \
    LANGUAGE="en_US.UTF-8" \
    LC_ALL="en_US.UTF-8"

# install minimal system dependencies
RUN apt update -qq > /dev/null && apt install -qq --yes --no-install-recommends \
    ca-certificates \
    curl \
    gnupg \
    make \
    sudo && \
    rm -rf /var/lib/apt/lists/*

# install yarn
RUN curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add - && \
    echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list && \
    apt update -qq > /dev/null && apt install -qq --yes --no-install-recommends \
    yarn

# prepare non root env, with sudo access and no password
RUN useradd --create-home --home-dir ${HOME_DIR} --shell /bin/bash ${USER} && \
    usermod -append --groups sudo ${USER} && \
    echo "%sudo ALL=(ALL) NOPASSWD: ALL" >> /etc/sudoers && \
    mkdir ${WORK_DIR} && \
    chown ${USER}:${USER} -R ${WORK_DIR}

USER ${USER}
WORKDIR ${WORK_DIR}

# install system dependencies
COPY Makefile package.json ${WORK_DIR}/
RUN sudo make system_dependencies && \
    make install && \
    sudo rm -rf /var/lib/apt/lists/*

COPY . ${WORK_DIR}
