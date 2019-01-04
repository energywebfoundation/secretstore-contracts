//! The KeyServerSet contract.
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

/// Simple key server set.
interface KeyServerSet {
    /// Get number of block when current set has been changed last time.
    function getCurrentLastChange() external view returns (uint256);
    /// Get index of given key server in current set.
    function getCurrentKeyServerIndex(address keyServer) external view returns (uint8);
    /// Get count of key servers in current set.
    function getCurrentKeyServersCount() external view returns (uint8);
    /// Get address of key server in current set.
    function getCurrentKeyServer(uint8 index) external view returns (address);

    /// Get all current key servers.
    function getCurrentKeyServers() external view returns (address[]);
    /// Get current key server public key.
    function getCurrentKeyServerPublic(address keyServer) external view returns (bytes);
    /// Get current key server address.
    function getCurrentKeyServerAddress(address keyServer) external view returns (string);
}

/// Key server set with migration support.
interface KeyServerSetWithMigration {
    /// When new server is added to new set.
    event KeyServerAdded(address keyServer);
    /// When existing server is removed from new set.
    event KeyServerRemoved(address keyServer);
    /// When migration is started.
    event MigrationStarted();
    /// When migration is completed.
    event MigrationCompleted();

    /// Get number of block when current set has been changed last time.
    function getCurrentLastChange() external view returns (uint256);
    /// Get index of given key server in current set.
    function getCurrentKeyServerIndex(address keyServer) external view returns (uint8);
    /// Get count of key servers in current set.
    function getCurrentKeyServersCount() external view returns (uint8);
    /// Get address of key server in current set.
    function getCurrentKeyServer(uint8 index) external view returns (address);

    /// Get all current key servers.
    function getCurrentKeyServers() external view returns (address[]);
    /// Get current key server public key.
    function getCurrentKeyServerPublic(address keyServer) external view returns (bytes);
    /// Get current key server address.
    function getCurrentKeyServerAddress(address keyServer) external view returns (string);

    /// Get all migration key servers.
    function getMigrationKeyServers() external view returns (address[]);
    /// Get migration key server public key.
    function getMigrationKeyServerPublic(address keyServer) external view returns (bytes);
    /// Get migration key server address.
    function getMigrationKeyServerAddress(address keyServer) external view returns (string);

    /// Get all new key servers.
    function getNewKeyServers() external view returns (address[]);
    /// Get new key server public key.
    function getNewKeyServerPublic(address keyServer) external view returns (bytes);
    /// Get new key server address.
    function getNewKeyServerAddress(address keyServer) external view returns (string);

    /// Get migration id.
    function getMigrationId() external view returns (bytes32);
    /// Get migration master.
    function getMigrationMaster() external view returns (address);
    /// Is migration confirmed by given node?
    function isMigrationConfirmed(address keyServer) external view returns (bool);
    /// Start migration.
    function startMigration(bytes32 id) external;
    /// Confirm migration.
    function confirmMigration(bytes32 id) external;
}
