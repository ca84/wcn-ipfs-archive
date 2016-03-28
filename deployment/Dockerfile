FROM ubuntu:wily
MAINTAINER Mose Last <m0se@raincloud.ch>

ENV DEBIAN_FRONTEND noninteractive

# Usual update / upgrade
RUN apt-get update
RUN apt-get upgrade -q -y
RUN apt-get dist-upgrade -q -y

# Install pkgs 
RUN apt-get install -q -y wget git cmake 

# Install Go 1.5.2
RUN wget https://storage.googleapis.com/golang/go1.5.2.linux-amd64.tar.gz
RUN tar -C /usr/local -xzf go1.5.2.linux-amd64.tar.gz

# prep env for go-ipfs build
RUN mkdir -p /opt/ipfs/bin
ENV GOPATH=/opt/ipfs
ENV PATH=$PATH:/usr/local/go/bin:$GOPATH/bin

# fetch go-ipfs
RUN go get -d github.com/ipfs/go-ipfs

# build go-ipfs
WORKDIR /opt/ipfs/src/github.com/ipfs/go-ipfs 
RUN make toolkit_upgrade
RUN make install 

# add app user "ipfs"
RUN adduser --disabled-password --home /home/ipfs --uid 1000 --gecos 'IPFS' ipfs \
 && mkdir -p /home/ipfs && ln -s /data/.ipfs /home/ipfs/.ipfs
RUN echo "export PATH=\$PATH:/opt/ipfs/bin" >> /home/ipfs/.profile
RUN chown -R ipfs:ipfs /home/ipfs
USER ipfs
WORKDIR /home/ipfs

VOLUME /data

ADD entrypoint.sh /bin/entrypoint.sh

ENTRYPOINT ["/bin/entrypoint.sh"]
