"use client";
import React, { useState, useEffect } from "react";
import { createWallet, walletConnect } from "thirdweb/wallets";
import { client } from "./provider";
import { useDisconnect, useActiveWallet, ConnectButton } from "thirdweb/react";
import { base } from "thirdweb/chains";
import { getContract } from "thirdweb";
import { prepareContractCall, resolveMethod } from "thirdweb";
import { useCallsStatus, TransactionButton } from "thirdweb/react";

const wallets = [
  createWallet("com.coinbase.wallet",{
    walletConfig:{
      options: "smartWalletOnly"
    }
  }),
  createWallet("io.metamask"),
  createWallet("me.rainbow"),
  walletConnect(),
];

// connect to your contract
const contract = getContract({
  client,
  chain: base,
  address: "0x65aA38c6e3569D18bb1160Fa89a430A87AF74B6B",
});

export default function App() {
  const wallet = useActiveWallet();
  const [txHash, setTxHash] = useState(null);
  const [error, setError] = useState(null);
  const recipient = wallet?.getAccount().address;
  const Names = [
    "Alice",
    "Bob",
    "Claire",
    "David",
    "Emma",
    "Frank",
    "Grace",
    "Henry",
    "Isabel",
    "Jack",
    "Kate",
    "Liam",
    "Megan",
    "Noah",
    "Olivia",
    "Peter",
    "Quinn",
    "Rachel",
    "Sam",
    "Tina",
    "Victor",
    "Wendy",
    "Xavier",
    "Yvonne",
    "Zach",
    "Anna",
    "Ben",
    "Cindy",
    "Daniel",
    "Emily",
    "Felix",
    "Georgia",
    "Ivan",
    "Holly",
    "Jake",
    "Kelly",
    "Lucy",
    "Mike",
    "Natalie",
    "Oscar",
    "Penny",
    "Ryan",
    "Sarah",
    "Tom",
    "Violet",
    "Will",
    "Zoe",
    "Adam",
    "Bella",
    "Chris",
    "Dana",
    "Eric",
    "Fiona",
    "Greg",
    "Hannah",
    "Ian",
    "Jasmine",
    "Kyle",
    "Laura",
    "Matt",
    "Nicole",
    "Owen",
    "Paige",
    "Rob",
    "Stacy",
    "Tim",
    "Vanessa",
    "Alex",
    "Beth",
    "Cody",
    "Diana",
    "Evan",
    "Fiona",
    "Gary",
    "Heather",
    "Isaac",
    "Jane",
    "Kevin",
    "Lily",
    "Mark",
    "Nora",
    "Owen",
    "Paige",
    "Roger",
    "Stella",
    "Tyler",
    "Wendy",
    "Alan",
    "Bridget",
    "Cole",
    "Emma",
    "Gavin",
    "Haley",
    "Ian",
    "Julia",
    "Keith",
    "Lisa",
    "Max",
    "Olivia",
    "Paul",
    "Alice",
    "Bob",
    "Claire",
    "David",
    "Emma",
    "Frank",
    "Grace",
    "Henry",
    "Isabel",
    "Jack",
    "Kate",
    "Liam",
    "Megan",
    "Noah",
    "Olivia",
    "Peter",
    "Quinn",
    "Rachel",
    "Sam",
    "Tina",
    "Victor",
    "Wendy",
    "Xavier",
    "Yvonne",
    "Zach",
    "Anna",
    "Ben",
    "Cindy",
    "Daniel",
    "Emily",
    "Felix",
    "Georgia",
    "Ivan",
    "Holly",
    "Jake",
    "Kelly",
    "Lucy",
    "Mike",
    "Natalie",
    "Oscar",
    "Penny",
    "Ryan",
    "Sarah",
    "Tom",
    "Violet",
    "Will",
    "Zoe",
    "Adam",
    "Bella",
    "Chris",
    "Dana",
    "Eric",
    "Fiona",
    "Greg",
    "Hannah",
    "Ian",
    "Jasmine",
    "Kyle",
    "Laura",
    "Matt",
    "Nicole",
    "Owen",
    "Paige",
    "Rob",
    "Stacy",
    "Tim",
    "Vanessa",
    "Alex",
    "Beth",
    "Cody",
    "Diana",
    "Evan",
    "Fiona",
    "Gary",
    "Heather",
    "Isaac",
    "Jane",
    "Kevin",
    "Lily",
    "Mark",
    "Nora",
    "Owen",
    "Paige",
    "Roger",
    "Stella",
    "Tyler",
    "Wendy",
    "Alan",
    "Bridget",
    "Cole",
    "Emma",
    "Gavin",
    "Haley",
    "Ian",
    "Julia",
    "Keith",
    "Lisa",
    "Max",
    "Olivia",
    "Paul",
    "Alice",
    "Bob",
    "Claire",
    "David",
    "Emma",
    "Frank",
    "Grace",
    "Henry",
    "Isabel",
    "Jack",
    "Kate",
    "Liam",
    "Megan",
    "Noah",
    "Olivia",
    "Peter",
    "Quinn",
    "Rachel",
    "Sam",
    "Tina",
    "Victor",
    "Wendy",
    "Xavier",
    "Yvonne",
    "Zach",
    "Anna",
    "Ben",
    "Cindy",
    "Daniel",
    "Emily",
    "Felix",
    "Georgia",
    "Ivan",
    "Holly",
    "Jake",
    "Kelly",
    "Lucy",
    "Mike",
    "Natalie",
    "Oscar",
    "Penny",
    "Ryan",
    "Sarah",
    "Tom",
    "Violet",
    "Will",
    "Zoe",
    "Adam",
    "Bella",
    "Chris",
    "Dana",
    "Eric",
    "Fiona",
    "Greg",
    "Hannah",
    "Ian",
    "Jasmine",
    "Kyle",
    "Laura",
    "Matt",
    "Nicole",
    "Owen",
    "Paige",
    "Rob",
    "Stacy",
    "Tim",
    "Vanessa",
    "Alex",
    "Beth",
    "Cody",
    "Diana",
    "Evan",
    "Fiona",
    "Gary",
    "Heather",
    "Isaac",
    "Jane",
    "Kevin",
    "Lily",
    "Mark",
    "Nora",
    "Owen",
    "Paige",
    "Roger",
    "Stella",
    "Tyler",
    "Wendy",
    "Alan",
    "Bridget",
    "Cole",
    "Emma",
    "Gavin",
    "Haley",
    "Ian",
    "Julia",
    "Keith",
    "Lisa",
    "Max",
    "Olivia",
    "Paul",
  ];

  const svgName = Names.concat(Names.slice(0, Names.length / 2)); // length 450

  return (
    <>
      <ConnectButton
        client={client}
        wallets={wallets}
        theme={"light"}
        chain={base}
      />
      {/* <button onClick={send}>Send</button> */}
      <div className="flex flex-col gap-4">
        <TransactionButton
          payModal={false}
          transaction={async () => {
            return prepareContractCall({
              contract,
              method:
                "function mintNFT(address recipient, string svgName, string emotion)",
              params: [recipient, svgName[0], svgName[0]],
            });
          }}
          onTransactionSent={(result) => {
            console.log("Transaction submitted", result.transactionHash);
          }}
          onTransactionConfirmed={(receipt) => {
            console.log("Transaction confirmed", receipt.transactionHash);
            setTxHash(receipt.transactionHash);
          }}
          onError={(error) => {
            console.error("Transaction error", error);
            setError(error.message);
          }}
          style={{ width: "200px", marginTop: "10px" }}
        >
          Confirm Transaction
        </TransactionButton>
        {error && <div style={{ color: "red" }}>{error}</div>}
        {txHash && (
          <a
            style={{
              color: "#28a745",
              marginTop: "10px",
              display: "inline-block",
              marginLeft: "10px",
            }}
            target="_blank"
            href={`https://base-sepolia.blockscout.com/tx/${txHash}`}
          >
            Success !! View on Basescan
          </a>
        )}
      </div>
    </>
  );
}
