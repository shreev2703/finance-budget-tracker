import { Button } from "../../components/Button.jsx";
import { Modal } from "../../components/Modal.jsx";

export function Amount({ setStep }) {
  return (
    <Modal>
      <button className="close" onClick={() => setStep(1)}>
        ×
      </button>

      <b className="eyebrow">▣</b>
      <h2>Set your contribution</h2>

      <p>
        How much would you like to move from your bank account into VTI each
        month?
      </p>

      <label>
        Amount per transfer

        <div className="currency">
          <span>$</span>
          <input value="50.00" readOnly />
          <small>USD</small>
        </div>
      </label>

      <p>This amount is taken each time your schedule repeats.</p>

      <div className="amounts">
        {[10, 25, 50, 100].map((n) => (
          <button className={n === 50 ? "selected" : ""} key={n}>
            ${n}
          </button>
        ))}
      </div>

      <div className="notice">
        ◉ &nbsp; $50 monthly = $600 over 12 contributions, before gains or
        losses.
      </div>

      <div className="modal-actions">
        <Button className="outline" onClick={() => setStep(1)}>
          Cancel
        </Button>

        <Button onClick={() => setStep(3)}>Save amount</Button>
      </div>
    </Modal>
  );
}
