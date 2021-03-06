#!/bin/bash

trap "{

echo Exit TRAP
/bin/bash /tmp/stopipfsd
exit 0

}" SIGTERM

mkdir -p /data/.ipfs
chown 1000:1000 /data/.ipfs

# Test whether the mounted directory is writable for us
if ( touch /data/.ipfs/write_test 2>/dev/null ); then
  rm /data/.ipfs/write_test
else
  echo "ERR: /data/.ipfs is not writable for user 'ipfs' (UID 1000)"
  exit 1
fi

echo "Running $(ipfs version)..."

if [ -e /data/.ipfs/config ]; then
  echo "Found ipfs repository. Not initializing."
else
  ipfs init
  ipfs config Addresses.API /ip4/0.0.0.0/tcp/5001
  ipfs config Addresses.Gateway /ip4/0.0.0.0/tcp/8080
fi

ipfs daemon &

echo kill -SIGTERM $! > /tmp/stopipfsd

wait
