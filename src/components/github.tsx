import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export const GithubLogin = () => {
  const params = new URLSearchParams({
    client_id: process.env.client_id as string,
    scope: ["read:user", "user:email"].join(" "),
    redirect_uri: location.origin + "/",
    allow_signup: "true",
  });

  const githubLoginUrl = `https://github.com/login/oauth/authorize?${params}`;

  return <a href={githubLoginUrl}>Login with Github</a>;
};

export const GithubCallback = () => {
  const router = useRouter();
  const { code } = router.query;
  const [userinfo, setUserinfo] = useState<Object>({});

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
      setUserinfo(info);
    };
    loadUserinfo();
  }, [code]);

  return (
    <div>
      <p>{code}</p>
      <pre>{JSON.stringify(userinfo, null, 2)}</pre>
    </div>
  );
};
