import { Button } from "../components/Button.jsx";
import { Mark } from "../components/Mark.jsx";

export function Login({ enter }) {
  return (

    <main className="login">
      <section className="login-art">
        <Mark />
        <div className="rays" />

        <div className="login-message">
          <h1>Learn by Doing.</h1>
          <p>
            Welcome back to the Mustang Portal. Securely access your academic
            resources, administration dashboard, and campus workspace.
          </p>
        </div>
      </section>

      <section className="login-form">
        <div>
          <h1>Log in to Cal Poly</h1>
          <p>
            Enter your credentials to access your secure university portal.
          </p>

          <label>
            Email or Username
            <input placeholder="username@calpoly.edu" />
          </label>

          <label>
            Password
            <input type="password" placeholder="••••••••••••" />
          </label>

          <label className="check">
            <input type="checkbox" />
            Keep me logged in for 30 days
          </label>

          <div className="login-actions">
            <Button onClick={enter}>Log In</Button>
            <Button className="outline">Help</Button>
          </div>

          <div className="or">or</div>

          <Button className="wide outline">
            ◉ &nbsp; Continue with Google
          </Button>

          <Button className="wide outline">
            ◌ &nbsp; Continue with Apple
          </Button>

          <Button className="wide outline">
            ⌘ &nbsp; Log in with passkeys
          </Button>

          <a>Forgot Password?</a>

          <p className="account">
            Don't have an account? <b>Create one</b>
          </p>
        </div>
      </section>
    </main>
  );
}
