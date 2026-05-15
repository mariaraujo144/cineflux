import { useParams, Link } from "react-router";
import { trpc } from "@/providers/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  ExternalLink,
  Film,
  Calendar,
  Users,
  Link2,
  Settings,
  CheckCircle2,
  Clock,
  FileText,
  Camera,
  Palette,
  UserCheck,
  MapPin,
  Bot,
  LayoutList,
  Presentation,
} from "lucide-react";

const statusConfig: Record<string, { label: string; color: string }> = {
  draft: { label: "Rascunho", color: "bg-gray-500" },
  pre_production: { label: "Pré-produção", color: "bg-amber-500" },
  in_production: { label: "Em produção", color: "bg-blue-500" },
  post_production: { label: "Pós-produção", color: "bg-purple-500" },
  delivered: { label: "Entregue", color: "bg-green-500" },
  archived: { label: "Arquivado", color: "bg-gray-400" },
};

const moduleConfig: Record<string, { label: string; icon: any; description: string; color: string }> = {
  approval_sites: {
    label: "Sites de Aprovação",
    icon: Camera,
    description: "Figurino, locação, elenco, arte, fotografia",
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  bob_tasks: {
    label: "Tarefas Bob",
    icon: Bot,
    description: "Tarefas do Telegram integradas ao Google Sheets",
    color: "bg-blue-50 text-blue-700 border-blue-200",
  },
  ppm_builder: {
    label: "PPM Builder",
    icon: Presentation,
    description: "Montagem de proposta de produção",
    color: "bg-violet-50 text-violet-700 border-violet-200",
  },
  schedule: {
    label: "Cronograma",
    icon: Calendar,
    description: "Timeline de eventos e entregas",
    color: "bg-amber-50 text-amber-700 border-amber-200",
  },
  od: {
    label: "Ordem do Dia",
    icon: LayoutList,
    description: "OD de produção e distribuição",
    color: "bg-rose-50 text-rose-700 border-rose-200",
  },
  script_breakdown: {
    label: "Decupagem",
    icon: FileText,
    description: "Decupagem de roteiro para planilha",
    color: "bg-cyan-50 text-cyan-700 border-cyan-200",
  },
};

const moduleTypeToSubtype: Record<string, { label: string; icon: any }[]> = {
  approval_sites: [
    { label: "Figurino", icon: Palette },
    { label: "Locação", icon: MapPin },
    { label: "Elenco", icon: UserCheck },
    { label: "Arte", icon: Palette },
    { label: "Fotografia", icon: Camera },
  ],
};

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const projectId = parseInt(id ?? "0", 10);

  const { data: project, isLoading } = trpc.project.byId.useQuery(
    { id: projectId },
    { enabled: projectId > 0 }
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <Film className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-lg font-medium">Job não encontrado</h2>
        <Button asChild className="mt-4">
          <Link to="/dashboard">Voltar ao Dashboard</Link>
        </Button>
      </div>
    );
  }

  const status = statusConfig[project.status] ?? { label: project.status, color: "bg-gray-500" };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/dashboard">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
          </div>
          {project.clientName && (
            <p className="text-muted-foreground ml-11">
              {project.clientName}
              {project.campaignName && ` — ${project.campaignName}`}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Badge className={`${status.color} text-white`}>{status.label}</Badge>
          <Button variant="outline" size="sm" asChild>
            <Link to={`/projects/${project.id}/edit`}>
              <Settings className="h-3.5 w-3.5 mr-1" />
              Editar
            </Link>
          </Button>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              Criado em
            </div>
            <p className="font-medium mt-1">
              {new Date(project.createdAt).toLocaleDateString("pt-BR")}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              Equipe
            </div>
            <p className="font-medium mt-1">{project.members?.length ?? 1} membro(s)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4" />
              Módulos ativos
            </div>
            <p className="font-medium mt-1">
              {project.modules?.filter((m) => m.status === "active").length ?? 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Link2 className="h-4 w-4" />
              Links externos
            </div>
            <p className="font-medium mt-1">
              {project.modules?.filter((m) => m.externalUrl).length ?? 0}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="modules" className="space-y-4">
        <TabsList>
          <TabsTrigger value="modules">Módulos</TabsTrigger>
          <TabsTrigger value="links">Links & Assets</TabsTrigger>
          <TabsTrigger value="team">Equipe</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
        </TabsList>

        <TabsContent value="modules" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {project.modules?.map((mod) => {
              const config = moduleConfig[mod.moduleType] ?? {
                label: mod.moduleType,
                icon: Settings,
                description: "",
                color: "bg-gray-50 text-gray-700 border-gray-200",
              };
              const Icon = config.icon;

              return (
                <Card key={mod.id} className={`border ${config.color}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="h-5 w-5" />
                        <CardTitle className="text-base">{config.label}</CardTitle>
                      </div>
                      <Badge variant={mod.status === "active" ? "default" : "secondary"} className="text-xs">
                        {mod.status === "active" ? "Ativo" : mod.status}
                      </Badge>
                    </div>
                    <CardDescription>{config.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-3">
                    {mod.externalUrl && (
                      <Button variant="outline" size="sm" className="w-full" asChild>
                        <a href={mod.externalUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-3.5 w-3.5 mr-2" />
                          Abrir {config.label}
                        </a>
                      </Button>
                    )}
                    {mod.externalId && (
                      <p className="text-xs text-muted-foreground">
                        ID: {mod.externalId}
                      </p>
                    )}
                    {mod.lastSyncAt && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Última sincronização: {new Date(mod.lastSyncAt).toLocaleString("pt-BR")}
                      </p>
                    )}
                    {!mod.externalUrl && mod.moduleType === "approval_sites" && (
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground">
                          Sites de aprovação disponíveis:
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          {(moduleTypeToSubtype[mod.moduleType] ?? []).map((sub) => {
                            const SubIcon = sub.icon;
                            return (
                              <Button
                                key={sub.label}
                                variant="outline"
                                size="sm"
                                className="text-xs justify-start"
                              >
                                <SubIcon className="h-3 w-3 mr-1" />
                                {sub.label}
                              </Button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    {!mod.externalUrl && mod.status === "active" && (
                      <p className="text-xs text-muted-foreground">
                        Aguardando integração com serviço externo...
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="links" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Links e Assets do Job</CardTitle>
              <CardDescription>
                Todos os links externos e assets associados a este projeto
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {project.googleDriveFolderId && (
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="font-medium">Pasta Google Drive</p>
                      <p className="text-sm text-muted-foreground">{project.googleDriveFolderId}</p>
                    </div>
                  </div>
                </div>
              )}
              {project.googleSheetId && (
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="font-medium">Google Sheets</p>
                      <p className="text-sm text-muted-foreground">{project.googleSheetId}</p>
                    </div>
                  </div>
                </div>
              )}
              {project.modules?.filter((m) => m.externalUrl).length === 0 && (
                <p className="text-muted-foreground text-center py-8">
                  Nenhum link externo configurado ainda
                </p>
              )}
              {project.modules?.map((mod) =>
                mod.externalUrl ? (
                  <div key={mod.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <ExternalLink className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">
                          {moduleConfig[mod.moduleType]?.label ?? mod.moduleType}
                        </p>
                        <p className="text-sm text-muted-foreground truncate max-w-md">
                          {mod.externalUrl}
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <a href={mod.externalUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                ) : null
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Equipe do Job</CardTitle>
              <CardDescription>Membros e permissões</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {project.members?.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                        {(member.name ?? member.email ?? "M").charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium">{member.name ?? member.email ?? "Membro"}</p>
                        <p className="text-sm text-muted-foreground capitalize">{member.role}</p>
                      </div>
                    </div>
                    <Badge variant={member.acceptedAt ? "default" : "secondary"}>
                      {member.acceptedAt ? "Ativo" : "Pendente"}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurações do Job</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div>
                  <p className="text-sm font-medium">Slug</p>
                  <p className="text-sm text-muted-foreground">{project.slug}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Idioma</p>
                  <p className="text-sm text-muted-foreground uppercase">{project.language}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Visibilidade</p>
                  <p className="text-sm text-muted-foreground">
                    {project.isPublic ? "Público" : "Privado (somente com link)"}
                  </p>
                </div>
                {project.telegramChatId && (
                  <div>
                    <p className="text-sm font-medium">Telegram Chat ID</p>
                    <p className="text-sm text-muted-foreground">{project.telegramChatId}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
