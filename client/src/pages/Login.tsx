import LoginForm from "@/components/LoginForm";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";
import type { User } from "@shared/schema";

export default function Login() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();

  const loginMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const res = await apiRequest("POST", "/api/auth/login", { email, password });
      return await res.json() as { user: Omit<User, "password">; token: string };
    },
    onSuccess: (data) => {
      login(data.user, data.token);
      if (data.user.role === "ADMIN") {
        setLocation("/admin");
      } else {
        setLocation("/products");
      }
    },
  });

  return (
    <LoginForm
      onSubmit={(email, password) => loginMutation.mutate({ email, password })}
      error={loginMutation.error?.message}
      isLoading={loginMutation.isPending}
    />
  );
}
