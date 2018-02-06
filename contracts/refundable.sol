pragma solidity ^0.4.19;

import "./votable.sol";

contract Refundable is Votable {
    modifier allRefundsSent(uint _productId) {
        require(msg.value >= _countDownVoters(_productId) * (REPUTATION_FEE + REPUTATION_REFUND));
        _;
    }
    
    modifier voterExists() {
        require(voterIdByAddress[msg.sender] != 0);
        _;
    }
    
    function removeProductById(uint _productId) public 
        payable
        allRefundsSent(_productId)
    {
        Product memory product = products[_productId];
        product.closed = true;
        products[_productId] = product;
        
        _refundDownVoters(_productId);
    }
    
    function _refundDownVoters(uint _productId) private {
        for (uint i = 0; i < _getAllDownVoters(_productId).length; i++) {
            Voter storage voter = voters[i];
            voter.refundableBalance += (REPUTATION_FEE + REPUTATION_REFUND);
        }
    }
    
    function _countDownVoters(uint _productId) private view returns (uint) {
        return downVoters[_productId].length;
    }
    
    function _getAllDownVoters(uint _productId) private view returns (uint[]) {
        return downVoters[_productId];
    }
    
    function withdraw() external 
        voterExists()
    {
        uint voterId = voterIdByAddress[msg.sender];
        Voter memory voter = voters[voterId];
        voter.refundableBalance = 0;
        msg.sender.transfer(voter.refundableBalance);
    }
}
