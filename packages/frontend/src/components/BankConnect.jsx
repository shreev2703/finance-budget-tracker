import { useEffect, useState } from "react";
import { usePlaidLink } from "react-plaid-link";
import { api, errorMessages } from "../api";
import { Button } from "./Button.jsx";

/** Opens Plaid Link as soon as it is ready. Mounted only after a click, so Plaid's script loads only then. */
function PlaidLinkOpener({ token, onSuccess, onExit }) {
  const { open, ready } = usePlaidLink({
    token,
    onSuccess: (publicToken) => onSuccess(publicToken),
    onExit,
  });
  useEffect(() => {
    if (ready) open();
  }, [ready, open]);
  return null;
}

const importedMessage = ({ imported }) =>
  imported === 0
    ? "Your bank has no new transactions."
    : `Imported ${imported} transaction${imported === 1 ? "" : "s"} from your bank.`;

/**
 * US-10 (#94): connect a bank through Plaid and import its purchases.
 * Shows nothing when bank connections aren't set up on the server.
 * Our site never sees the bank password: the student signs in inside Plaid's window.
 */
export function BankConnect({ onImported }) {
  const [status, setStatus] = useState(null);
  const [linkToken, setLinkToken] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    api
      .bankStatus()
      .then((next) => active && setStatus(next))
      .catch(() => active && setStatus({ enabled: false }));
    return () => {
      active = false;
    };
  }, []);

  if (!status?.enabled) return null;

  async function run(step) {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await step();
    } catch (problem) {
      setError(errorMessages(problem).join(" "));
    } finally {
      setBusy(false);
    }
  }

  const importNow = () =>
    run(async () => {
      setMessage(importedMessage(await api.importFromBank()));
      await onImported();
    });

  const startConnect = () =>
    run(async () => setLinkToken(await api.createBankLinkToken()));

  const finishConnect = (publicToken) => {
    setLinkToken(null);
    run(async () => {
      await api.connectBank(publicToken);
      setStatus({ enabled: true, connected: true });
      setMessage(importedMessage(await api.importFromBank()));
      await onImported();
    });
  };

  return (
    <div className="bank-connect">
      <p>
        {status.connected
          ? "Your bank is connected. Import new purchases any time."
          : "Connect your bank to import purchases automatically. You sign in with your bank in Plaid’s window, never on our site."}
      </p>
      <Button
        className="small"
        disabled={busy}
        onClick={status.connected ? importNow : startConnect}
      >
        {busy ? "Working…" : status.connected ? "Import from bank" : "Connect bank"}
      </Button>
      {message && <p role="status">{message}</p>}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {linkToken && (
        <PlaidLinkOpener
          token={linkToken}
          onSuccess={finishConnect}
          onExit={() => setLinkToken(null)}
        />
      )}
    </div>
  );
}
