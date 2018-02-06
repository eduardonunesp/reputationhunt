pragma solidity ^0.4.19;

import "./refundable.sol";

contract ReputationHunt is Refundable {
    string constant NAME = "REPUTATION HUNT";

    /* EXTERNALS */

    function getAddingFeeBalance() external
        view
        returns (uint)
    {
        return addingFee;
    }

    function onwerWithdraw() external
        onlyOwner()
    {
        uint addingFeeAvailable = addingFee;
        addingFee = 0;
        msg.sender.transfer(addingFeeAvailable);
    }

    function balance() external
        view
        returns(uint)
    {
        return address(this).balance;
    }
}
