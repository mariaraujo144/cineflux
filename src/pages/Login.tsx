import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Film } from "lucide-react";

function getKimiOAuthUrl() {
  const kimiAuthUrl = import.meta.env.VITE_KIMI_AUTH_URL;
  const appID = import.meta.env.VITE_APP_ID;
  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = btoa(redirectUri);

  const url = new URL(`${kimiAuthUrl}/api/oauth/authorize`);
  url.searchParams.set("client_id", appID);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "profile");
  url.searchParams.set("state", state);

  return url.toString();
}

export default function Login() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-muted/30">
      <div className="mb-8 flex items-center gap-2 text-2xl font-bold">
        <Film className="h-8 w-8 text-primary" />
        CineFlux
      </div>
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle>Bem-vindo ao CineFlux</CardTitle>
          <p className="text-sm text-muted-foreground">
            Faca login para gerenciar seus jobs de producao
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            className="w-full"
            size="lg"
            onClick={() => {
              window.location.href = getKimiOAuthUrl();
            }}
          >
            Entrar com Kimi
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            Em breve: login com Google para acesso ao Google Workspace
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
