import { Button } from "../../components/Button.jsx";
import { Modal } from "../../components/Modal.jsx";

export function Review({ setStep, go }) {
  return (
    <Modal>
      <button className="close" onClick={() => setStep(4)}>
        ×
      </button>

      <b className="eyebrow">▣</b>
      <h2>Review your investment</h2>
      <p>Review the plan before authorizing the recurring transfer.</p>

      <div className="review">
        <p>
          Index fund <b>VTI · Vanguard Total Stock Market ETF</b>
        </p>

        <p>
          Amount <b>$50.00 per transfer</b>
        </p>

        <p>
          From <b>Chase College Checking · 4821</b>
        </p>

        <p>
          Frequency <b>Monthly on the 5th</b>
        </p>

        <p>
          First transfer <b>Nov 5, 2025</b>
        </p>
      </div>

      <label className="check">
        <input type="checkbox" defaultChecked />
        I authorize recurring $50.00 transfers from Chase College Checking.
      </label>

      <div className="notice">
        ◉ &nbsp; Pause or cancel from My funds. Transfers are scheduled in
        advance.
      </div>

      <div className="modal-actions">
        <Button className="outline" onClick={() => setStep(0)}>
          Back to edit
        </Button>

        <Button onClick={() => go("funds")}>Authorize $50 monthly</Button>
      </div>
    </Modal>
  );
}
