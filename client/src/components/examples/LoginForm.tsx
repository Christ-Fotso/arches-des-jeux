import LoginForm from "../LoginForm";

export default function LoginFormExample() {
  return (
    <LoginForm
      onSubmit={(email, password) =>
        console.log("Login:", { email, password })
      }
      onForgotPassword={() => console.log("Forgot password")}
    />
  );
}
