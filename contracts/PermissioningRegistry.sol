pragma solidity ^0.4.24;

import "./interfaces/ISecretStorePermissioning.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/introspection/ERC165.sol";


contract PermissioningRegistry is ISecretStorePermissioning, Ownable, ERC165 {

    struct PermissionEntry {
        address[] users;
        address admin;
        bool exposed;
    }
    
    mapping(bytes32 => PermissionEntry) public permissions;

    event NewAdmin(bytes32 indexed document);
    event Permission(bytes32 indexed document);

    modifier onlyAdmins(bytes32 document) {
        require(_isAdmin(document), "Caller has to be the current admin or owner.");
        _;
    }

    constructor() public {
        // ERC 165 support
        _registerInterface(this.checkPermissions.selector);
        _registerInterface(
            this.owner.selector
            ^ this.isOwner.selector
            ^ this.renounceOwnership.selector
            ^ this.transferOwnership.selector
        );
    }

    function setAdmin(bytes32 document, address newAdmin) external onlyAdmins(document) returns (bool) {
        require(newAdmin != address(0), "New admin address cannot be 0x0.");
        permissions[document].admin = newAdmin;
        emit NewAdmin(document);
        return true;
    }

    function setUsers(bytes32 document, address[] _users) external onlyAdmins(document) returns (bool) {
        permissions[document].users = _users;
        emit Permission(document);
        return true;
    }

    function setExposed(bytes32 document, bool _exposed) external onlyAdmins(document) returns (bool) {
        permissions[document].exposed = _exposed;
        emit Permission(document);
        return true;
    }

    function addUser(bytes32 document, address newUser) external onlyAdmins(document) returns (bool) {
        permissions[document].users.push(newUser);
        emit Permission(document);
        return true;
    }

    function removePermission(bytes32 document) external onlyAdmins(document) returns (bool) {
        delete permissions[document];
        emit Permission(document);
        return true;
    }

    function permission(bytes32 document, address[] _users) external returns (bool) {
        require(
            permissions[document].admin == address(0) || _isAdmin(document),
            "You have to be admin or owner to change permissions."
        );
        permissions[document].admin = msg.sender;
        permissions[document].users = _users;
        emit Permission(document);
        return true;
    }

    function checkPermissions(address user, bytes32 document) public view returns (bool) {
        if (!_isInitialized(document)) {
            return false;
        }
        
        if (permissions[document].exposed) {
            return true;
        }

        address[] storage users = permissions[document].users;
        for (uint i = 0; i < users.length; i++) {
            if (users[i] == user)
                return true;
        }
        return false;
    }

    function getAdmin(bytes32 document) public view returns (address) {
        return permissions[document].admin;
    }

    function getUsers(bytes32 document) public view returns (address[]) {
        return permissions[document].users;
    }

    function isExposed(bytes32 document) public view returns (bool) {
        return permissions[document].exposed;
    }

    function _isAdmin(bytes32 document) internal view returns (bool) {
        return (permissions[document].admin == msg.sender || isOwner());
    }

    function _isInitialized(bytes32 document) internal view returns (bool) {
        return (permissions[document].admin != address(0));
    }
}