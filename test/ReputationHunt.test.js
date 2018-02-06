const ReputationHunt = artifacts.require('ReputationHunt');

const JSONLog = (log) => console.log(JSON.stringify(log, null, 2));

contract('ReputationHunt', accounts => {
  let instance;
  const nonExistingProductId = 666;
  const productId = 1;
  const productName = 'Some Product';
  const productDomain = 'someproduct.com';

  beforeEach(async () => {
    instance = await ReputationHunt.deployed();
  });

  const buildAssertions = (transactionResult) => {
    return {
      assertTransaction: () => (
        assert(transactionResult.receipt.status, "0x1", "Transaction failed")
      ),
      assertTransactionFailed: () => (
        assert(transactionResult.receipt.status, "0x0", "Transaction worked")
      ),
      assertEventFired: (eventName) => {
        const event = transactionResult.logs.find(log => log.event === eventName);
        assert.equal(!!event, true, `Event ${eventName} didn't happened`);
      },
      assertEventVar: (eventName, eventVar, equalVar) => {
        const event = transactionResult.logs.find(log => log.event === eventName);
        assert.equal(event.args[eventVar], equalVar, `Event ${event.args[eventVar]} didn't happened`);
      }
    }
  }

  it('should deploy', async () => {
    assert.ok(instance);
  });

  it('should create a new product', async () => {
    const transaction = await instance.addProduct(productName, productDomain, { value: '10000', from: accounts[0] });
    const assertions = buildAssertions(transaction);
    assertions.assertTransaction();
    assertions.assertEventFired('ProductAdded');
    assertions.assertEventVar('ProductAdded', '_productId', productId);
    assertions.assertEventVar('ProductAdded', '_name', productName);
    assertions.assertEventVar('ProductAdded', '_domain', productDomain);
  });

  it('should not down vote the nonexisting again with account 1', async () => {
    let isErr = false;
    try {
      const transaction = await instance.downVote(nonExistingProductId, { value: '10000', from: accounts[1] });
      if (transaction.receipt.status == 0x0) {
        isErr = true;
      }
    } catch (err) {
      isErr = true;
    }

    assert.ok(isErr, true);
  });

  it('should not vote without send the fee', async () => {
    let isErr = false;
    try {
      const transaction = await instance.downVote(nonExistingProductId, { value: '9999', from: accounts[1] });
      if (transaction.receipt.status == 0x0) {
        isErr = true;
      }
    } catch (err) {
      isErr = true;
    }

    assert.ok(isErr, true);

    isErr = false;

    try {
      const transaction = await instance.upVote(nonExistingProductId, { value: '9999', from: accounts[1] });
      if (transaction.receipt.status == 0x0) {
        isErr = true;
      }
    } catch (err) {
      isErr = true;
    }

    assert.ok(isErr, true)
  });

  it('should down vote the product 0 with account index 1', async () => {
    const transaction = await instance.downVote(productId, { value: '10000', from: accounts[1] });
    const assertions = buildAssertions(transaction);
    assertions.assertTransaction();
    assertions.assertEventFired('DownVote');
    assertions.assertEventVar('DownVote', '_productId', productId);
  });

  it('should down vote the product 0 with account index 2', async () => {
    const transaction = await instance.downVote(productId, { value: '10000', from: accounts[2] });
    const assertions = buildAssertions(transaction);
    assertions.assertTransaction();
    assertions.assertEventFired('DownVote');
    assertions.assertEventVar('DownVote', '_productId', productId);
  });

  it('should up vote the product 0 with account index 4', async () => {
    const transaction = await instance.upVote(productId, { value: '10000', from: accounts[4] });
    const assertions = buildAssertions(transaction);
    assertions.assertTransaction();
    assertions.assertEventFired('UpVote');
    assertions.assertEventVar('UpVote', '_productId', productId);
  });

  it('should down vote the product 0 with account index 3', async () => {
    const transaction = await instance.downVote(productId, { value: '10000', from: accounts[3] });
    const assertions = buildAssertions(transaction);
    assertions.assertTransaction();
    assertions.assertEventFired('DownVote');
    assertions.assertEventVar('DownVote', '_productId', productId);
  });

  it('should not down vote the product 0 again with account index 1', async () => {
    let isErr = false;
    try {
      const transaction = await instance.downVote(productId, { value: '10000', from: accounts[1] });
      if (transaction.receipt.status == 0x0) {
        isErr = true;
      }
    } catch (err) {
      isErr = true;
    }

    assert.ok(isErr, true);
  });

  it('should not up vote the product 0 again with account index 4', async () => {
    let isErr = false;
    try {
      const transaction = await instance.downVote(productId, { value: '10000', from: accounts[4] });
      if (transaction.receipt.status == 0x0) {
        isErr = true;
      }
    } catch (err) {
      isErr = true;
    }

    assert.ok(isErr, true);
  });

  it('reputation balance should be 40000', async () => {
    const result = await instance.balance.call({ from: accounts[0] });
    assert.ok(result.toNumber(), 40000);
  });

  it('non voter trying to withdraw', async () => {
    let isErr = false;
    try {
      const transaction = await instance.withdraw(productId, { from: accounts[5] });
      if (transaction.receipt.status == 0x0) {
        isErr = true;
      }
    } catch (err) {
      isErr = true;
    }

    assert.ok(isErr, true);
  });

  it('refundable balance for account index 2 should be 0', async () => {
    assert.equal(await instance.refundableBalance.call({ from: accounts[2] }), 0);
  });

  it('balance of the adding fee should be 10000', async () => {
    assert.equal(await instance.getAddingFeeBalance.call({ from: accounts[0]}), 10000);
  });

  it('remove fee should be 20000', async () => {
    assert.equal(await instance.getRefundFeeCalc.call(productId), 20000);
  });

  it('get product details', async () => {
    const [name, domain, downVotes, upVotes, donations, refunds, closed] = await instance.getProduct.call(productId);
    assert.equal(upVotes, 1);
    assert.equal(downVotes, 3);
    assert.equal(donations, 10000);
    assert.equal(refunds, 30000);
    assert.equal(closed, false);
  });

  it('cannot pay the all the fee to remove', async () => {
    let isErr = false;
    try {
      const transaction = await instance.removeProductById(productId, { value: '10000', from: accounts[0] });
      if (transaction.receipt.status == 0x0) {
        isErr = true;
      }
    } catch (err) {
      isErr = true;
    }

    assert.ok(isErr, true);
  });

  it('should pay the all the fee to remove and cleanup', async () => {
    const transaction = await instance.removeProductById(productId, { value: '20000', from: accounts[8] });
    const assertions = buildAssertions(transaction);
    assertions.assertTransaction();
    assertions.assertEventFired('ProductRemoved');
    assertions.assertEventVar('ProductRemoved', '_productId', productId);
    assertions.assertEventVar('ProductRemoved', '_ownerAddress', accounts[8]);
  });

  it('get product details', async () => {
    const [name, domain, downVotes, upVotes, donations, refunds, closed] = await instance.getProduct.call(productId);
    assert.equal(upVotes, 1);
    assert.equal(downVotes, 3);
    assert.equal(donations, 10000);
    assert.equal(refunds, 30000);
    assert.equal(closed, true);
  });

  it('refundable balance for accounts should 10000 for accounts indexes 1, 2 and 3', async () => {
    assert.equal(await instance.refundableBalance.call({ from: accounts[1] }), 10000);
    assert.equal(await instance.refundableBalance.call({ from: accounts[2] }), 10000);
    assert.equal(await instance.refundableBalance.call({ from: accounts[3] }), 10000);
  });

  it('non voter trying to withdraw again', async () => {
    let isErr = false;
    try {
      const transaction = await instance.withdraw({ from: accounts[5] });
      if (transaction.receipt.status == 0x0) {
        isErr = true;
      }
    } catch (err) {
      isErr = true;
    }

    assert.ok(isErr, true);
  });

  it('should withdraw values from account 1', async() => {
    const transaction = await instance.withdraw(productId, { from: accounts[1] });
    const assertions = buildAssertions(transaction);
    assertions.assertTransaction();
    assertions.assertEventFired('WithdrawVoter');
    assertions.assertEventVar('WithdrawVoter', '_amount', 10000);
    assertions.assertEventVar('ProductWithdraw', '_productId', productId);
    assertions.assertEventVar('ProductWithdraw', '_valueToRefund', 20000);

    const transaction2 = await instance.withdraw(productId, { from: accounts[1] });
    const assertions2 = buildAssertions(transaction2);
    assertions2.assertTransaction();
    assertions2.assertEventVar('WithdrawVoter', '_amount', 0);
    assertions.assertEventVar('ProductWithdraw', '_productId', productId);
    assertions.assertEventVar('ProductWithdraw', '_valueToRefund', 20000);
  });

  it('should withdraw values from account 2', async () => {
    const transaction = await instance.withdraw(productId, { from: accounts[2] });
    const assertions = buildAssertions(transaction);
    assertions.assertTransaction();
    assertions.assertEventFired('WithdrawVoter');
    assertions.assertEventVar('WithdrawVoter', '_amount', 10000);
    assertions.assertEventVar('ProductWithdraw', '_productId', productId);
    assertions.assertEventVar('ProductWithdraw', '_valueToRefund', 10000);

    const transaction2 = await instance.withdraw(productId, { from: accounts[2] });
    const assertions2 = buildAssertions(transaction2);
    assertions2.assertTransaction();
    assertions2.assertEventVar('WithdrawVoter', '_amount', 0);
    assertions2.assertEventVar('ProductWithdraw', '_productId', productId);
    assertions2.assertEventVar('ProductWithdraw', '_valueToRefund', 10000);
  });

  it('should withdraw values from account 3', async () => {
    const transaction = await instance.withdraw(productId, { from: accounts[3] });
    const assertions = buildAssertions(transaction);
    assertions.assertTransaction();
    assertions.assertEventFired('WithdrawVoter');
    assertions.assertEventVar('WithdrawVoter', '_amount', 10000);
    assertions.assertEventVar('ProductWithdraw', '_productId', productId);
    assertions.assertEventVar('ProductWithdraw', '_valueToRefund', 0);

    const transaction2 = await instance.withdraw(productId, { from: accounts[3] });
    const assertions2 = buildAssertions(transaction2);
    assertions2.assertTransaction();
    assertions2.assertEventVar('WithdrawVoter', '_amount', 0);
    assertions2.assertEventVar('ProductWithdraw', '_productId', productId);
    assertions2.assertEventVar('ProductWithdraw', '_valueToRefund', 0);
  });

  it('reputation balance should be 10000', async () => {
    const result = await instance.getAddingFeeBalance.call({ from: accounts[0] });
    assert.ok(result.toNumber(), 10000);
  });

  it('non owner cannot withdraw adding fee', async () => {
    let isErr = false;
    try {
      const transaction = await instance.onwerWithdraw({ from: accounts[5] });
      if (transaction.receipt.status == 0x0) {
        isErr = true;
      }
    } catch (err) {
      isErr = true;
    }

    assert.ok(isErr, true);
  });

  it('owner withdraw adding fee', async () => {
    const transaction = await instance.onwerWithdraw({ from: accounts[0] });
    const assertions = buildAssertions(transaction);
    assertions.assertTransaction();
  });

  it('reputation balance should be 0', async () => {
    const result = await instance.balance.call({ from: accounts[0] });
    assert.ok(result.toNumber(), 0);
  });

  it('should not down vote the product 0 is closed', async () => {
    let isErr = false;
    try {
      const transaction = await instance.downVote(productId, { value: '10000', from: accounts[6] });
      if (transaction.receipt.status == 0x0) {
        isErr = true;
      }
    } catch (err) {
      isErr = true;
    }

    assert.ok(isErr, true);
  });

  it('should not up vote the product 0 is closed', async () => {
    let isErr = false;
    try {
      const transaction = await instance.upVote(productId, { value: '10000', from: accounts[7] });
      if (transaction.receipt.status == 0x0) {
        isErr = true;
      }
    } catch (err) {
      isErr = true;
    }

    assert.ok(isErr, true);
  });


  it('get product details again', async () => {
    const [name, domain, downVotes, upVotes, donations, refunds, closed] = await instance.getProduct.call(productId);
    assert.equal(upVotes, 1);
    assert.equal(downVotes, 3);
    assert.equal(donations, 10000);
    assert.equal(refunds, 0);
    assert.equal(closed, true);
  });

  it('should not withdraw donation of the wrong owner', async () => {
    let isErr = false;
    try {
      const transaction = await instance.productOwnerWithdraw(productId, { from: accounts[7] });
      if (transaction.receipt.status == 0x0) {
        isErr = true;
      }
    } catch (err) {
      isErr = true;
    }

    assert.ok(isErr, true);
  });

  it('product owner can withdraw the donations', async () => {
    const transaction = await instance.productOwnerWithdraw(productId, { from: accounts[8] });
    const assertions = buildAssertions(transaction);
    assertions.assertTransaction();
  });
});
