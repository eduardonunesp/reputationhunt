pragma solidity ^0.4.19;

contract Reputable {
    uint constant REPUTATION_FEE = 10000 wei;
    uint constant REPUTATION_REFUND = 10000 wei;
    
    struct Product {
        string name;
        string domain;
        uint16 downVotes;
        bool closed;
        bool exists;
    }
    
    struct Voter {
        uint refundableBalance;
    }

    Product[] public products;
    Voter[] public voters;
    
    mapping(address => uint) voterIdByAddress;
    mapping(uint => address) adder;
    mapping(uint => uint[]) downVoters; // producdId => VoterId[]
    
    modifier includeAddingFee() {
        require(msg.value >= REPUTATION_FEE);
        _;
    }
    
    modifier includeDownVoteFee() {
        require(msg.value >= REPUTATION_FEE);
        _;
    }
    
    modifier productExits(uint _productId) {
        require(products[_productId].exists);
        _;
    }
    
    function addProduct(string _name, string _domain) public 
        payable
        includeAddingFee()
    {
        Product memory product = Product({
            name: _name,
            domain: _domain,
            downVotes: 0,
            closed: false,
            exists: true
        });

        uint productId = products.push(product) - 1;
        adder[productId] = msg.sender;
    }
}
