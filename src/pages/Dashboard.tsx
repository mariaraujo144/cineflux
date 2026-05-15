import { Link } from "react-router";
import { trpc } from "@/providers/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  PlusCircle,
  Film,
  Calendar,
  Users,
  ExternalLink,
  MoreHorizontal,
  Trash2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" | "success" }> = {
  draft: { label: "Rascunho", variant: "secondary" },
  pre_production: { label: "Pré-produção", variant: "outline" },
  in_production: { label: "Em produção", variant: "default" },
  post_production: { label: "Pós-produção", variant: "default" },
  delivered: { label: "Entregue", variant: "success" },
  archived: { label: "Arquivado", variant: "secondary" },
};

const moduleLabels: Record<string, string> = {
  approval_sites: "Sites de Aprovação",
  bob_tasks: "Tarefas Bob",
  ppm_builder: "PPM",
  schedule: "Cronograma",
  od: "OD",
  script_breakdown: "Decupagem",
};

export default function Dashboard() {
  const utils = trpc.useUtils();
  const { data: projects, isLoading } = trpc.project.list.useQuery();
  const { data: stats } = trpc.project.stats.useQuery();
  const deleteMutation = trpc.project.delete.useMutation({
    onSuccess: () => utils.project.list.invalidate(),
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie seus jobs de produção audiovisual
          </p>
        </div>
        <Button asChild>
          <Link to="/projects/new">
            <PlusCircle className="h-4 w-4 mr-2" />
            Novo Job
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Jobs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalProjects ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Em Produção
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(stats?.statusCounts as Record<string, number>)?.in_production ?? 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Módulos Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeModules ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pré-produção
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(stats?.statusCounts as Record<string, number>)?.pre_production ?? 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Jobs List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Meus Jobs</h2>

        {isLoading && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        )}

        {!isLoading && projects?.length === 0 && (
          <Card className="p-12 text-center">
            <Film className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhum job ainda</h3>
            <p className="text-muted-foreground mb-4">
              Crie seu primeiro job para começar a organizar sua produção
            </p>
            <Button asChild>
              <Link to="/projects/new">
                <PlusCircle className="h-4 w-4 mr-2" />
                Criar Job
              </Link>
            </Button>
          </Card>
        )}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects?.map((project) => {
            const status = statusLabels[project.status] ?? { label: project.status, variant: "secondary" };
            return (
              <Card key={project.id} className="group hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <Link
                        to={`/projects/${project.id}`}
                        className="font-semibold text-lg hover:text-primary transition-colors line-clamp-1"
                      >
                        {project.name}
                      </Link>
                      {project.clientName && (
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {project.clientName}
                          {project.campaignName && ` — ${project.campaignName}`}
                        </p>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link to={`/projects/${project.id}`}>Ver detalhes</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => {
                            if (confirm("Tem certeza que deseja excluir este job?")) {
                              deleteMutation.mutate({ id: project.id });
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <Badge variant={status.variant as any} className="mt-2 w-fit">
                    {status.label}
                  </Badge>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(project.createdAt).toLocaleDateString("pt-BR")}
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      {project.members?.length ?? 1} membro(s)
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {project.modules?.slice(0, 4).map((mod) => (
                      <Badge
                        key={mod.id}
                        variant={mod.status === "active" ? "outline" : "secondary"}
                        className="text-xs"
                      >
                        {moduleLabels[mod.moduleType] ?? mod.moduleType}
                      </Badge>
                    ))}
                  </div>
                  <div className="mt-4 flex gap-2">
                    {project.modules?.map((mod) =>
                      mod.externalUrl ? (
                        <Button
                          key={mod.id}
                          variant="outline"
                          size="sm"
                          className="text-xs"
                          asChild
                        >
                          <a href={mod.externalUrl} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-3 w-3 mr-1" />
                            {moduleLabels[mod.moduleType] ?? mod.moduleType}
                          </a>
                        </Button>
                      ) : null
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
