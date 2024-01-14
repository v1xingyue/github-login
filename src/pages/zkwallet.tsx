import { useEffect, useState } from "react";
import { Ed25519Keypair } from "@mysten/sui.js/keypairs/ed25519";
import { fromB64 } from "@mysten/bcs";
import {
  generateRandomness,
  generateNonce,
  jwtToAddress,
  getExtendedEphemeralPublicKey,
  genAddressSeed,
  getZkLoginSignature,
} from "@mysten/zklogin";
import {
  CoinBalance,
  SuiClient,
  SuiTransactionBlockResponse,
} from "@mysten/sui.js/client";
import { JwtPayload, jwtDecode } from "jwt-decode";
import { TransactionBlock } from "@mysten/sui.js/transactions";
import { SerializedSignature } from "@mysten/sui.js/cryptography";
import { GithubLogin } from "@/components/github";
import ZkLoginCallback from "@/components/zklogin";

export type PartialZkLoginSignature = Omit<
  Parameters<typeof getZkLoginSignature>["0"]["inputs"],
  "addressSeed"
>;

const SUI_DEVNET_FAUCET = "https://faucet.devnet.sui.io/gas";
const FULLNODE_URL = "https://fullnode.devnet.sui.io"; // replace with the RPC URL you want to use
const Index = () => {
  // const isLoginBack = false;
  // const params = new URLSearchParams(location.hash.substring(1));
  // const idToken = params.get("id_token");
  const [isLoginBack, setIsLoginBack] = useState(false);
  const [ephemeralKeypair, setEphemeralKeypair] =
    useState<Ed25519Keypair | null>(null);
  const [randomness, setRandomness] = useState<string>("");
  const [nonce, setNonce] = useState<string>("");
  const [loginUrl, setLoginUrl] = useState<string>("");

  const [zkProof, setZkProof] = useState<PartialZkLoginSignature | null>(null);
  const [userSalt, setUserSalt] = useState("");
  const [zkLoginAddress, setZkLoginUserAddress] = useState("");
  const [balance, setBalance] = useState<CoinBalance | null>(null);
  const [transactionResult, setTransactionResult] =
    useState<SuiTransactionBlockResponse | null>(null);
  const [error, setError] = useState("");
  const [txB64, setTxB64] = useState("");

  useEffect(() => {
    setIsLoginBack(location.search != "");
    if (!ephemeralKeypair) {
      if (localStorage.getItem("ephemeralKeypair")) {
        const pair = Ed25519Keypair.fromSecretKey(
          fromB64(localStorage.getItem("ephemeralKeypair")!)
        );
        if (pair) {
          setEphemeralKeypair(pair);
          return;
        }
      }
      const generated = Ed25519Keypair.generate();
      localStorage.setItem("ephemeralKeypair", generated.export().privateKey);
      setEphemeralKeypair(Ed25519Keypair.generate());
    }

    if (userSalt == "") {
      const salt = localStorage.getItem("userSalt");
      if (salt != null) {
        setUserSalt(salt);
      } else {
        const salt = generateRandomness();
        localStorage.setItem("userSalt", salt);
        setUserSalt(salt);
      }
    }
  }, [ephemeralKeypair, userSalt]);

  useEffect(() => {
    if (!isLoginBack) {
      if (randomness == "") {
        const randomness = generateRandomness();
        setRandomness(randomness);
        localStorage.setItem("randomness", randomness);
      }
    } else {
      const last = localStorage.getItem("randomness");
      if (last != null) {
        setRandomness(last);
      }
    }
  }, [randomness, isLoginBack]);

  useEffect(() => {
    const initLoginUrl = async () => {
      if (!isLoginBack && ephemeralKeypair != null && randomness != "") {
        const suiClient = new SuiClient({
          url: FULLNODE_URL,
        });
        const { epoch } = await suiClient.getLatestSuiSystemState();
        const maxEpoch = Number(epoch) + 10;
        localStorage.setItem("maxEpoch", maxEpoch.toString());
        const nonce = generateNonce(
          ephemeralKeypair.getPublicKey(),
          maxEpoch,
          randomness
        );
        setNonce(nonce);
      }
    };
    initLoginUrl();
  }, [isLoginBack, ephemeralKeypair, randomness]);

  return (
    <>
      <div>
        <h2>Prepare Login with Github!</h2>
        <p>private : {ephemeralKeypair?.export().privateKey}</p>
        <p>public : {ephemeralKeypair?.getPublicKey().toBase64()}</p>
        <p>randomness : {randomness}</p>
        <p>userSalt : {userSalt}</p>
        <p>login nonce : {nonce}</p>
        <GithubLogin rewrite_path="/zkwallet" state={nonce} />
        <ZkLoginCallback
          randomness={randomness}
          ephemeralKeypair={ephemeralKeypair}
          userSalt={userSalt}
        />
      </div>
    </>
  );
};

export default Index;
