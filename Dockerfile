FROM debian:stable
MAINTAINER Mose Last <m0se@raincloud.ch>

ENV DEBIAN_FRONTEND noninteractive

# Usual update / upgrade
RUN apt-get update
RUN apt-get upgrade -q -y
RUN apt-get dist-upgrade -q -y

# Install Node
RUN apt-get install -q -y curl git
RUN curl -sL https://deb.nodesource.com/setup_4.x | bash -
RUN apt-get install -q -y nodejs build-essential

RUN adduser --disabled-password --home /home/colman --uid 1000 --gecos 'ColMan' colman \
 && mkdir -p /home/colman && chown colman:colman /home/colman

# switch to work env
USER colman
WORKDIR /home/colman

# Install NPM deps
ADD ./package.json /home/colman/
RUN npm install

VOLUME /data

# Add project folder
ADD ./ /home/colman/

#ADD entrypoint.sh /bin/entrypoint.sh

#ENV API_ORIGIN "https://api.ipfs.raincloud.ch/"

#ENTRYPOINT ["/bin/entrypoint.sh"]
