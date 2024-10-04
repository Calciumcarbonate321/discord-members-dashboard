"use client"
import UserTable from "~/components/userstable";
import { useSession, signIn } from "next-auth/react";

export default function HomePage() {
  const { data: session, status } = useSession();

  console.log("Session status:", status);
  console.log("Session data:", session);

  if (status === "loading") {
    return <div>Loading...</div>;
  }

  if (!session) {
    return (
      <div>
        <h1>Not signed in</h1>
        <button onClick={() => signIn()}>Sign in</button>
      </div>
    );
  }

  return (
    <>
      <UserTable />
    </>
  );
}