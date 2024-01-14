import type { NextApiRequest, NextApiResponse } from "next";
import * as queryString from "query-string";

import sign from "jwt-encode";

const fetchAccessToken = async (code: string) => {
  const res = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      code,
      client_id: process.env.NEXT_PUBLIC_CLIENT_ID,
      client_secret: process.env.client_secret,
    }),
  });

  const body = await res.text();
  const parsedData = queryString.default.parse(body);
  return parsedData;
};

const getUserInfo = async (access_token: string) => {
  const res = await fetch("https://api.github.com/user", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `token ${access_token}`,
    },
  });

  return res.json();
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { code, state } = req.body;
  const { access_token } = await fetchAccessToken(code);
  if (access_token != null) {
    const userInfo = await getUserInfo(access_token as string);
    const JwtToken = sign(
      {
        iss: "https://github.com",
        azp: `${process.env.NEXT_PUBLIC_CLIENT_ID}`,
        aud: `${process.env.NEXT_PUBLIC_CLIENT_ID}`,
        sub: userInfo.id + "",
        email: userInfo.email,
        nonce: state,
        nbf: 1705042749,
        iat: 1705043049,
        exp: 1705046649,
        jti: "jwt_token_uniq_id",
      },
      access_token as string
    );
    res.json({ ...userInfo, JwtToken });
  } else {
    res.json({
      error: "code is null or expired.",
    });
  }
}
