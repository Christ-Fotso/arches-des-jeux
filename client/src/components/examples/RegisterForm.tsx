import RegisterForm from "../RegisterForm";

export default function RegisterFormExample() {
  return (
    <RegisterForm
      onSubmit={(name, email, password) =>
        console.log("Register:", { name, email, password })
      }
    />
  );
}
