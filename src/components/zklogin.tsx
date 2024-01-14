import {
  jwtToAddress,
  getZkLoginSignature,
  getExtendedEphemeralPublicKey,
} from "@mysten/zklogin";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import { JwtPayload, jwtDecode } from "jwt-decode";
import { Ed25519Keypair } from "@mysten/sui.js/keypairs/ed25519";
export type PartialZkLoginSignature = Omit<
  Parameters<typeof getZkLoginSignature>["0"]["inputs"],
  "addressSeed"
>;

export interface ExtendedJwtPayload extends JwtPayload {
  nonce?: string;
}

interface ZkLoginProps {
  randomness: string;
  userSalt: string;
  ephemeralKeypair: Ed25519Keypair | null;
}

export const ZkLoginCallback = ({
  randomness,
  userSalt,
  ephemeralKeypair,
}: ZkLoginProps) => {
  const router = useRouter();
  const { code, state } = router.query;
  const [userinfo, setUserinfo] = useState<Object>({});
  const [isClient, setIsClient] = useState(false);
  const [zkloginAddress, setZkloginAddress] = useState("");
  const [decodedToken, setDecodedToken] = useState<ExtendedJwtPayload>({});
  const [idToken, setIdToken] = useState("");

  useEffect(() => {
    const loadUserinfo = async () => {
      if (code === undefined || state == undefined) return;
      const resp = await fetch("/api/basicinfo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code, state }),
      });

      const info = await resp.json();

      console.log(info.JwtToken);

      if (info.JwtToken) {
        const zkLoginUserAddress = jwtToAddress(info.JwtToken, "0");
        setZkloginAddress(zkLoginUserAddress);
      }

      const decoded = jwtDecode(info.JwtToken as string) as ExtendedJwtPayload;
      setDecodedToken(decoded);
      setIdToken(info.JwtToken);
      delete info.JwtToken;

      setUserinfo(info);
    };
    loadUserinfo();
    setIsClient(true);
  }, [code, state]);

  const fetchZkProof = async () => {
    console.log("load ZkProof");

    if (ephemeralKeypair != null && randomness != "" && userSalt != "") {
      const maxEpoch = Number(localStorage.getItem("maxEpoch"));
      const extendedEphemeralPublicKey = getExtendedEphemeralPublicKey(
        ephemeralKeypair.getPublicKey()
      );
      console.log(extendedEphemeralPublicKey);

      const url = "https://prover-dev.mystenlabs.com/v1";
      const data = {
        jwt: idToken,
        extendedEphemeralPublicKey: extendedEphemeralPublicKey,
        maxEpoch: maxEpoch,
        jwtRandomness: randomness,
        salt: userSalt,
        keyClaimName: "sub",
      };

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const zkProofResult = (await response.json()) as PartialZkLoginSignature;
      // console.log(zkProofResult);
      // alert(JSON.stringify(zkProofResult, null, 2));
      // setZkProof(zkProofResult);
    }
  };

  return isClient ? (
    <div>
      <h2>Login Callback!!</h2>
      <p>{zkloginAddress}</p>
      <pre>{JSON.stringify(decodedToken, null, 2)}</pre>
      <button onClick={fetchZkProof}>fetchZkProof</button>
    </div>
  ) : null;
};

export default ZkLoginCallback;
