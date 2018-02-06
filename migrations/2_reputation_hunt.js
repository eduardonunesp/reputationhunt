const ReputationHunt = artifacts.require("./ReputationHunt.sol");

module.exports = async deployer => {
  await deployer.deploy(ReputationHunt);
};
