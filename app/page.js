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
import { decodeFunctionData } from "viem";
import crypto from "crypto";
import { sendCalls, getCallsStatus } from "thirdweb/wallets/eip5792";
import { encodeBase58 } from "ethers";

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

const baseUrl = "https://adjusted-viper-helpful.ngrok-free.app";
const ALCHEMY_API_KEY = "alchemy-api-key";
const linkdropApiKey = "linkdrop-api-key";

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
          pageSize: "20",
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
  apiKey: linkdropApiKey,
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

const encodeLink = (claimHost, link) => {
  const linkKey = encodeBase58(link.linkKey);
  const transferId = encodeBase58(link.transferId); // string -> hex -> base58 for shorter string

  if (link.senderSig) {
    const sig = encodeBase58(link.senderSig);
    return `${claimHost}/#/code?k=${linkKey}&sg=${sig}&i=${transferId}&c=${link.chainId}&v=3&src=p2p`;
  } else {
    return `${claimHost}/#/code?k=${linkKey}&c=${link.chainId}&v=3&src=p2p`;
  }
};

async function generateClaimUrl(linkKey, transferId, chainId, sender) {
  const linkParams = {
    linkKey,
    transferId,
    chainId,
    sender,
  };

  const claimUrl = encodeLink(baseUrl, linkParams);
  console.log(claimUrl);
}

const headers = {
  authorization: `Bearer ${linkdropApiKey}`,
};

async function depositErc721(payload) {
  try {
    const response = await axios.post(
      "https://escrow-api.linkdrop.io/v3/base/deposit-erc721",
      payload,
      { headers }
    );
    console.log(response.data);
  } catch (error) {
    console.error("There was an error!", error.response.data);
  }
}

const DisplayNFT = ({ index }) => {
  const [decodedURI, setDecodedURI] = useState("");
  const [claimLink, setClaimLink] = useState(null);
  const wallet = useActiveWallet();

  useEffect(() => {
    const createClaimLink = async () => {
      if (wallet) {
        const from = wallet.getAccount().address;
        const token = "0xe5A16B87F8288119C32Be83545D81A72Eacdf389"; // Contract address of the NFT
        const tokenType = "ERC721";
        const chainId = 8453; // network chain ID
        const claimLink = await sdk.createClaimLink({
          from,
          token,
          chainId,
          tokenType,
          tokenId: index,
        });
        setClaimLink(claimLink);
      }
    };

    createClaimLink();
  }, [wallet, sdk]);

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

  const batchedApproveDeposit = async () => {
    console.log("Batched Approve Deposit");
    const escrow = "0x648b9a6c54890a8fb17de128c6352f621154f358";

    const escrowContract = getContract({
      client,
      chain: base,
      address: "0x648b9a6c54890a8fb17de128c6352f621154f358",
    });

    const approvetx = prepareContractCall({
      contract,
      method: "function approve(address to, uint256 tokenId)",
      params: [escrow, index],
    });

    const depositParams = await claimLink.getDepositParams();
    console.log("Deposit Params:", depositParams);

    const { args } = decodeFunctionData({
      abi: escrowContractABI,
      data: depositParams?.data,
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
      calls: [approvetx, depositTx],
      chain: base,
    });

    let result;
    while (result?.status !== "CONFIRMED") {
      result = await getCallsStatus({ wallet, client, bundleId });
    }
    console.log("Result:", result);
    const txHash = result?.receipts[0]?.transactionHash;
    return { args, txHash };
  };

  const giftViaCapabilites = async (index, transactionHash, args) => {
    console.log(args, transactionHash);

    const payload = {
      sender: wallet.getAccount().address,
      escrow: "0x648b9a6c54890a8fb17de128c6352f621154f358",
      transfer_id: args[1],
      token: "0xe5a16b87f8288119c32be83545d81a72eacdf389",
      token_type: "ERC721",
      expiration: args[3].toString(),
      tx_hash: transactionHash,
      fee_authorization: args[5],
      token_id: index,
      fee_amount: "0",
      total_amount: "1",
      fee_token: "0x0000000000000000000000000000000000000000",
      amount: "1",
    };
    
    await depositErc721(payload);
    const linkKey = await claimLink.linkKey;
    const transferId = args[1];
    const sender = wallet.getAccount().address;
    const chainId = 8453;
    await generateClaimUrl(linkKey, transferId, chainId, sender);
  };

  const gift = async () => {
    const { txHash, args } = await batchedApproveDeposit();
    const result = await giftViaCapabilites(index, txHash, args);
  };

  return (
    <div style={{ display: "inline-block", margin: "10px" }}>
      <img
        src={decodedURI?.image}
        alt="NFT"
        style={{
          width: "80px",
        }}
      />
      <button
        style={{
          marginTop: "8px",
          padding: "8px 16px",
          borderRadius: "4px",
          background: "#007BFF",
          color: "#fff",
          border: "none",
          cursor: "pointer",
        }}
        onClick={gift}
      >
        Gift
      </button>
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
        const last5 = nfts.slice(Math.max(nfts.length - 5, 0));
        setUserNFTs(last5);
        console.log("NFTs:", last5);
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
          justifyContent: "center",
          flexDirection: "row",
          marginTop: "20px",
        }}
      >
        {userNFTs?.map((tokenId) => (
          <div
            key={tokenId}
            style={{
              border: "1px solid #ccc",
              borderRadius: "8px",
              padding: "16px",
              marginBottom: "16px",
              marginRight: "16px",
            }}
          >
            <DisplayNFT index={tokenId} />
          </div>
        ))}
      </div>
    </>
  );
}
