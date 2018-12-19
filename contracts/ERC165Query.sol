pragma solidity ^0.4.24;

import "./interfaces/IERC165Query.sol";
import "openzeppelin-solidity/contracts/introspection/ERC165Checker.sol";
import "openzeppelin-solidity/contracts/introspection/ERC165.sol";


contract ERC165Query is IERC165Query, ERC165 {

    constructor() public {
        _registerInterface(this.doesContractImplementInterface.selector);
    }

    function doesContractImplementInterface(address _contract, bytes4 _interfaceId) external view returns (bool) {
        return ERC165Checker._supportsInterface(_contract, _interfaceId);
    }
}

