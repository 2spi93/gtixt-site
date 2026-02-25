import { useState } from "react";
import Head from "next/head";

export default function AdminUsersTest() {
  const [message, setMessage] = useState("Page chargée!");

  return (
    <>
      <Head>
        <title>Test Users - GTIXT Admin</title>
      </Head>
      <div style={{ padding: "40px", background: "#0a0e27", minHeight: "100vh", color: "#fff" }}>
        <h1>🧪 Test Users Page</h1>
        <p>{message}</p>
        <p>Si tu vois cette page, le routing fonctionne!</p>
      </div>
    </>
  );
}
