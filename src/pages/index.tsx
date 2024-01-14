import { GithubLogin, GithubCallback } from "@/components/github";

export default function Home() {
  return (
    <main>
      <GithubLogin rewrite_path="/" state="" />
      <GithubCallback />
    </main>
  );
}
