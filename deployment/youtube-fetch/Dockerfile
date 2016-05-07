# This builds on top of "../../Dockerfile", replace the FROM with the name of that built Docker

FROM dist.rain.core/infra/ipfs-collman:latest

MAINTAINER Mose Last <m0se@raincloud.ch>


# install youtube-dl from apt, so we have all dependencies
RUN apt-get install -q -y youtube-dl

# get current version of yt-dl
RUN wget https://yt-dl.org/downloads/latest/youtube-dl -O /bin/youtube-dl
RUN chmod +x /bin/youtube-dl
RUN /bin/youtube-dl -U



## /bin/youtube-dl --get-id --dateafter 20160428 -citws ytuser:WorldCryptoNetwork > id_list & ypid=$!;sleep 40;kill $ypid