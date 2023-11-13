# Docker image for HIV-TRACE Viz
FROM ubuntu:20.04

# Set up environment and install dependencies
RUN apt-get update && apt-get -y upgrade && \
    DEBIAN_FRONTEND=noninteractive TZ=Etc/UTC apt-get install -y curl git && \
    apt-get purge -y nodejs npm && \
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.5/install.sh | bash && \
    source ~/.bashrc && \
    nvm install node && \
    nvm alias default node && \
    npm install --global yarn
