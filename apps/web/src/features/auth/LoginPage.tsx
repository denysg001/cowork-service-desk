import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { api } from "../../lib/api";
import { useAuthStore } from "../../stores/auth";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Card } from "../../components/ui/card";

const schema = z.object({ email: z.string().email(), password: z.string().min(8) });

export function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { email: "admin@coworking.com", password: "admin123" }
  });
  async function onSubmit(values: z.infer<typeof schema>) {
    const { data } = await api.post("/auth/login", values);
    setAuth(data.accessToken, data.user);
    navigate("/");
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
          <Input aria-label="Email" type="email" {...form.register("email")} />
          <Input aria-label="Senha" type="password" {...form.register("password")} />
          <Button className="w-full" type="submit">Entrar</Button>
        </form>
      </Card>
    </main>
  );
}
