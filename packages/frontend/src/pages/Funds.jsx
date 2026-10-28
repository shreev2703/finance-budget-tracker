import { Shell } from "../components/Shell.jsx";
import { PlanCard } from "./investing/PlanCard.jsx";

export function Funds({ go }) {
  return (
    <Shell page="funds" go={go}>
      <div className="funds">
        <div className="title">
          <p>Investing · Oct 14, 2025</p>
          <h1>My funds</h1>
          <span>
            See what you’ve invested and how your funds have changed.
          </span>
        </div>

        <section className="portfolio">
          <small>Total portfolio value</small>
          <h1>$1,284.60</h1>

          <div>
            <span>
              <small>Total contributions</small>
              <b>$1,200.00</b>
            </span>

            <span>
              <small>Investment gains</small>
              <b className="income">+$84.60 (+7.05%)</b>
            </span>
          </div>

          <div className="chart">╱╲╱╲╱╲╱╲╱╲╱╲╱╲</div>
        </section>

        <div className="fund-grid">
          <section className="holdings">
            <h2>Your holdings</h2>

            <div>
              <b>VTI</b>
              <span>Vanguard Total Stock Market ETF</span>
              <strong>$960.00</strong>
            </div>

            <div>
              <b>VXUS</b>
              <span>Vanguard Total International Stock ETF</span>
              <strong>$324.60</strong>
            </div>
          </section>

          <PlanCard />
        </div>
      </div>
    </Shell>
  );
}
