import { useNavigate } from "react-router";
import { trpc } from "@/providers/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, ArrowLeft, Loader2 } from "lucide-react";
import { Link } from "react-router";

export default function Plans() {
  const navigate = useNavigate();
  const { data: plans } = trpc.plan.list.useQuery();
  const { data: mySub } = trpc.subscription.mySubscription.useQuery();
  const createSub = trpc.subscription.create.useMutation({
    onSuccess: () => {
      navigate("/dashboard");
    },
  });

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(cents / 100);
  };

  const moduleLabels: Record<string, string> = {
    approval_sites: "Sites de Aprovação",
    bob_tasks: "Tarefas Bob",
    schedule: "Cronograma",
    ppm_builder: "PPM Builder",
    od: "Ordem do Dia",
    script_breakdown: "Decupagem de Roteiro",
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/dashboard">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Planos CineFlux</h1>
          <p className="text-muted-foreground">Escolha o plano ideal para sua produção</p>
        </div>
      </div>

      {mySub && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4">
            <p className="text-sm">
              Plano atual: <Badge variant="default">{mySub.plan?.name}</Badge>{" "}
              <span className="text-muted-foreground capitalize">({mySub.status})</span>
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        {plans?.map((plan) => {
          const isCurrent = mySub?.planId === plan.id;
          const modules = (plan.modulesEnabled as string[]) ?? [];

          return (
            <Card
              key={plan.id}
              className={`relative flex flex-col ${
                isCurrent ? "border-primary ring-1 ring-primary" : ""
              }`}
            >
              {isCurrent && (
                <Badge className="absolute -top-2 left-1/2 -translate-x-1/2">
                  Plano Atual
                </Badge>
              )}
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-2">
                  <span className="text-3xl font-bold">{formatPrice(plan.priceMonthly)}</span>
                  <span className="text-muted-foreground">/mês</span>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <div className="space-y-4 flex-1">
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Limites:</p>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li className="flex items-center gap-2">
                        <Check className="h-3.5 w-3.5 text-primary" />
                        {plan.maxProjects === -1
                          ? "Projetos ilimitados"
                          : `Até ${plan.maxProjects} projetos`}
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-3.5 w-3.5 text-primary" />
                        {plan.maxMediaPerProject === -1
                          ? "Mídias ilimitadas"
                          : `Até ${plan.maxMediaPerProject} mídias/projeto`}
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-3.5 w-3.5 text-primary" />
                        {plan.maxTeamMembers === -1
                          ? "Equipe ilimitada"
                          : `Até ${plan.maxTeamMembers} membros`}
                      </li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Módulos inclusos:</p>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      {modules.map((mod) => (
                        <li key={mod} className="flex items-center gap-2">
                          <Check className="h-3.5 w-3.5 text-primary" />
                          {moduleLabels[mod] ?? mod}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <Button
                  className="w-full mt-6"
                  variant={isCurrent ? "outline" : "default"}
                  disabled={isCurrent || createSub.isPending}
                  onClick={() => createSub.mutate({ planId: plan.id })}
                >
                  {createSub.isPending && createSub.variables?.planId === plan.id ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processando...
                    </>
                  ) : isCurrent ? (
                    "Plano Atual"
                  ) : (
                    `Assinar ${plan.name.split(" ").pop()}`
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
