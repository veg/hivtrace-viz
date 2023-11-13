# Docker image for an HIV-TRACE Viz development environment
FROM oraclelinux:8

# Set up environment and install dependencies
RUN yum -y update && \
    yum install -y curl git python3.11 && \
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.5/install.sh | bash && \
    source ~/.bashrc && \
    nvm install node && \
    nvm alias default node && \
    npm install --global yarn

# To compile HIV-TRACE Viz within the development environment:
#   yarn
#   yarn build
