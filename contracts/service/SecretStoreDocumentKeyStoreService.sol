//! The Secret Store document key store service contract.
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

import "../interfaces/SecretStoreService.sol";
import "./SecretStoreServiceBase.sol";


/// Document Key store service contract
contract SecretStoreDocumentKeyStoreService is
    SecretStoreServiceBase,
    DocumentKeyStoreServiceClientApi,
    DocumentKeyStoreServiceKeyServerApi
{
    /// Document key store request
    struct DocumentKeyStoreRequest {
        address author;
        bytes commonPoint;
        bytes encryptedPoint;
        RequestResponses responses;
    }

    /// When document key store request is received.
    event DocumentKeyStoreRequested(bytes32 serverKeyId, address author, bytes commonPoint, bytes encryptedPoint);

    /// When document key is stored.
    event DocumentKeyStored(bytes32 indexed serverKeyId);

    /// When error occurs during document key store.
    event DocumentKeyStoreError(bytes32 indexed serverKeyId);

    /// Constructor.
    constructor(address keyServerSetAddressInit)
        public
        SecretStoreServiceBase(keyServerSetAddressInit)
    {
        documentKeyStoreFee = 100 finney;
        maxDocumentKeyStoreRequests = 8;
    }

    // === Interface methods ===

    /// We do not support direct payments.
    receive() external payable {
        revert("Direct payments are not supported.");
    }

    /// Request document key store. Use `secretstore_generateDocumentKey` RPC to generate both
    /// `commonPoint` and `encryptedPoint`.
    function storeDocumentKey(
        bytes32 serverKeyId,
        bytes calldata commonPoint,
        bytes calldata encryptedPoint
    )
        external
        payable
        override
        whenFeePaid(documentKeyStoreFee)
        validPublic(commonPoint)
        validPublic(encryptedPoint)
    {
        // check maximum number of requests
        require(
            documentKeyStoreRequestsKeys.length < maxDocumentKeyStoreRequests,
            "Maximum number of requests reached."
        );

        DocumentKeyStoreRequest storage request = documentKeyStoreRequests[serverKeyId];
        require(request.author == address(0), "Request author address is 0x0.");
        deposit();

        request.author = msg.sender;
        request.commonPoint = commonPoint;
        request.encryptedPoint = encryptedPoint;
        documentKeyStoreRequestsKeys.push(serverKeyId);

        emit DocumentKeyStoreRequested(
            serverKeyId,
            msg.sender,
            commonPoint,
            encryptedPoint);
    }

    /// Called when store is reported by key server.
    function documentKeyStored(bytes32 serverKeyId)
        external
        override
    {
        // check if request still active
        DocumentKeyStoreRequest storage request = documentKeyStoreRequests[serverKeyId];
        if (request.author == address(0)) {
            return;
        }

        // insert response (we're waiting for responses from all authorities here)
        uint8 keyServerIndex = requireKeyServer(msg.sender);
        bytes32 response = bytes32(0);
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
        // there's always consensus, because key servers are only reporting the fact that they've stored the key
        clearDocumentKeyStoreRequest(serverKeyId, request);
        emit DocumentKeyStored(serverKeyId);
    }

    /// Called when error occurs during document key store.
    function documentKeyStoreError(bytes32 serverKeyId)
        external
        override
    {
        // check if request still active
        DocumentKeyStoreRequest storage request = documentKeyStoreRequests[serverKeyId];
        if (request.author == address(0)) {
            return;
        }

        // check that it is called by key server
        requireKeyServer(msg.sender);

        // any error in key store is fatal, because we need all key servers to participate in store
        // => delete request and fire event
        clearDocumentKeyStoreRequest(serverKeyId, request);
        emit DocumentKeyStoreError(serverKeyId);
    }

    /// Get count of pending document key store requests.
    function documentKeyStoreRequestsCount()
        external
        view
        override
        returns (uint256)
    {
        return documentKeyStoreRequestsKeys.length;
    }

    /// Get document key store request with given index.
    /// Returns: (serverKeyId, author, commonPoint, encryptedPoint)
    function getDocumentKeyStoreRequest(uint256 index)
        external
        view
        override
        returns (bytes32, address, bytes memory, bytes memory)
    {
        bytes32 serverKeyId = documentKeyStoreRequestsKeys[index];
        DocumentKeyStoreRequest storage request = documentKeyStoreRequests[serverKeyId];
        return (
            serverKeyId,
            request.author,
            request.commonPoint,
            request.encryptedPoint
        );
    }

    /// Returs true if response from given keyServer is required.
    function isDocumentKeyStoreResponseRequired(bytes32 serverKeyId, address keyServer)
        external
        view
        override
        returns (bool)
    {
        uint8 keyServerIndex = requireKeyServer(keyServer);
        DocumentKeyStoreRequest storage request = documentKeyStoreRequests[serverKeyId];
        return isResponseRequired(request.responses, keyServerIndex);
    }

    // === Administrative methods ===

    /// Set document key store fee.
    function setDocumentKeyStoreFee(uint256 newFee)
        public
        onlyOwner
    {
        documentKeyStoreFee = newFee;
    }

    /// Set document key store requests limit.
    function setMaxDocumentKeyStoreRequests(uint256 newLimit)
        public
        onlyOwner
    {
        maxDocumentKeyStoreRequests = newLimit;
    }

    /// Delete document key store request.
    function deleteDocumentKeyStoreRequest(bytes32 serverKeyId)
        public
        onlyOwner
    {
        DocumentKeyStoreRequest storage request = documentKeyStoreRequests[serverKeyId];
        clearDocumentKeyStoreRequest(serverKeyId, request);

        emit DocumentKeyStoreError(serverKeyId);
    }

    // === Internal methods ===

    /// Clear document key store request traces.
    function clearDocumentKeyStoreRequest(bytes32 serverKeyId, DocumentKeyStoreRequest storage request)
        private
    {
        clearResponses(request.responses);
        delete documentKeyStoreRequests[serverKeyId];

        removeRequestKey(documentKeyStoreRequestsKeys, serverKeyId);
    }

    /// Document key store fee.
    uint256 public documentKeyStoreFee;
    /// Maximal number of active document key store requests. We're limiting this number to avoid
    /// infinite gas costs of some functions.
    uint256 public maxDocumentKeyStoreRequests;

    /// Pending store requests.
    mapping (bytes32 => DocumentKeyStoreRequest) private documentKeyStoreRequests;
    /// Pending store requests keys.
    bytes32[] private documentKeyStoreRequestsKeys;
}
