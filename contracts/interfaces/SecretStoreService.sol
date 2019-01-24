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

pragma solidity ^0.4.24;

/// Server Key generation service contract API (client view).
interface ServerKeyGenerationServiceClientApi {
    /// When server key is generated.
    event ServerKeyGenerated(bytes32 indexed serverKeyId, bytes serverKeyPublic);
    /// When error occurs during server key generation.
    event ServerKeyGenerationError(bytes32 indexed serverKeyId);

    /// Request new server key generation. Generated key will be published via ServerKeyGenerated event when available.
    function generateServerKey(bytes32 serverKeyId, uint8 threshold) external payable;
}

/// Server Key generation service contract API (key server view).
interface ServerKeyGenerationServiceKeyServerApi {
    /// When sever key generation request is received.
    event ServerKeyGenerationRequested(bytes32 serverKeyId, address author, uint8 threshold);

    /// Called when generation is reported by key server.
    function serverKeyGenerated(bytes32 serverKeyId, bytes serverKeyPublic) external;
    /// Called when error occurs during server key generation.
    function serverKeyGenerationError(bytes32 serverKeyId) external;

    /// Get count of pending server key generation requests.
    function serverKeyGenerationRequestsCount() external view returns (uint256);
    /// Get server key generation request with given index.
    /// Returns: (serverKeyId, author, threshold)
    function getServerKeyGenerationRequest(uint256 index) external view returns (bytes32, address, uint256);
    /// Returs true if response from given keyServer is required.
    function isServerKeyGenerationResponseRequired(bytes32 serverKeyId, address keyServer) external view returns (bool);
}

/// Server Key retrieval service contract API (client view).
interface ServerKeyRetrievalServiceClientApi {
    /// When server key is retrieved.
    event ServerKeyRetrieved(bytes32 indexed serverKeyId, bytes serverKeyPublic, uint256 threshold);
    /// When error occurs during server key retrieval.
    event ServerKeyRetrievalError(bytes32 indexed serverKeyId);

    /// Retrieve existing server key. Retrieved key will be published via ServerKeyRetrieved or ServerKeyRetrievalError.
    function retrieveServerKey(bytes32 serverKeyId) external payable;
}

/// Server Key retrieval service contract API (key server view).
interface ServerKeyRetrievalServiceKeyServerApi {
    /// When sever key retrieval request is received.
    event ServerKeyRetrievalRequested(bytes32 serverKeyId);

    /// Called when retrieval is reported by key server.
    function serverKeyRetrieved(bytes32 serverKeyId, bytes serverKeyPublic, uint8 threshold) external;
    /// Called when error occurs during server key retrieval.
    function serverKeyRetrievalError(bytes32 serverKeyId) external;

    /// Get count of pending server key retrieval requests.
    function serverKeyRetrievalRequestsCount() external view returns (uint256);
    /// Get server key retrieval request with given index.
    /// Returns: (serverKeyId)
    function getServerKeyRetrievalRequest(uint256 index) external view returns (bytes32);
    /// Returs true if response from given keyServer is required.
    function isServerKeyRetrievalResponseRequired(bytes32 serverKeyId, address keyServer) external view returns (bool);
}

/// Document Key store service contract API (client view).
interface DocumentKeyStoreServiceClientApi {
    /// When document key is stored.
    event DocumentKeyStored(bytes32 indexed serverKeyId);
    /// When error occurs during document key store.
    event DocumentKeyStoreError(bytes32 indexed serverKeyId);

    /// Request document key store. Use `secretstore_generateDocumentKey` RPC to generate both
    /// `commonPoint` and `encryptedPoint`.
    function storeDocumentKey(bytes32 serverKeyId, bytes commonPoint, bytes encryptedPoint) external payable;
}

/// Document Key store service contract API (key server view).
interface DocumentKeyStoreServiceKeyServerApi {
    /// When document key store request is received.
    event DocumentKeyStoreRequested(bytes32 serverKeyId, address author, bytes commonPoint, bytes encryptedPoint);

    /// Called when store is reported by key server.
    function documentKeyStored(bytes32 serverKeyId) external;
    /// Called when error occurs during document key store.
    function documentKeyStoreError(bytes32 serverKeyId) external;

    /// Get count of pending document key store requests.
    function documentKeyStoreRequestsCount() external view returns (uint256);
    /// Get document key store request with given index.
    /// Returns: (serverKeyId, author, commonPoint, encryptedPoint)
    function getDocumentKeyStoreRequest(uint256 index) external view returns (bytes32, address, bytes, bytes);
    /// Returs true if response from given keyServer is required.
    function isDocumentKeyStoreResponseRequired(bytes32 serverKeyId, address keyServer) external view returns (bool);
}

/// Document Key shadow retrieval service contract API (client view).
interface DocumentKeyShadowRetrievalServiceClientApi {
    /// When document key common portion is retrieved. Ater this event s fired, wait for
    /// exactly `threshold+1` `DocumentKeyPersonalRetrieved` events with the same `decryptedSecret` value.
    event DocumentKeyCommonRetrieved(bytes32 indexed serverKeyId, address indexed requester, bytes commonPoint, uint8 threshold);
    /// When document key personal portion is retrieved. After enough events are fired, use `secretstore_shadowDecrypt`
    /// to decrypt document contents.
    event DocumentKeyPersonalRetrieved(bytes32 indexed serverKeyId, address indexed requester, bytes decryptedSecret, bytes shadow);
    /// When error occurs during document key retrieval.
    event DocumentKeyShadowRetrievalError(bytes32 indexed serverKeyId, address indexed requester);

    /// Request document key retrieval.
    function retrieveDocumentKeyShadow(bytes32 serverKeyId, bytes requesterPublic) external payable;
}

/// Document Key shadow retrieval service contract API (key server view).
interface DocumentKeyShadowRetrievalServiceKeyServerApi {
    /// When document key common-portion retrieval request is received.
    event DocumentKeyCommonRetrievalRequested(bytes32 serverKeyId, address requester);
    /// When document key personal-portion retrieval request is received.
    event DocumentKeyPersonalRetrievalRequested(bytes32 serverKeyId, bytes requesterPublic);

    /// Called when common data is reported by key server.
    function documentKeyCommonRetrieved(
        bytes32 serverKeyId,
        address requester,
        bytes commonPoint,
        uint8 threshold) external;
    /// Called when 'personal' data is reported by key server.
    function documentKeyPersonalRetrieved(
        bytes32 serverKeyId,
        address requester,
        uint256 participants,
        bytes decryptedSecret,
        bytes shadow) external;
    /// Called when error occurs during document key shadow retrieval.
    function documentKeyShadowRetrievalError(bytes32 serverKeyId, address requester) external;

    /// Get count of pending document key shadow retrieval requests.
    function documentKeyShadowRetrievalRequestsCount() external view returns (uint256);
    /// Get document key shadow retrieval request with given index.
    /// Returns: (serverKeyId, requesterPublic, isCommonRetrievalCompleted)
    function getDocumentKeyShadowRetrievalRequest(uint256 index) external view returns (bytes32, bytes, bool);
    /// Returs true if response from given keyServer is required.
    function isDocumentKeyShadowRetrievalResponseRequired(bytes32 serverKeyId, address keyServer, address requester)
        external
        view
        returns (bool);
}
