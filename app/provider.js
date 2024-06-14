"use client";
import { ThirdwebProvider } from "thirdweb/react";
import { createThirdwebClient, getContract } from "thirdweb";
import { baseSepolia } from "thirdweb/chains";
import { abi,contractAddress } from "./constants";

export const client = createThirdwebClient({
    clientId: "adb6ce72c60ab8635170f259566269c8",
  });
  
  export const contract = getContract({
    client,
    chain: baseSepolia,
    address: contractAddress,
    abi: abi,
  });

export default function Providers(props) {
  return <ThirdwebProvider>{props.children}</ThirdwebProvider>;
}
