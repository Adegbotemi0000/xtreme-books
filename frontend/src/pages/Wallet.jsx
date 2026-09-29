import { useEffect, useState } from "react";
import { api } from "../api/client";

export function Wallet() {
  const [wallet, setWallet] = useState(null);

  function load() {
    api.get("/wallet").then(setWallet);
  }
  useEffect(load, []);

  async function startKyc() {
    await api.post("/wallet/kyc/start");
    load();
  }

  if (!wallet) return <p>Loading...</p>;

  return (
    <div>
      <div className="page-header">
        <h1>Wallet & Virtual Accounts</h1>
      </div>
      <div className="card">
        <p>
          <strong>Balance:</strong> ₦{Number(wallet.balance).toLocaleString()}
        </p>
        <p>
          <strong>KYC status:</strong> <span className={`status-pill ${wallet.kyc_status}`}>{wallet.kyc_status.replace("_", " ")}</span>
        </p>
        {wallet.kyc_status === "not_started" && (
          <button className="btn" onClick={startKyc}>
            Start KYC
          </button>
        )}
        <p style={{ color: "var(--muted)", marginTop: 14 }}>
          Full KYC verification and the partner-bank integration are pending vendor selection —
          see docs/09-compliance-and-integrations.md.
        </p>
      </div>
    </div>
  );
}
