import { Button } from "../../components/Button.jsx";
import { Modal } from "../../components/Modal.jsx";

export function ChooseFund({ setStep }) {
  return (
    <Modal>
      <button className="close" onClick={() => setStep(0)}>
        ×
      </button>

      <b className="eyebrow">▣</b>
      <h2>Choose an index fund</h2>
      <p>
        Pick a fund to invest in. These are diversified, low-cost options.
      </p>

      <label>
        Fund type

        <select>
          <option>All fund types</option>
        </select>
      </label>

      <button className="fund-choice selected">
        <b>VTI</b>

        <span>
          <strong>Vanguard Total Stock Market ETF</strong>
          <small>
            Tracks the entire U.S. stock market · 0.03% expense ratio
          </small>
        </span>

        ✓
      </button>

      <button className="fund-choice">
        <b>VXUS</b>

        <span>
          <strong>Vanguard Total International Stock ETF</strong>
          <small>Global stocks outside the U.S.</small>
        </span>
      </button>

      <div className="modal-actions">
        <Button className="outline" onClick={() => setStep(0)}>
          Cancel
        </Button>

        <Button onClick={() => setStep(2)}>Continue</Button>
      </div>
    </Modal>
  );
}
