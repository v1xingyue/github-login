import type { NextApiRequest, NextApiResponse } from "next";
import * as queryString from "query-string";

const fetchAccessToken = async (code: string) => {
  const res = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      code,
      client_id: process.env.client_id,
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
  const { code } = req.body;
  const { access_token } = await fetchAccessToken(code);
  if (access_token != null) {
    const userInfo = await getUserInfo(access_token as string);

    res.json({
      parmas: req.query,
      code,
      access_token,
      userInfo,
      now: new Date().toISOString(),
      status: 0,
    });
  } else {
    res.json({
      error: "code is null or expired.",
    });
  }
}
