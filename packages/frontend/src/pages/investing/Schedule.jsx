import { Button } from "../../components/Button.jsx";
import { Modal } from "../../components/Modal.jsx";

export function Schedule({ setStep }) {
  return (
    <Modal>
      <button className="close" onClick={() => setStep(2)}>
        ×
      </button>

      <b className="eyebrow">▣</b>
      <h2>Choose your schedule</h2>
      <p>Select how often and when your money will move.</p>

      <div className="two">
        <label>
          Frequency

          <select>
            <option>Monthly</option>
          </select>
        </label>

        <label>
          Day of month

          <select>
            <option>5th</option>
          </select>
        </label>
      </div>

      <button className="fund-choice selected">
        <b>◉</b>

        <span>
          <strong>Monthly</strong>
          <small>Transfers repeat on the 5th of every month.</small>
        </span>

        ✓
      </button>

      <div className="notice">
        ◉ &nbsp; Your first transfer will be scheduled for Nov 5, 2025.
      </div>

      <div className="modal-actions">
        <Button className="outline" onClick={() => setStep(2)}>
          Cancel
        </Button>

        <Button onClick={() => setStep(4)}>Save schedule</Button>
      </div>
    </Modal>
  );
}
