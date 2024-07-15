"use client";
import React, { useState, useEffect } from "react";
import { createWallet, walletConnect } from "thirdweb/wallets";
import { client } from "./provider";
import { useActiveWallet, ConnectButton } from "thirdweb/react";
import { base } from "thirdweb/chains";
import { getContract, readContract, resolveMethod } from "thirdweb";
import { prepareContractCall } from "thirdweb";
import { LinkdropP2P } from "linkdrop-p2p-sdk";
import axios from "axios";
import { approve } from "thirdweb/extensions/erc721";
import { decodeFunctionData } from "viem";
import crypto from "crypto";
import { sendCalls, getCallsStatus } from "thirdweb/wallets/eip5792";
const escrowContractABI = [
  {
    inputs: [{ internalType: "address", name: "relayer_", type: "address" }],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "sender",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "token",
        type: "address",
      },
      {
        indexed: false,
        internalType: "address",
        name: "transferId",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint8",
        name: "tokenType",
        type: "uint8",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint128",
        name: "amount",
        type: "uint128",
      },
    ],
    name: "Cancel",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "sender",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "token",
        type: "address",
      },
      {
        indexed: false,
        internalType: "address",
        name: "transferId",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint120",
        name: "expiration",
        type: "uint120",
      },
      {
        indexed: false,
        internalType: "uint8",
        name: "tokenType",
        type: "uint8",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint128",
        name: "amount",
        type: "uint128",
      },
      {
        indexed: false,
        internalType: "address",
        name: "feeToken",
        type: "address",
      },
      { indexed: false, internalType: "uint128", name: "fee", type: "uint128" },
    ],
    name: "Deposit",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "previousOwner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "newOwner",
        type: "address",
      },
    ],
    name: "OwnershipTransferred",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "sender",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "token",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "receiver",
        type: "address",
      },
      {
        indexed: false,
        internalType: "address",
        name: "transferId",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint8",
        name: "tokenType",
        type: "uint8",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint128",
        name: "amount",
        type: "uint128",
      },
    ],
    name: "Redeem",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "sender",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "token",
        type: "address",
      },
      {
        indexed: false,
        internalType: "address",
        name: "transferId",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint8",
        name: "tokenType",
        type: "uint8",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint128",
        name: "amount",
        type: "uint128",
      },
    ],
    name: "Refund",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint128",
        name: "claimFee",
        type: "uint128",
      },
      {
        indexed: false,
        internalType: "uint128",
        name: "depositFee",
        type: "uint128",
      },
    ],
    name: "UpdateFees",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "relayer",
        type: "address",
      },
      { indexed: false, internalType: "bool", name: "active", type: "bool" },
    ],
    name: "UpdateRelayer",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "feeReceiver",
        type: "address",
      },
      {
        indexed: false,
        internalType: "address",
        name: "token_",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "WithdrawFees",
    type: "event",
  },
  {
    inputs: [],
    name: "EIP712_DOMAIN_TYPEHASH",
    outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "_DOMAIN_SEPARATOR",
    outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "_TRANSFER_TYPE_HASH",
    outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "", type: "address" }],
    name: "accruedFees",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "token_", type: "address" },
      { internalType: "address", name: "transferId_", type: "address" },
    ],
    name: "cancel",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes", name: "data_", type: "bytes" }],
    name: "decodeOnERC721ReceivedData",
    outputs: [
      { internalType: "address", name: "transferId", type: "address" },
      { internalType: "uint120", name: "expiration", type: "uint120" },
      { internalType: "uint128", name: "feeAmount", type: "uint128" },
      { internalType: "bytes", name: "feeAuthorization", type: "bytes" },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "token_", type: "address" },
      { internalType: "address", name: "transferId_", type: "address" },
      { internalType: "uint256", name: "tokenId_", type: "uint256" },
      { internalType: "uint128", name: "amount_", type: "uint128" },
      { internalType: "uint120", name: "expiration_", type: "uint120" },
      { internalType: "uint128", name: "feeAmount_", type: "uint128" },
      { internalType: "bytes", name: "feeAuthorization_", type: "bytes" },
    ],
    name: "depositERC1155",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "token_", type: "address" },
      { internalType: "address", name: "transferId_", type: "address" },
      { internalType: "uint256", name: "tokenId_", type: "uint256" },
      { internalType: "uint120", name: "expiration_", type: "uint120" },
      { internalType: "uint128", name: "feeAmount_", type: "uint128" },
      { internalType: "bytes", name: "feeAuthorization_", type: "bytes" },
    ],
    name: "depositERC721",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "", type: "address" },
      { internalType: "address", name: "", type: "address" },
      { internalType: "address", name: "", type: "address" },
    ],
    name: "deposits",
    outputs: [
      { internalType: "uint256", name: "tokenId", type: "uint256" },
      { internalType: "uint128", name: "amount", type: "uint128" },
      { internalType: "uint120", name: "expiration", type: "uint120" },
      { internalType: "uint8", name: "tokenType", type: "uint8" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "domain",
    outputs: [
      { internalType: "string", name: "name", type: "string" },
      { internalType: "string", name: "version", type: "string" },
      { internalType: "uint256", name: "chainId", type: "uint256" },
      { internalType: "address", name: "verifyingContract", type: "address" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "token_", type: "address" },
      { internalType: "address", name: "sender_", type: "address" },
      { internalType: "address", name: "transferId_", type: "address" },
    ],
    name: "getDeposit",
    outputs: [
      { internalType: "address", name: "token", type: "address" },
      { internalType: "uint8", name: "tokenType", type: "uint8" },
      { internalType: "uint256", name: "tokenId", type: "uint256" },
      { internalType: "uint128", name: "amount", type: "uint128" },
      { internalType: "uint120", name: "expiration", type: "uint120" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "name",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "operator_", type: "address" },
      { internalType: "address", name: "from_", type: "address" },
      { internalType: "uint256", name: "tokenId_", type: "uint256" },
      { internalType: "uint256", name: "amount_", type: "uint256" },
      { internalType: "bytes", name: "data_", type: "bytes" },
    ],
    name: "onERC1155Received",
    outputs: [{ internalType: "bytes4", name: "", type: "bytes4" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "operator_", type: "address" },
      { internalType: "address", name: "from_", type: "address" },
      { internalType: "uint256", name: "tokenId_", type: "uint256" },
      { internalType: "bytes", name: "data_", type: "bytes" },
    ],
    name: "onERC721Received",
    outputs: [{ internalType: "bytes4", name: "", type: "bytes4" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "owner",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "receiver_", type: "address" },
      { internalType: "address", name: "sender_", type: "address" },
      { internalType: "address", name: "token_", type: "address" },
      { internalType: "bytes", name: "receiverSig_", type: "bytes" },
    ],
    name: "redeem",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "receiver_", type: "address" },
      { internalType: "address", name: "sender_", type: "address" },
      { internalType: "address", name: "token_", type: "address" },
      { internalType: "address", name: "transferId_", type: "address" },
      { internalType: "bytes", name: "receiverSig_", type: "bytes" },
      { internalType: "bytes", name: "senderSig_", type: "bytes" },
    ],
    name: "redeemRecovered",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "sender_", type: "address" },
      { internalType: "address", name: "token_", type: "address" },
      { internalType: "address", name: "transferId_", type: "address" },
    ],
    name: "refund",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "", type: "address" }],
    name: "relayers",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "renounceOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "relayer_", type: "address" },
      { internalType: "bool", name: "active_", type: "bool" },
    ],
    name: "setRelayer",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "newOwner", type: "address" }],
    name: "transferOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "sender_", type: "address" },
      { internalType: "address", name: "token_", type: "address" },
      { internalType: "address", name: "transferId_", type: "address" },
      { internalType: "uint256", name: "tokenId_", type: "uint256" },
      { internalType: "uint128", name: "amount_", type: "uint128" },
      { internalType: "uint120", name: "expiration_", type: "uint120" },
      { internalType: "address", name: "feeToken_", type: "address" },
      { internalType: "uint128", name: "feeAmount_", type: "uint128" },
      { internalType: "bytes", name: "feeAuthorization_", type: "bytes" },
    ],
    name: "verifyFeeAuthorization",
    outputs: [{ internalType: "bool", name: "isValid", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "version",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "token_", type: "address" }],
    name: "withdrawAccruedFees",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];

