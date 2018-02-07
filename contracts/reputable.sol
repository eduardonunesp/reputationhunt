pragma solidity ^0.4.19;

import "zeppelin-solidity/contracts/ownership/Ownable.sol";

contract Reputable is Ownable {
    uint constant ADD_PRODUCT_FEE = 10000 wei;

    struct Product {
        string name;
        string domain;
        uint16 downVotes;
        uint16 upVotes;
        uint donatedValue;
        uint valueToRefund;
        bool closed;
        bool exists;
    }

    mapping(address => uint) public productOwner;
    Product[] public products;
    uint addingFee;

    /* EVENTS */

    event ProductAdded(uint _productId, string _name, string _domain);

    /* MODIFIERS */

    modifier includeAddingFee() {
        require(msg.value >= ADD_PRODUCT_FEE);
        _;
    }

    modifier productExists(uint _productId) {
        require(products[_productId].exists);
        _;
    }

    modifier productOpen(uint _productId) {
        Product memory product = products[_productId];
        require(!product.closed);
        _;
    }

    modifier productClosed(uint _productId) {
        Product memory product = products[_productId];
        require(product.closed);
        _;
    }

    modifier onlyProductOwner(uint _productId) {
        require(productOwner[msg.sender] == _productId);
        _;
    }

    /* CONSTRUCTOR */
    function Reputable() public
        Ownable()
    {
        Product memory product = Product({
            name: "Reputable Hunt",
            domain: "reputablehunt.ens",
            downVotes: 0,
            upVotes: 0,
            donatedValue: 0,
            valueToRefund: 0,
            closed: true,
            exists: true
        });

        uint productId = products.push(product) - 1;
        productOwner[msg.sender] = productId;
    }

    /* EXTERNALS */

    function addProduct(string _name, string _domain) external
        payable
        includeAddingFee()
    {
        Product memory product = Product({
            name: _name,
            domain: _domain,
            downVotes: 0,
            upVotes: 0,
            donatedValue: 0,
            valueToRefund: 0,
            closed: false,
            exists: true
        });

        uint productId = products.push(product) - 1;
        addingFee += msg.value;

        ProductAdded(productId, _name, _domain);
    }

    function getProduct(uint _productId) external
        view
        returns (
            string name,
            string domain,
            uint16 downVotes,
            uint16 upVotes,
            uint donatedValue,
            uint valueToRefund,
            bool closed
        )
    {
        return (
            products[_productId].name,
            products[_productId].domain,
            products[_productId].downVotes,
            products[_productId].upVotes,
            products[_productId].donatedValue,
            products[_productId].valueToRefund,
            products[_productId].closed
        );
    }
}
