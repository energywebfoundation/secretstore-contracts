//! The Secret Store document key shadow retrieval service contract.
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


/// Document Key shadow retrieval service contract.
/* solium-disable-next-line */
contract SecretStoreDocumentKeyShadowRetrievalService is SecretStoreServiceBase, DocumentKeyShadowRetrievalServiceClientApi, DocumentKeyShadowRetrievalServiceKeyServerApi {
    /// Document key shadow retrieval request.
    struct DocumentKeyShadowRetrievalRequest {
        // public portion-related data
        bytes32 serverKeyId;
        bytes requesterPublic;
        RequestResponses commonRetrievalResponses;
        bool isCommonRetrievalCompleted;
        uint8 threshold;
        // personal portion-related data
        uint256 personalRetrievalErrors;
        uint8 personalRetrievalErrorsCount;
        bytes32[] personalDataKeys;
        mapping (bytes32 => DocumentKeyShadowRetrievalData) personalData;
    }

    /// Document key retrieval data.
    struct DocumentKeyShadowRetrievalData {
        uint256 participants;
        uint256 reported;
        uint8 reportedCount;
    }

    //// Only pass when caller is the owner of given public key.
    modifier onlyPublicOwner(bytes publicKey) {
        require(address(uint(keccak256(publicKey)) & 0x00FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF) == msg.sender,
            "Caller is not owner of the given public key."
        );
        _;
    }

    /// When document key common-portion retrieval request is received.
    event DocumentKeyCommonRetrievalRequested(bytes32 serverKeyId, address requester);
    /// When document key personal-portion retrieval request is received.
    event DocumentKeyPersonalRetrievalRequested(bytes32 serverKeyId, bytes requesterPublic);
    /// When document key common portion is retrieved. Ater this event s fired, wait for
    /// exactly `threshold+1` `DocumentKeyPersonalRetrieved` events with the same `decryptedSecret` value.
    event DocumentKeyCommonRetrieved(bytes32 indexed serverKeyId, address indexed requester, bytes commonPoint, uint8 threshold);
    /// When document key personal portion is retrieved. After enough events are fired, use `secretstore_shadowDecrypt`
    /// to decrypt document contents.
    event DocumentKeyPersonalRetrieved(bytes32 indexed serverKeyId, address indexed requester, bytes decryptedSecret, bytes shadow);
    /// When error occurs during document key retrieval.
    event DocumentKeyShadowRetrievalError(bytes32 indexed serverKeyId, address indexed requester);

    /// Constructor.
    constructor(address keyServerSetAddressInit) SecretStoreServiceBase(keyServerSetAddressInit) public {
        documentKeyShadowRetrievalFee = 200 finney;
        maxDocumentKeyShadowRetrievalRequests = 4;
    }

    // === Interface methods ===

    /// We do not support direct payments.
    function() public payable {
        revert("Direct payments are not supported!");
    }

    /// Request document key retrieval.
    function retrieveDocumentKeyShadow(bytes32 serverKeyId, bytes requesterPublic) external payable
        whenFeePaid(documentKeyShadowRetrievalFee)
        validPublic(requesterPublic)
        onlyPublicOwner(requesterPublic)
    {
        // check maximum number of requests
        require(documentKeyShadowRetrievalRequestsKeys.length < maxDocumentKeyShadowRetrievalRequests, "Maximum number of requests reached.");

        bytes32 retrievalId = keccak256(abi.encodePacked(serverKeyId, msg.sender));
        DocumentKeyShadowRetrievalRequest storage request = documentKeyShadowRetrievalRequests[retrievalId];
        require(request.requesterPublic.length == 0, "requesterPublic length is not 0.");
        deposit();

        // we do not know exact threshold value here && we can not blindly trust the first response
        // => we should agree upon two values: threshold && document key itself
        // => assuming that all authorities will eventually respond with value/error, we will wait for:
        // 1) at least 50% + 1 authorities agreement on the same threshold value
        // 2) after threshold is agreed, we will wait for threshold + 1 values of document key

        // the data required to compute document key is the triple { commonPoint, encryptedPoint, shadowPoints[] }
        // this data is computed on threshold + 1 nodes only
        // retrieval consists of two phases:
        // 1) every authority that is seeing retrieval request, publishes { commonPoint, encryptedPoint, threshold }
        // 2) master node starts decryption session
        // 2.1) every node participating in decryption session publishes { address[], shadow }
        // 2.2) once there are threshold + 1 confirmations of { address[], shadow } from exactly address[] authorities, we are publishing the key

        request.serverKeyId = serverKeyId;
        request.requesterPublic = requesterPublic;
        documentKeyShadowRetrievalRequestsKeys.push(retrievalId);

        emit DocumentKeyCommonRetrievalRequested(serverKeyId, msg.sender);
    }

    /// Called when common data is reported by key server.
    function documentKeyCommonRetrieved(
        bytes32 serverKeyId,
        address requester,
        bytes commonPoint,
        uint8 threshold) external validPublic(commonPoint)
    {
        // check if request still active
        bytes32 retrievalId = keccak256(abi.encodePacked(serverKeyId, requester));
        DocumentKeyShadowRetrievalRequest storage request = documentKeyShadowRetrievalRequests[retrievalId];
        if (request.isCommonRetrievalCompleted || request.requesterPublic.length == 0) {
            return;
        }

        // insert response
        uint8 keyServerIndex = requireKeyServer(msg.sender);
        bytes32 commonResponse = keccak256(abi.encodePacked(commonPoint, threshold));
        ResponseSupport commonResponseSupport = insertResponse(
            request.commonRetrievalResponses,
            keyServerIndex,
            keyServersCount() / 2,
            commonResponse);

        // ...and check if there are enough support
        if (commonResponseSupport == ResponseSupport.Unconfirmed) { // not confirmed (yet)
            return;
        }

        // if common consensus isn't possible => personal retrieval is also impossible
        if (commonResponseSupport == ResponseSupport.Impossible) {
            clearDocumentKeyShadowRetrievalRequest(retrievalId, request);
            emit DocumentKeyShadowRetrievalError(serverKeyId, requester);
            return;
        }

        // else => remember required data
        request.isCommonRetrievalCompleted = true;
        request.threshold = threshold;

        // ...and publish common data (this is also a signal to 'master' key server to start decryption)
        emit DocumentKeyCommonRetrieved(
            serverKeyId,
            requester,
            commonPoint,
            threshold);
        emit DocumentKeyPersonalRetrievalRequested(serverKeyId, request.requesterPublic);
    }

    /// Called when 'personal' data is reported by key server.
    function documentKeyPersonalRetrieved(
        bytes32 serverKeyId,
        address requester,
        uint256 participants,
        bytes decryptedSecret,
        bytes shadow) external
        validPublic(decryptedSecret)
    {
        // check if request still active
        bytes32 retrievalId = keccak256(abi.encodePacked(serverKeyId, requester));
        DocumentKeyShadowRetrievalRequest storage request = documentKeyShadowRetrievalRequests[retrievalId];
        if (request.requesterPublic.length == 0) {
            return;
        }

        // we do not accept personal data until common is retrieved
        require(request.isCommonRetrievalCompleted, "Common retrieval is not completed.");

        // there must be exactly threshold + 1 participated key servers
        // TODO: require(request.threshold + 1 == participants.length);

        // key server must have an entry in participants
        uint8 keyServerIndex = requireKeyServer(msg.sender);
        uint256 keyServerMask = (uint256(1) << keyServerIndex);
        require((participants & keyServerMask) != 0, "Key server does not have an entry in participants.");

        // insert new personal data
        bytes32 personalDataId = keccak256(abi.encodePacked(participants, decryptedSecret));
        DocumentKeyShadowRetrievalData storage personalData = request.personalData[personalDataId];
        if (personalData.participants == 0) {
            request.personalDataKeys.push(personalDataId);
            personalData.participants = participants;
        } else {
            require((personalData.reported & keyServerMask) == 0, "Personal data is not reported.");
        }

        // remember result
        personalData.reportedCount += 1;
        personalData.reported |= keyServerMask;

        // publish personal portion
        emit DocumentKeyPersonalRetrieved(
            serverKeyId,
            requester,
            decryptedSecret,
            shadow);

        // check if all participants have responded
        if (request.threshold != personalData.reportedCount - 1) {
            return;
        }

        // delete request
        clearDocumentKeyShadowRetrievalRequest(retrievalId, request);
    }

    /// Called when error occurs during document key shadow retrieval.
    function documentKeyShadowRetrievalError(bytes32 serverKeyId, address requester) external {
        // check if request still active
        bytes32 retrievalId = keccak256(abi.encodePacked(serverKeyId, requester));
        DocumentKeyShadowRetrievalRequest storage request = documentKeyShadowRetrievalRequests[retrievalId];
        if (request.requesterPublic.length == 0) {
            return;
        }

        // error on common data retrieval step is treated like a voting for non-existant common data
        uint8 keyServerIndex = requireKeyServer(msg.sender);
        if (!request.isCommonRetrievalCompleted) {
            // insert response
            bytes32 invalidResponse = bytes32(0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF);
            ResponseSupport invalidResponseSupport = insertResponse(
                request.commonRetrievalResponses,
                keyServerIndex,
                keyServersCount() / 2,
                invalidResponse);

            // ...and check if there are enough confirmations for invalid response
            if (invalidResponseSupport == ResponseSupport.Unconfirmed) {
                return;
            }

            // delete request and fire event
            clearDocumentKeyShadowRetrievalRequest(retrievalId, request);
            emit DocumentKeyShadowRetrievalError(serverKeyId, requester);
            return;
        }

        // else error has occured during personal data retrieval
        // this could be:
        // 1) access denied error (because KS is out of sync?)
        // 2) key has became irrecoverable
        // 3) key server is cheating
        // there's currently no strong criteria - when to stop retrying to serve request
        // stopping it after first error isn't good, because this means that any KS can reject request
        // waiting for N errors isn't good, because consensus set in decryption session is constructed
        //   right after t+1 nodes have responded with AGREE => some of nodes (with bad connectivity) might be
        //   'banned' from this session forever
        // waiting for any threshold-related errors count will fail if this count is larger than N
        // => let's wait for N/2+1 errors from different nodes
        uint256 keyServerMask = uint256(1) << keyServerIndex;
        if ((request.personalRetrievalErrors & keyServerMask) != 0) {
            return;
        }
        request.personalRetrievalErrors |= keyServerMask;
        request.personalRetrievalErrorsCount += 1;

        // check if we have enough errors
        if (request.personalRetrievalErrorsCount < keyServersCount() / 2 + 1) {
            return;
        }

        // delete request and fire event
        clearDocumentKeyShadowRetrievalRequest(retrievalId, request);
        emit DocumentKeyShadowRetrievalError(serverKeyId, requester);
    }

    /// Get count of pending document key shadow retrieval requests.
    function documentKeyShadowRetrievalRequestsCount() external view returns (uint256) {
        return documentKeyShadowRetrievalRequestsKeys.length;
    }

    /// Get document key shadow retrieval request with given index.
    /// Returns: (serverKeyId, requesterPublic, isCommonRetrievalCompleted)
    function getDocumentKeyShadowRetrievalRequest(uint256 index) external view returns (bytes32, bytes, bool) {
        bytes32 retrievalId = documentKeyShadowRetrievalRequestsKeys[index];
        DocumentKeyShadowRetrievalRequest storage request = documentKeyShadowRetrievalRequests[retrievalId];
        return (
            request.serverKeyId,
            request.requesterPublic,
            request.isCommonRetrievalCompleted
        );
    }

    /// Returs true if response from given keyServer is required.
    function isDocumentKeyShadowRetrievalResponseRequired(bytes32 serverKeyId, address requester, address keyServer)
        external
        view
        returns (bool)
    {
        uint8 keyServerIndex = requireKeyServer(keyServer);
        bytes32 retrievalId = keccak256(abi.encodePacked(serverKeyId, requester));
        DocumentKeyShadowRetrievalRequest storage request = documentKeyShadowRetrievalRequests[retrievalId];
        // response is always required when personal retrieval is requested
        return request.isCommonRetrievalCompleted ||
            isResponseRequired(request.commonRetrievalResponses, keyServerIndex);
    }

    // === Administrative methods ===

    /// Set document key shadow retrieval fee.
    function setDocumentKeyShadowRetrievalFee(uint256 newFee)
        public
        onlyOwner
    {
        documentKeyShadowRetrievalFee = newFee;
    }

    /// Set document key shadow retrieval requests limit.
    function setMaxDocumentKeyShadowRetrievalRequests(uint256 newLimit)
        public
        onlyOwner
    {
        maxDocumentKeyShadowRetrievalRequests = newLimit;
    }

    /// Delete document key shadow retrieval request.
    function deleteDocumentKeyShadowRetrievalRequest(bytes32 serverKeyId, address requester)
        public
        onlyOwner
    {
        bytes32 retrievalId = keccak256(abi.encodePacked(serverKeyId, requester));
        DocumentKeyShadowRetrievalRequest storage request = documentKeyShadowRetrievalRequests[retrievalId];
        clearDocumentKeyShadowRetrievalRequest(retrievalId, request);

        emit DocumentKeyShadowRetrievalError(serverKeyId, requester);
    }

    // === Internal methods ===

    /// Clear document key shadow retrieval request traces.
    function clearDocumentKeyShadowRetrievalRequest(bytes32 retrievalId, DocumentKeyShadowRetrievalRequest storage request) private {
        for (uint i = 0; i < request.personalDataKeys.length; ++i) {
            delete request.personalData[request.personalDataKeys[i]];
        }
        clearResponses(request.commonRetrievalResponses);
        delete documentKeyShadowRetrievalRequests[retrievalId];

        removeRequestKey(documentKeyShadowRetrievalRequestsKeys, retrievalId);
    }

    /// Document key shadow retrieval fee.
    uint256 public documentKeyShadowRetrievalFee;
    /// Maximal number of active document key shadow retrieval requests. We're limiting this number to avoid
    /// infinite gas costs of some functions.
    uint256 public maxDocumentKeyShadowRetrievalRequests;

    /// Pending store requests.
    mapping (bytes32 => DocumentKeyShadowRetrievalRequest) private documentKeyShadowRetrievalRequests;
    /// Pending store requests keys.
    bytes32[] private documentKeyShadowRetrievalRequestsKeys;
}
