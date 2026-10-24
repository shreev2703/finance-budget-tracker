import { Shell } from "../../components/Shell.jsx";
import { Account } from "./Account.jsx";
import { Amount } from "./Amount.jsx";
import { ChooseFund } from "./ChooseFund.jsx";
import { Review } from "./Review.jsx";
import { Schedule } from "./Schedule.jsx";
import { Setup } from "./Setup.jsx";

export function Investing({ go, step = 0, setStep }) {
  const screens = [
    <Setup go={go} setStep={setStep} />,
    <ChooseFund setStep={setStep} />,
    <Amount setStep={setStep} />,
    <Schedule setStep={setStep} />,
    <Account setStep={setStep} />,
    <Review setStep={setStep} go={go} />,
  ];

  return (
    <Shell page="investing" go={go}>
      <div className="investing">
        <div className="title">
          <p>Investing · Oct 14, 2025</p>
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
