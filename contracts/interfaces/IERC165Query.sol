pragma solidity ^0.4.24;


contract IERC165Query {

    function doesContractImplementInterface(address _contract, bytes4 _interfaceId) external view returns (bool);
}