const baseUrl = "https://thirdweb-demo-liard.vercel.app/";
const ALCHEMY_API_KEY = "your-alchemy-api-key";

const fetchNFTs = async (ownerAddress, contractAddress) => {
  let tokenIds = []; // List to store all token IDs
  try {
    const response = await axios.get(
      `https://base-mainnet.g.alchemy.com/nft/v3/${ALCHEMY_API_KEY}/getNFTsForOwner`,
      {
        params: {
          owner: ownerAddress,
          "contractAddresses[]": contractAddress,
          withMetadata: "false",
          pageSize: "5",
        },
        headers: { accept: "application/json" },
      }
    );

    // Extract tokenIds from response and add them to the tokenIds list
    const nfts = response.data.ownedNfts;
    nfts.forEach((nft) => {
      tokenIds.push(nft.tokenId);
    });
  } catch (error) {
    console.error(error);
    return []; // Return empty list in case of an error
  }

  return tokenIds; // Return the list of all token IDs
};

const getRandomBytes = (length) => {
  return new Uint8Array(crypto.randomBytes(length));
};

export const sdk = new LinkdropP2P({
  baseUrl,
  getRandomBytes,
  apiKey: "your-api-key",
});

const wallets = [
  createWallet("com.coinbase.wallet", {
    walletConfig: {
      options: "smartWalletOnly",
    },
  }),
  createWallet("io.metamask"),
  createWallet("me.rainbow"),
  walletConnect(),
];

