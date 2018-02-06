pragma solidity ^0.4.19;

import "./reputable.sol";

contract Votable is Reputable {
    function downVote(uint _productId) public
        payable
        productExits(_productId)
        includeDownVoteFee()
    {
        uint voterId = voterIdByAddress[msg.sender];
        if (voterId == 0) {
            voterId = voters.push(Voter(REPUTATION_REFUND)) - 1;
            downVoters[_productId].push(voterId);
        }
    }
}
