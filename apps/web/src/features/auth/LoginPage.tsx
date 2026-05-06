import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { useState } from "react";
import { api } from "../../lib/api";
import { useAuthStore } from "../../stores/auth";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Card } from "../../components/ui/card";

const schema = z.object({ email: z.string().email(), password: z.string().min(6) });

export function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [loginError, setLoginError] = useState<string | null>(null);
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { email: "admin@coworking.com", password: "admin123" }
  });
  async function onSubmit(values: z.infer<typeof schema>) {
    setLoginError(null);
    try {
      const { data } = await api.post("/auth/login", values);
      setAuth(data.accessToken, data.user);
      navigate("/");
    } catch {
      setLoginError("Nao foi possivel entrar. Use admin@coworking.com com senha admin123 ou confira se a API esta pronta.");
    }
  }
  async function loginAsAdmin() {
    form.setValue("email", "admin@coworking.com");
    form.setValue("password", "admin123");
    await form.handleSubmit(onSubmit)();
  }
  return (
    <main className="grid min-h-screen place-items-center px-4">
      <Card className="w-full max-w-sm p-5">
        <div className="mb-5 flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-md bg-primary text-primary-foreground">
            <ShieldCheck size={20} />
          </div>
          <div>
            <h1 className="text-lg font-semibold">Coworking Service Desk</h1>
            <p className="text-sm text-muted-foreground">NOC operacional</p>
          </div>
        </div>
        <form className="space-y-3" onSubmit={form.handleSubmit(onSubmit)}>
          <Input aria-label="Email" autoComplete="username" type="email" {...form.register("email")} />
          <Input aria-label="Senha" autoComplete="current-password" type="password" {...form.register("password")} />
          <div className="rounded-md border border-border bg-background px-3 py-2 text-xs text-muted-foreground">
            Demo: <span className="font-mono text-foreground">admin@coworking.com</span> / <span className="font-mono text-foreground">admin123</span>
          </div>
          {(form.formState.errors.email || form.formState.errors.password || loginError) && (
            <p className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-foreground">
              {loginError ?? "Informe um email valido e senha com pelo menos 6 caracteres."}
            </p>
          )}
          <Button className="w-full" disabled={form.formState.isSubmitting} type="submit">
            {form.formState.isSubmitting ? "Entrando..." : "Entrar"}
          </Button>
          <Button className="w-full bg-muted text-foreground hover:bg-background" disabled={form.formState.isSubmitting} onClick={loginAsAdmin} type="button">
            Entrar como admin demo
          </Button>
        </form>
      </Card>
    </main>
  );
}
