//! The Secret Store service contract intefaces.
//!
//! Copyright 2017 Svyatoslav Nikolsky, Parity Technologies Ltd.
//!
//! Licensed under the Apache License, Version 2.0 (the "License");
//! you may not use this file except in compliance with the License.
//! You may obtain a copy of the License at
//!
//!     http://www.apache.org/licenses/LICENSE-2.0
//!
//! Unless required by applicable law or agreed to in writing, software
//! distributed under the License is distributed on an "AS IS" BASIS,
//! WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//! See the License for the specific language governing permissions and
//! limitations under the License.

pragma solidity ^0.6.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "../interfaces/KeyServerSet.sol";


/// Base contract for all Secret Store services.
contract SecretStoreServiceBase is Ownable {
    /// Response support.
    enum ResponseSupport { Confirmed, Unconfirmed, Impossible }

    /// Single service request responses.
    struct RequestResponses {
        /// Number of block when servers set has been changed last time.
        /// This whole structure is valid when this value stays the same.
        /// Once this changes, all previous responses are erased.
        uint256 keyServerSetChangeBlock;
        /// We only support up to 256 key servers. If bit is set, this means that key server
        /// has already voted for some confirmation (we do not care about exact response).
        uint256 respondedKeyServersMask;
        /// Number of key servers that have responded to request (number of ones in respondedKeyServersMask).
        uint8 respondedKeyServersCount;
        /// Response => number of supporting key servers.
        mapping (bytes32 => uint8) responsesSupport;
        /// Maximal support of single response.
        uint8 maxResponseSupport;
        /// All responses that are in responsesSupport. In ideal world, when all
        /// key servers are working correctly, there'll be 1 response. Max 256 responses.
        bytes32[] responses;
    }

    /// Only pass when fee is paid.
    modifier whenFeePaid(uint256 amount) {
        require(msg.value >= amount, "Transaction value is not enough.");
        _;
    }

    /// Only pass when 'valid' public is passed.
    modifier validPublic(bytes memory publicKey) {
        require(publicKey.length == 64, "Public key is not valid.");
        _;
    }

    /// Constructor.
    constructor(address keyServerSetAddressInit) internal {
        keyServerSetAddress = keyServerSetAddressInit;
    }

    /// Return number of key servers.
    function keyServersCount() public view returns (uint8) {
        return KeyServerSet(keyServerSetAddress).getCurrentKeyServersCount();
    }

    /// Return index of key server at given address.
    function requireKeyServer(address keyServer) public view returns (uint8) {
        return KeyServerSet(keyServerSetAddress).getCurrentKeyServerIndex(keyServer);
    }

    /// Drain balance of sender key server.
    function drain() public {
        uint256 balance = balances[msg.sender];
        require(balance != 0, "Balance is 0.");
        balances[msg.sender] = 0;
        msg.sender.transfer(balance);
    }

    /// Deposit equal share of amount to each of key servers.
    function deposit() internal {
        uint8 count = keyServersCount();
        uint256 amount = msg.value;
        uint256 share = amount / count;
        for (uint8 i = 0; i < count - 1; i++) {
            address keyServer = KeyServerSet(keyServerSetAddress).getCurrentKeyServer(i);
            balances[keyServer] += share;
            amount = amount - share;
        }

        address lastKeyServer = KeyServerSet(keyServerSetAddress).getCurrentKeyServer(count - 1);
        balances[lastKeyServer] += amount;
    }

    /// Returns true if response from given keyServer is required.
    function isResponseRequired(RequestResponses storage responses, uint8 keyServerIndex) internal view returns (bool) {
        // if servers set has changed, new response is definitely required
        uint256 keyServerSetChangeBlock = KeyServerSet(keyServerSetAddress).getCurrentLastChange();
        if (keyServerSetChangeBlock != responses.keyServerSetChangeBlock) {
            return true;
        }

        // only require response when server has not responded before
        uint256 keyServerMask = (uint256(1) << keyServerIndex);
        return ((responses.respondedKeyServersMask & keyServerMask) == 0);
    }

    /// Insert key server confirmation.
    function insertResponse(
        RequestResponses storage responses,
        uint8 keyServerIndex,
        uint8 threshold,
        bytes32 response) internal returns (ResponseSupport)
    {
        // check that servers set is still the same (and all previous responses are valid)
        uint256 keyServerSetChangeBlock = KeyServerSet(keyServerSetAddress).getCurrentLastChange();
        if (responses.respondedKeyServersCount == 0) {
            responses.keyServerSetChangeBlock = keyServerSetChangeBlock;
        } else if (responses.keyServerSetChangeBlock != keyServerSetChangeBlock) {
            resetResponses(responses, keyServerSetChangeBlock);
        }

        // check if key server has already responded
        uint256 keyServerMask = (uint256(1) << keyServerIndex);
        if ((responses.respondedKeyServersMask & keyServerMask) != 0) {
            return ResponseSupport.Unconfirmed;
        }

        // insert response
        uint8 responseSupport = responses.responsesSupport[response] + 1;
        responses.respondedKeyServersMask |= keyServerMask;
        responses.respondedKeyServersCount += 1;
        responses.responsesSupport[response] = responseSupport;
        if (responseSupport == 1) {
            responses.responses.push(response);
        }
        if (responseSupport >= responses.maxResponseSupport) {
            responses.maxResponseSupport = responseSupport;

            // check if passed response has received enough support
            if (threshold <= responseSupport - 1) {
                return ResponseSupport.Confirmed;
            }
        }

        // check if max confirmation CAN receive enough support
        uint8 keyServersLeft = keyServersCount() - responses.respondedKeyServersCount;
        if (threshold > responses.maxResponseSupport + keyServersLeft - 1) {
            return ResponseSupport.Impossible;
        }

        return ResponseSupport.Unconfirmed;
    }

    /// Clear responses before removal.
    function clearResponses(RequestResponses storage responses) internal {
        for (uint256 i = 0; i < responses.responses.length; ++i) {
            delete responses.responsesSupport[responses.responses[i]];
        }
    }

    /// Remove request id from array.
    function removeRequestKey(bytes32[] storage requests, bytes32 request) internal {
        for (uint i = 0; i < requests.length; ++i) {
            if (requests[i] == request) {
                requests[i] = requests[requests.length - 1];
                requests.pop();
                break;
            }
        }
    }

    /// Reset responses.
    function resetResponses(RequestResponses storage responses, uint256 keyServerSetChangeBlock) private {
        clearResponses(responses);
        responses.keyServerSetChangeBlock = keyServerSetChangeBlock;
        responses.respondedKeyServersMask = 0;
        responses.respondedKeyServersCount = 0;
        responses.maxResponseSupport = 0;
        delete responses.responses;
    }

    /// Address of KeyServerSet contract.
    address private keyServerSetAddress;
    /// Balances of key servers.
    mapping (address => uint256) private balances;
    /// Active requests.
    mapping (bytes32 => RequestResponses) private requests;
}
