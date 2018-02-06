pragma solidity ^0.4.19;

import "./reputable.sol";

contract Votable is Reputable {
    uint constant REPUTATION_FEE = 10000 wei;

    mapping(address => mapping(uint => uint)) voters;          // voterAddress => (productId => valueToRefund)
    mapping(address => mapping(uint => bool)) existingVotings; // voterAddress => (productId => bool)
    mapping(address => bool) existingVoters;

    /* EVENTS */

    event DownVote(uint _productId, address _voterAddress);
    event UpVote(uint _productId, address _voterAddress);

    /* MODIFIERS */

    modifier voterExists() {
        require(_isVoterExists(msg.sender));
        _;
    }

    modifier notVotedYet(uint _productId) {
        require(!_alreadyVotedForProduct(_productId, msg.sender));
        _;
    }

    modifier includeVoteFee() {
        require(msg.value >= REPUTATION_FEE);
        _;
    }

    /* EXTERNALS */

    function downVote(uint _productId) external
        payable
        notVotedYet(_productId)
        productExists(_productId)
        productOpen(_productId)
        includeVoteFee()
    {
        _setRefundableBalance(msg.sender, _productId, REPUTATION_FEE);
        _processDownVoteForProduct(_productId);
        _setVoterForProduct(_productId, msg.sender);
        DownVote(_productId, msg.sender);
    }

    function upVote(uint _productId) external
        payable
        notVotedYet(_productId)
        productOpen(_productId)
        productExists(_productId)
        includeVoteFee()
    {
        _processUpVoteForProduct(_productId);
        _setVoterForProduct(_productId, msg.sender);
        UpVote(_productId, msg.sender);
    }

    /* PRIVATES */
    function _setVoterForProduct(uint _productId, address _voterAddress) private {
        existingVotings[_voterAddress][_productId] = true;
        _setVoterExists(_voterAddress);
    }

    function _alreadyVotedForProduct(uint _productId, address _voterAddress) private
        view
        returns (bool)
    {
        return existingVotings[_voterAddress][_productId];
    }

    function _setVoterExists(address _voterAddress) private {
        existingVoters[_voterAddress] = true;
    }

    function _isVoterExists(address _voterAddress) private
        view
        returns (bool)
    {
        return existingVoters[_voterAddress];
    }

    function _setRefundableBalance(address _voterAddress, uint _productId, uint refundableBalance) private {
        voters[_voterAddress][_productId] = refundableBalance;
    }

    function _processDownVoteForProduct(uint _productId) private {
        Product memory product = products[_productId];
        product.downVotes++;
        product.valueToRefund += REPUTATION_FEE;
        products[_productId] = product;
    }

    function _processUpVoteForProduct(uint _productId) private {
        Product memory product = products[_productId];
        product.donatedValue += REPUTATION_FEE;
        product.upVotes++;
        products[_productId] = product;
    }
}
