# Custom Jenkins inbound agent for quiz-app frontend pipeline
# Base on the official Jenkins inbound agent with JDK 11 (compatible with Jenkins controller)
FROM jenkins/inbound-agent:jdk17

USER root

# Set shell options for security
SHELL ["/bin/bash", "-o", "pipefail", "-c"]

# Install required packages and tools
# - bash, curl, git: basic tooling for scripts and GitOps updates
# - Node.js 22 runtime: required for building the React frontend (Vite 7+ requires Node 20.19+ or 22.12+)
# - docker-cli, buildctl: BuildKit client to build/push Docker images
# - hadolint: Dockerfile linter used in the pipeline
# - jq: handy JSON processor (used by npm audit output)
# - unzip: required for AWS CLI installation
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        bash \
        curl \
        git \
        ca-certificates \
        gnupg \
        docker.io \
        build-essential \
        jq \
        unzip && \
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash - && \
    apt-get install -y --no-install-recommends nodejs && \
    npm install -g npm@latest && \
    # Install AWS CLI v2
    curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "/tmp/awscliv2.zip" && \
    unzip -q /tmp/awscliv2.zip -d /tmp && \
    /tmp/aws/install && \
    rm -rf /tmp/awscliv2.zip /tmp/aws && \
    # Install buildctl (BuildKit CLI)
    curl -L -o /tmp/buildkit.tgz https://github.com/moby/buildkit/releases/download/v0.12.5/buildkit-v0.12.5.linux-amd64.tar.gz && \
    tar -C /usr/local -xzf /tmp/buildkit.tgz && \
    rm /tmp/buildkit.tgz && \
    # Install Hadolint
    curl -L -o /usr/local/bin/hadolint https://github.com/hadolint/hadolint/releases/download/v2.12.0/hadolint-Linux-x86_64 && \
    chmod +x /usr/local/bin/hadolint && \
    # Clean up apt cache to reduce image size
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Ensure npm package cache directory exists with write permissions
RUN mkdir -p /home/jenkins/.npm && chown -R jenkins:jenkins /home/jenkins/.npm

USER 1000
WORKDIR /home/jenkins

# Start Jenkins agent (inherited from base image)
ENTRYPOINT ["/usr/local/bin/jenkins-agent"]