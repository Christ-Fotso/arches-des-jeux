import RegisterForm from "@/components/RegisterForm";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";
import type { User } from "@shared/schema";

export default function Register() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();

  const registerMutation = useMutation({
    mutationFn: async ({ name, email, password }: { name: string; email: string; password: string }) => {
      const res = await apiRequest("POST", "/api/auth/register", { 
        name, 
        email, 
        password,
        role: "USER"
      });
      return await res.json() as { user: Omit<User, "password">; token: string };
    },
    onSuccess: (data) => {
      login(data.user, data.token);
      setLocation("/products");
    },
  });

  return (
    <RegisterForm
      onSubmit={(name, email, password) => registerMutation.mutate({ name, email, password })}
      error={registerMutation.error?.message}
      isLoading={registerMutation.isPending}
    />
  );
}
