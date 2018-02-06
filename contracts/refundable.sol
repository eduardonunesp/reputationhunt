pragma solidity ^0.4.19;

import "./votable.sol";

contract Refundable is Votable {
    uint constant REPUTATION_REFUND = 10000 wei;

    /* EVENTS */

    event ProductRemoved(uint _productId, address _ownerAddress);
    event WithdrawVoter(address _voterAddress, uint _amount);
    event ProductWithdraw(uint _productId, uint _valueToRefund);

    /* MODIFIERS */

    modifier allRefundsSent(uint _productId) {
        require(msg.value >= _refundCalc(_productId));
        _;
    }

    /* EXTERNALS */

    function removeProductById(uint _productId) external
        payable
        productOpen(_productId)
        productExists(_productId)
        allRefundsSent(_productId)
    {
        Product memory product = products[_productId];
        product.closed = true;
        products[_productId] = product;
        productOwner[msg.sender] = _productId;
        ProductRemoved(_productId, msg.sender);
    }

    function withdraw(uint _productId) external
        voterExists()
        productClosed(_productId)
    {
        uint refundableBalance = voters[msg.sender][_productId];
        voters[msg.sender][_productId] = 0;

        Product memory product = products[_productId];
        product.valueToRefund -= refundableBalance;
        products[_productId] = product;

        msg.sender.transfer(refundableBalance);
        WithdrawVoter(msg.sender, refundableBalance);
        ProductWithdraw(_productId, product.valueToRefund);
    }


    function productOwnerWithdraw(uint _productId) external
        onlyProductOwner(_productId)
    {
        Product memory product = products[_productId];
        uint donatedValue = product.donatedValue;
        product.donatedValue = 0;
        msg.sender.transfer(donatedValue);
    }

    function refundableBalance() external
        voterExists()
        view
        returns(uint)
    {
        uint refundableTotal = 0;
        for (uint i = 0; i < products.length; i++) {
            if (products[i].closed) {
                refundableTotal += voters[msg.sender][i];
            }
        }

        return refundableTotal;
    }

    function getRefundFeeCalc(uint _productId) external
        view
        returns(uint)
    {
        return _refundCalc(_productId);
    }

    /* PRIVATES */

    function _refundCalc(uint _productId) private
        view
        returns (uint)
    {
        Product memory product = products[_productId];
        int calcResult = int(product.valueToRefund - product.donatedValue);
        if (calcResult <= 0) {
            return 0;
        } else {
            return uint(calcResult);
        }
    }
}
