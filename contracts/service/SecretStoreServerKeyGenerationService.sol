//! The Secret Store server key generation service contract.
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

pragma solidity ^0.4.24;

import "../interfaces/SecretStoreService.sol";
import "./SecretStoreServiceBase.sol";


/// Server Key generation service contract.
/* solium-disable-next-line */
contract SecretStoreServerKeyGenerationService is SecretStoreServiceBase, ServerKeyGenerationServiceClientApi, ServerKeyGenerationServiceKeyServerApi {
    /// Server key generation request.
    struct ServerKeyGenerationRequest {
        address author;
        uint256 threshold;
        RequestResponses responses;
    }

    /// When sever key generation request is received.
    event ServerKeyGenerationRequested(bytes32 serverKeyId, address author, uint8 threshold);
    /// When server key is generated.
    event ServerKeyGenerated(bytes32 indexed serverKeyId, bytes serverKeyPublic);
    /// When error occurs during server key generation.
    event ServerKeyGenerationError(bytes32 indexed serverKeyId);

    /// Constructor.
    constructor(address keyServerSetAddressInit) SecretStoreServiceBase(keyServerSetAddressInit) public {
        serverKeyGenerationFee = 200 finney;
        maxServerKeyGenerationRequests = 4;
    }

    // === Interface methods ===

    /// We do not support direct payments.
    function() public payable {
        revert("Direct payments are not supported.");
    }

    /// Request new server key generation. Generated key will be published via ServerKeyGenerated event when available.
    function generateServerKey(bytes32 serverKeyId, uint8 threshold) external payable
        whenFeePaid(serverKeyGenerationFee)
    {
        // we can't process requests with invalid threshold
        require(threshold + 1 <= keyServersCount(), "Threshold is invalid.");
        // check maximum number of requests
        require(serverKeyGenerationRequestsKeys.length < maxServerKeyGenerationRequests, "Maximum number of requests reached.");

        ServerKeyGenerationRequest storage request = serverKeyGenerationRequests[serverKeyId];
        require(request.author == address(0), "Request author address cannot be 0x0.");
        deposit();

        request.author = msg.sender;
        request.threshold = threshold;
        serverKeyGenerationRequestsKeys.push(serverKeyId);

        emit ServerKeyGenerationRequested(serverKeyId, msg.sender, threshold);
    }

    /// Called when generation is reported by key server.
    function serverKeyGenerated(bytes32 serverKeyId, bytes serverKeyPublic) external validPublic(serverKeyPublic) {
        // check if request still active
        ServerKeyGenerationRequest storage request = serverKeyGenerationRequests[serverKeyId];
        if (request.author == address(0)) {
            return;
        }

        // insert response (we're waiting for responses from all authorities here)
        uint8 keyServerIndex = requireKeyServer(msg.sender);
        bytes32 response = keccak256(serverKeyPublic);
        ResponseSupport responseSupport = insertResponse(
            request.responses,
            keyServerIndex,
            keyServersCount() - 1,
            response);

        // ...and check if there are enough support
        if (responseSupport == ResponseSupport.Unconfirmed) { // not confirmed (yet)
            return;
        }

        // delete request and fire event
        clearServerKeyGenerationRequest(serverKeyId, request);
        if (responseSupport == ResponseSupport.Confirmed) { // confirmed
            emit ServerKeyGenerated(serverKeyId, serverKeyPublic);
        } else { // no consensus possible at all
            emit ServerKeyGenerationError(serverKeyId);
        }
    }

    /// Called when error occurs during server key generation.
    function serverKeyGenerationError(bytes32 serverKeyId) external {
        // check that it is called by key server
        requireKeyServer(msg.sender);

        // check if request still active
        ServerKeyGenerationRequest storage request = serverKeyGenerationRequests[serverKeyId];
        if (request.author == address(0)) {
            return;
        }

        // any error in key generation is fatal, because we need all key servers to participate in generation
        // => delete request and fire event
        clearServerKeyGenerationRequest(serverKeyId, request);
        emit ServerKeyGenerationError(serverKeyId);
    }

    /// Get count of pending server key generation requests.
    function serverKeyGenerationRequestsCount() external view returns (uint256) {
        return serverKeyGenerationRequestsKeys.length;
    }

    /// Get server key generation request with given index.
    /// Returns: (serverKeyId, author, threshold)
    function getServerKeyGenerationRequest(uint256 index) external view returns (bytes32, address, uint256) {
        bytes32 serverKeyId = serverKeyGenerationRequestsKeys[index];
        ServerKeyGenerationRequest storage request = serverKeyGenerationRequests[serverKeyId];
        return (
            serverKeyId,
            request.author,
            request.threshold
        );
    }

    /// Returs true if response from given keyServer is required.
    function isServerKeyGenerationResponseRequired(bytes32 serverKeyId, address keyServer) external view returns (bool) {
        uint8 keyServerIndex = requireKeyServer(keyServer);
        ServerKeyGenerationRequest storage request = serverKeyGenerationRequests[serverKeyId];
        return isResponseRequired(request.responses, keyServerIndex);
    }

    // === Administrative methods ===

    /// Set server key generation fee.
    function setServerKeyGenerationFee(uint256 newFee)
        public
        onlyOwner
    {
        serverKeyGenerationFee = newFee;
    }

    /// Set server key generation requests limit.
    function setMaxServerKeyGenerationRequests(uint256 newLimit)
        public
        onlyOwner
    {
        maxServerKeyGenerationRequests = newLimit;
    }

    /// Delete server key generation request.
    function deleteServerKeyGenerationRequest(bytes32 serverKeyId)
        public
        onlyOwner
    {
        ServerKeyGenerationRequest storage request = serverKeyGenerationRequests[serverKeyId];
        clearServerKeyGenerationRequest(serverKeyId, request);

        emit ServerKeyGenerationError(serverKeyId);
    }

    // === Internal methods ===

    /// Clear server key generation request traces.
    function clearServerKeyGenerationRequest(bytes32 serverKeyId, ServerKeyGenerationRequest storage request) private {
        clearResponses(request.responses);
        delete serverKeyGenerationRequests[serverKeyId];

        removeRequestKey(serverKeyGenerationRequestsKeys, serverKeyId);
    }

    /// Server key generation fee.
    uint256 public serverKeyGenerationFee;
    /// Maximal number of active server key generation requests. We're limiting this number to avoid
    /// infinite gas costs of some functions.
    uint256 public maxServerKeyGenerationRequests;

    /// Pending generation requests.
    mapping (bytes32 => ServerKeyGenerationRequest) private serverKeyGenerationRequests;
    /// Pending generation requests keys.
    bytes32[] private serverKeyGenerationRequestsKeys;
}
