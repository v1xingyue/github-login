import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { jwtToAddress } from "@mysten/zklogin";

interface LoginProps {
  rewrite_path: string;
  state: string;
}

export const GithubLogin = ({ rewrite_path, state }: LoginProps) => {
  const client_id = process.env.NEXT_PUBLIC_CLIENT_ID as string;
  const [githubLoginUrl, setGithubLoginUrl] = useState("");

  useEffect(() => {
    const params = new URLSearchParams({
      client_id,
      scope: ["read:user", "user:email"].join(" "),
      redirect_uri: window.location.origin + rewrite_path,
      allow_signup: "true",
      state,
    });
    const url = `https://github.com/login/oauth/authorize?${params}`;
    setGithubLoginUrl(url);
  }, [client_id, rewrite_path, state]);

  return (
    <div>
      <p>Client ID: {client_id}</p>
      <a href={githubLoginUrl}>Login with Github</a>
    </div>
  );
};

export const GithubCallback = () => {
  const router = useRouter();
  const { code } = router.query;
  const [userinfo, setUserinfo] = useState<Object>({});
  const [isClient, setIsClient] = useState(false);
  const [zkloginAddress, setZkloginAddress] = useState("");

  useEffect(() => {
    const loadUserinfo = async () => {
      if (code === undefined) return;
      const resp = await fetch("/api/basicinfo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code }),
      });

      const info = await resp.json();

      console.log(info.JwtToken);

      if (info.JwtToken) {
        const zkLoginUserAddress = jwtToAddress(info.JwtToken, "0");
        setZkloginAddress(zkLoginUserAddress);
      }

      delete info.JwtToken;

      setUserinfo(info);
    };
    loadUserinfo();
    setIsClient(true);
  }, [code]);

  return isClient ? (
    <div>
      <p>{zkloginAddress}</p>
      <p>
        <pre>{JSON.stringify(userinfo, null, 2)}</pre>
      </p>
    </div>
  ) : null;
};