const contract = getContract({
  client,
  chain: base,
  address: "0xe5A16B87F8288119C32Be83545D81A72Eacdf389",
});

const DisplayNFT = ({ index, handleClick }) => {
  const [decodedURI, setDecodedURI] = useState("");

  useEffect(() => {
    const fetchTokenURI = async () => {
      const tokenUriBase64 = await readContract({
        contract,
        method: resolveMethod("tokenURI"),
        params: [index],
      });
      const decodedString = atob(tokenUriBase64.split(",")[1]);
      const decodedObject = JSON.parse(decodedString);
      setDecodedURI(decodedObject);
    };
    fetchTokenURI();
  }, [index]);

  return (
    <div style={{ display: "inline-block", margin: "10px" }}>
      <img
        src={decodedURI?.image}
        alt="NFT"
        style={{
          width: "80px",
        }}
        onClick={handleClick}
      />
    </div>
  );
};

export default function App() {
  const wallet = useActiveWallet();
  const recipient = wallet?.getAccount().address;

  const [userNFTs, setUserNFTs] = useState([]);

  useEffect(() => {
    if (recipient) {
      fetchNFTs(recipient, contract.address).then((nfts) => {
        setUserNFTs(nfts);
      });
    }
  }, [recipient]);

  const mintNFT = async () => {
    const transaction = prepareContractCall({
      contract,
      method:
        "function mintNFT(address recipient, string svgName, string emotion) payable",
      params: [recipient, "happy", "happy"],
      value: 10000000000000n,
    });

    const bundleId = await sendCalls({
      client,
      wallet,
      calls: [transaction],
      chain: base,
    });
    let result;
    while (result?.status !== "CONFIRMED") {
      result = await getCallsStatus({ wallet, client, bundleId });
    }
    console.log("Result:", result);
  };

  const giftViaCapabilites = async (index) => {
    const from = wallet.getAccount().address;
    const token = "0xe5A16B87F8288119C32Be83545D81A72Eacdf389"; // Contract address of the NFT
    const tokenType = "ERC721";
    const chainId = 8453; // network chain ID
    const escrow = "0x648b9a6c54890a8fb17de128c6352f621154f358";

    const claimLink = await sdk.createClaimLink({
      from,
      token,
      chainId,
      tokenType,
      tokenId: index,
    });
    const escrowContract = getContract({
      client,
      chain: base,
      address: "0x648b9a6c54890a8fb17de128c6352f621154f358",
    });

    const sendTx = async ({ to, value, data }) => {
      const approveTx = approve({
        contract: contract,
        to: escrow,
        tokenId: index,
      });

      const { args } = decodeFunctionData({
        abi: escrowContractABI,
        data: data,
      });

      const depositTx = prepareContractCall({
        contract: escrowContract,
        method:
          "function depositERC721(address token_, address transferId_, uint256 tokenId_, uint120 expiration_, uint128 feeAmount_, bytes feeAuthorization_) payable",
        params: args,
      });

      const bundleId = await sendCalls({
        client,
        wallet,
        calls: [approveTx, depositTx],
        chain: base,
      });
      let result;
      while (result?.status !== "CONFIRMED") {
        result = await getCallsStatus({ wallet, client, bundleId });
      }
      console.log("Result:", result);
      const transactionHash = await result.receipts[0].transactionHash;
      return { hash: transactionHash };
    };

    const { claimUrl, transferId, txHash } = await claimLink.deposit({
      sendTransaction: sendTx,
    });

    console.log(claimUrl, transferId, txHash);
    const k = claimUrl.split("k=")[1].split("&")[0];
    const finalClaimUrl = `https://thirdweb-demo-liard.vercel.app/?claim=${k}`;
    alert(finalClaimUrl);
  };

  return (
    <>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          flexDirection: "row",
          alignItems: "center",
          marginTop: "20px",
        }}
      >
        <ConnectButton
          client={client}
          wallets={wallets}
          theme={"light"}
          chain={base}
        />
        <button
          style={{
            backgroundColor: "blue",
            color: "white",
            padding: "10px",
            margin: "10px",
            borderRadius: "10px",
            border: "none",
            cursor: "pointer",
          }}
          onClick={mintNFT}
        >
          Mint NFT
        </button>
      </div>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          flexDirection: "row",
        }}
      >
        {userNFTs?.map((tokenId) => (
          <DisplayNFT
            key={tokenId}
            index={tokenId}
            handleClick={() => giftViaCapabilites(tokenId)}
          />
        ))}
      </div>
    </>
  );
}
