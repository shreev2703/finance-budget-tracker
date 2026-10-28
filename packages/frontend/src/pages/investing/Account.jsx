import { Button } from "../../components/Button.jsx";
import { Modal } from "../../components/Modal.jsx";

export function Account({ setStep }) {
  return (
    <Modal>
      <button className="close" onClick={() => setStep(3)}>
        ×
      </button>

      <b className="eyebrow">▣</b>
      <h2>Select a funding account</h2>

      <p>
        Your recurring contribution will be transferred from this linked bank
        account.
      </p>

      <button className="account-choice selected">
        <span>
          <b>◉ Chase College Checking · 4821</b>
          <small>Checking · Linked · Sample account</small>
        </span>

        Selected
      </button>

      <button className="account-choice">
        <span>
          <b>◯ Chase Savings · 9063</b>
          <small>Savings · Linked · Sample account</small>
        </span>
      </button>

      <Button className="wide outline">＋ Link another bank account</Button>

      <div className="notice">
        ◉ &nbsp; Keep at least $500 available before each transfer.
      </div>

      <div className="modal-actions">
        <Button className="outline" onClick={() => setStep(3)}>
          Cancel
        </Button>

        <Button onClick={() => setStep(5)}>Use this account</Button>
      </div>
    </Modal>
  );
}
