module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 8545,
      network_id: "*", // Match any network id
      gas: 4712388 // Gas limit used for deploys
    },
    rinkeby: {
      host: "127.0.0.1", // Connect to geth on the specified
      port: 8545,
      from: "0x7B542c1f86A16894711BbAA5B053210918508950", // default address to use for any transaction Truffle makes during migrations
      network_id: 4,
      gas: 4712388 // Gas limit used for deploys
    }
  },
  rpc: {
    host: "127.0.0.1",
    port: 8545
  }
};
