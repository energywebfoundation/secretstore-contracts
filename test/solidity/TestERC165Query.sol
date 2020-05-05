pragma solidity ^0.6.0;

import "truffle/Assert.sol";
import "truffle/DeployedAddresses.sol";
import "@openzeppelin/contracts/introspection/IERC165.sol";
import "../../contracts/ERC165Query.sol";
import "../../contracts/PermissioningRegistry.sol";


contract TestERC165Query {

    function testQueryShouldReturnTrueOnERC165Support() public {
        ERC165Query testContract = ERC165Query(DeployedAddresses.ERC165Query());
        bool expected = true;

        Assert.equal(
            testContract.doesContractImplementInterface(
                DeployedAddresses.PermissioningRegistry(),
                bytes4(0x01ffc9a7)
            ),
            expected,
            "Should return true on a contract that supports ERC-165 standard"
        );
    }

    function testQueryShouldReturnFalseOnUnsupportedERC165() public {
        ERC165Query testContract = ERC165Query(DeployedAddresses.ERC165Query());
        bool expected = false;

        Assert.equal(
            testContract.doesContractImplementInterface(
                address(0x7c495Cc4f2c4B0bfb2dc64EE04c7D7004B7c434F),
                bytes4(0x01ffc9a7)
            ),
            expected,
            "Should return false on a contract not supporting the ERC-165 standard"
        );
    }

    function testQueryShouldReturnFalseOnUnsupportedInterface() public {
        ERC165Query testContract = ERC165Query(DeployedAddresses.ERC165Query());
        bool expected = false;

        Assert.equal(
            testContract.doesContractImplementInterface(
                DeployedAddresses.PermissioningRegistry(),
                bytes4(0x0caca9a7)
            ),
            expected,
            "Should return false on an interface query that is not implemented"
        );
    }
}
