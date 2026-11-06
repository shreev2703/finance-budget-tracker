import { todayLabel } from "../../format.js";
import { Shell } from "../../components/Shell.jsx";
import { PAGES } from "../pages.js";
import { Account } from "./Account.jsx";
import { Amount } from "./Amount.jsx";
import { ChooseFund } from "./ChooseFund.jsx";
import { Review } from "./Review.jsx";
import { Schedule } from "./Schedule.jsx";
import { Setup } from "./Setup.jsx";

export function Investing({ go, step = 0, setStep }) {
  const screens = [
    <Setup key="setup" go={go} setStep={setStep} />,
    <ChooseFund key="fund" setStep={setStep} />,
    <Amount key="amount" setStep={setStep} />,
    <Schedule key="schedule" setStep={setStep} />,
    <Account key="account" setStep={setStep} />,
    <Review key="review" setStep={setStep} go={go} />,
  ];

  return (
    <Shell page={PAGES.INVESTING} go={go}>
      <div className="investing">
        <div className="title">
          <p>Investing · {todayLabel()}</p>
          <h1>Automatic investing</h1>
          <span>
            Build wealth gradually with a simple, recurring plan.
          </span>
        </div>

        {screens[step]}
      </div>
    </Shell>
  );
}
