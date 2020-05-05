#!/usr/bin/env bash

set -o errexit

cdir="$( cd "$(dirname "$0")" ; pwd -P )"
source ${cdir}/ganache.sh

trap ganache_cleanup EXIT

GANACHE_PORT=${GANACHE_PORT:-8545}

if ganache_running $GANACHE_PORT; then
  echo "Using existing ganache-cli instance."
else
  echo "Starting our own ganache-cli instance."
  ganache_start $GANACHE_PORT
fi

npx truffle test "cdir/../test/contracts/registry.js" --network test
npx truffle test "cdir/../test/contracts/relay.js" --network test
npx truffle test "cdir/../test/solidity/TestERC165Query.sol" --network test
npx truffle test "cdir/../test/solidity/TestERC165Query.sol" --network test
#sleep 5
npx mocha "cdir/../test/tool/*.js"
