import { useContext, useState } from "react";
import { api, errorMessages } from "../api";
import { UserContext } from "../UserContext.js";
import { Button } from "./Button.jsx";
import { FormErrors } from "./FormErrors.jsx";
import { Modal } from "./Modal.jsx";

/** US-07 account management (#95): see who is logged in, change the password, or delete the account. */
export function AccountSettings({ onClose }) {
  const { user, logOut } = useContext(UserContext);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordErrors, setPasswordErrors] = useState([]);
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteErrors, setDeleteErrors] = useState([]);
  const [busy, setBusy] = useState(false);

  async function changePassword(event) {
    event.preventDefault();
    setBusy(true);
    setPasswordErrors([]);
    setPasswordSaved(false);
    try {
      await api.changePassword({ currentPassword, newPassword });
      setPasswordSaved(true);
      setCurrentPassword("");
      setNewPassword("");
    } catch (error) {
      setPasswordErrors(errorMessages(error));
    } finally {
      setBusy(false);
    }
  }

  async function deleteAccount(event) {
    event.preventDefault();
    if (!window.confirm("Delete your account and all of its budgets and transactions? This cannot be undone.")) {
      return;
    }
    setBusy(true);
    setDeleteErrors([]);
    try {
      await api.deleteAccount(deletePassword);
      logOut();
    } catch (error) {
      setDeleteErrors(errorMessages(error));
      setBusy(false);
    }
  }

  return (
    <Modal>
      <button className="close" onClick={onClose} aria-label="Close">
        ×
      </button>

      <h2>Account</h2>
      <p>
        {user.name} · {user.email}
      </p>

      <form onSubmit={changePassword}>
        <h3>Change password</h3>
        <label>
          Current password
          <input
            type="password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            autoComplete="current-password"
            required
          />
        </label>
        <label>
          New password
          <input
            type="password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            placeholder="At least 8 characters"
            autoComplete="new-password"
            required
          />
        </label>
        <FormErrors errors={passwordErrors} />
        {passwordSaved && <p role="status">Your password was changed.</p>}
        <Button type="submit" disabled={busy}>
          Change password
        </Button>
      </form>

      <form onSubmit={deleteAccount} className="danger-zone">
        <h3>Delete account</h3>
        <p>This permanently deletes your account, categories, budgets, and transactions.</p>
        <label>
          Password to confirm
          <input
            type="password"
            value={deletePassword}
            onChange={(event) => setDeletePassword(event.target.value)}
            autoComplete="current-password"
            required
          />
        </label>
        <FormErrors errors={deleteErrors} />
        <Button type="submit" className="danger" disabled={busy}>
          Delete my account
        </Button>
      </form>
    </Modal>
  );
}
