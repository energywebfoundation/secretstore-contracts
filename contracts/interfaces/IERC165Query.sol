pragma solidity ^0.6.0;


interface IERC165Query {

    function doesContractImplementInterface(address _contract, bytes4 _interfaceId)
        external
        view
        returns (bool);
}
