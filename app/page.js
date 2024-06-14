"use client";
import React, { useState, useEffect } from "react";
import { createWallet, walletConnect } from "thirdweb/wallets";
import { client } from "./provider";
import { useDisconnect, useActiveWallet, ConnectButton } from "thirdweb/react";
import { baseSepolia } from "thirdweb/chains";
import { getContract } from "thirdweb";
import { prepareContractCall, resolveMethod } from "thirdweb";
import { useCallsStatus, TransactionButton } from "thirdweb/react";

const wallets = [
  createWallet("com.coinbase.wallet"),
  createWallet("io.metamask"),
  createWallet("me.rainbow"),
  walletConnect(),
];

// connect to your contract
const contract = getContract({
  client,
  chain: baseSepolia,
  address: "0xe9A518fEC8E3c756BC44B47351D5780C4b74f200",
});

export default function App() {
  const wallet = useActiveWallet();
  const [txHash, setTxHash] = useState(null);
  const [error, setError] = useState(null);
  return (
    <>
      <ConnectButton
        client={client}
        wallets={wallets}
        theme={"light"}
        chain={baseSepolia}
      />
      <div className="flex flex-col gap-4">
        <TransactionButton
          transaction={() => {
            const tx = prepareContractCall({
              contract,
              method: resolveMethod("mintNFT"),
              params: [wallet.getAccount().address, "smiley", "happy"],
            });
            return tx;
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
          style={{ width: "200px",
            marginTop: "10px",
           }}
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
