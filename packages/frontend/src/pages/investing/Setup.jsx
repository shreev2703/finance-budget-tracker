import { Button } from "../../components/Button.jsx";
import { PlanCard } from "./PlanCard.jsx";

export function Setup({ setStep }) {
  return (
    <div className="invest-grid">
      <section className="setup">
        <h2>Set up your recurring plan</h2>
        <p>
          Choose what to invest in and how much. You’ll be able to adjust
          everything later.
        </p>

        <label>
          Index fund

          <select>
            <option>VTI · Vanguard Total Stock Market ETF</option>
          </select>
        </label>

        <div className="two">
          <label>
            Contribution amount
            <input value="$50.00" readOnly />
          </label>

          <label>
            Start date
            <input value="Nov 5, 2025" readOnly />
          </label>
        </div>

        <label>
          Funding account

          <select>
            <option>Chase College Checking · 4821</option>
          </select>
        </label>

        <div className="notice">
          ◉ &nbsp; You’re in control. You can pause, change, or cancel your
          plan anytime.
        </div>

        <Button className="right" onClick={() => setStep(1)}>
          Review investment
        </Button>
      </section>

      <PlanCard />
    </div>
  );
}
