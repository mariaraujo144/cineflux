import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Film,
  Bot,
  Globe,
  Calendar,
  Presentation,
  FileText,
  LayoutList,
  Camera,
  Palette,
  UserCheck,
  MapPin,
  CheckCircle2,
  ArrowRight,
  Zap,
  Shield,
  Users,
  ChevronRight,
} from "lucide-react";

const features = [
  {
    icon: Camera,
    title: "Sites de Aprovação",
    description: "Figurino, locação, elenco, arte e fotografia — tudo com aprovação/seleção por link.",
  },
  {
    icon: Bot,
    title: "Bob (Telegram)",
    description: "Assistente de IA no Telegram que organiza tarefas, prazos e integra com Google Sheets/Calendar.",
  },
  {
    icon: Presentation,
    title: "PPM Builder",
    description: "Monte Propostas de Produção de forma guiada com links de pastas, roteiros e blocos visuais.",
  },
  {
    icon: Calendar,
    title: "Cronograma",
    description: "Timeline simples de eventos e entregas, sincronizado com Google Calendar do cliente.",
  },
  {
    icon: FileText,
    title: "Decupagem de Roteiro",
    description: "Transforme roteiros PDF/DOCX em planilhas estruturadas para orçamento e pré-produção.",
  },
  {
    icon: LayoutList,
    title: "Ordem do Dia",
    description: "Gere e distribua a OD de produção com preenchimento rápido e atualização em tempo real.",
  },
];

const modules = [
  { icon: Camera, label: "Figurino" },
  { icon: MapPin, label: "Locação" },
  { icon: UserCheck, label: "Elenco" },
  { icon: Palette, label: "Arte" },
  { icon: FileText, label: "Decupagem" },
  { icon: Calendar, label: "Cronograma" },
];

const testimonials = [
  {
    quote: "O CineFlux transformou nossa pré-produção. O Bob no Telegram já é parte da equipe.",
    author: "Produtora independente",
    role: "São Paulo",
  },
  {
    quote: "Conseguimos aprovar figurino de uma campanha inteira em 2 dias. Antes levava 2 semanas.",
    author: "Diretor de Produção",
    role: "Agência de Publicidade",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-xl font-bold tracking-tight">
            <Film className="h-6 w-6 text-primary" />
            CineFlux
          </Link>
          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link to="/login">Entrar</Link>
            </Button>
            <Button asChild>
              <Link to="/login">Começar Grátis</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge variant="secondary" className="mb-6">
            <Zap className="h-3 w-3 mr-1" />
            SaaS para Produção Audiovisual
          </Badge>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6">
            Produza filmes<br />
            <span className="text-primary">sem caos</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            O CineFlux é a camada operacional que conecta toda a sua produção publicitária —
            do roteiro à entrega — em um único dashboard com IA, Telegram e Google Workspace.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link to="/login">
                Criar conta grátis
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
            <Button size="lg" variant="outline">
              Ver demonstração
            </Button>
          </div>
        </div>
      </section>

      {/* Module Icons */}
      <section className="border-y bg-muted/30 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-muted-foreground mb-6 uppercase tracking-wider font-medium">
            Todos os módulos que você precisa
          </p>
          <div className="flex flex-wrap justify-center gap-8">
            {modules.map((mod) => (
              <div key={mod.label} className="flex flex-col items-center gap-2">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <mod.icon className="h-6 w-6 text-primary" />
                </div>
                <span className="text-sm font-medium">{mod.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight mb-4">
              Um ecossistema, não ferramentas soltas
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Cada módulo resolve um problema específico, mas todos compartilham o mesmo projeto,
              autenticação, storage e billing.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <Card key={feature.title} className="group hover:shadow-lg transition-all">
                <CardHeader>
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Architecture */}
      <section className="py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold tracking-tight mb-6">
                Arquitetura híbrida:<br />Telegram + Web App
              </h2>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                    <Bot className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Telegram = campo</h3>
                    <p className="text-sm text-muted-foreground">
                      Bob recebe áudio/texto no set, cria tarefas, organiza prazos e integra
                      automaticamente com Google Sheets e Calendar do cliente.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                    <Globe className="h-5 w-5 text-emerald-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Web App = controle</h3>
                    <p className="text-sm text-muted-foreground">
                      Dashboard com todos os jobs, sites de aprovação, PPM, cronograma,
                      ordem do dia, métricas e gestão de equipe.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-card border rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-3 p-3 border rounded-lg bg-background">
                <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-blue-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Bob</p>
                  <p className="text-xs text-muted-foreground">Tarefa criada: "Confirmar locação Praça XV"</p>
                </div>
                <Badge variant="outline" className="text-xs">14:32</Badge>
              </div>
              <div className="flex items-center gap-3 p-3 border rounded-lg bg-background">
                <div className="h-8 w-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <Camera className="h-4 w-4 text-emerald-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Site de Aprovação</p>
                  <p className="text-xs text-muted-foreground">Campanha Nike — Figurino aprovado</p>
                </div>
                <Badge variant="default" className="text-xs">APROVADO</Badge>
              </div>
              <div className="flex items-center gap-3 p-3 border rounded-lg bg-background">
                <div className="h-8 w-8 rounded-full bg-amber-500/10 flex items-center justify-center">
                  <Calendar className="h-4 w-4 text-amber-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Cronograma</p>
                  <p className="text-xs text-muted-foreground">Filmagem Dia 1 — 08:00 Praça XV</p>
                </div>
                <Badge variant="outline" className="text-xs">Amanhã</Badge>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight text-center mb-12">
            O que dizem as produtoras
          </h2>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {testimonials.map((t, i) => (
              <Card key={i} className="bg-muted/30">
                <CardContent className="pt-6">
                  <p className="text-lg italic mb-4">"{t.quote}"</p>
                  <p className="font-medium text-sm">{t.author}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Plans Preview */}
      <section className="py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold tracking-tight mb-4">
            Planos simples, sem surpresas
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-12">
            Comece grátis. Escalone conforme cresce.
          </p>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Starter</CardTitle>
                <CardDescription>Freelancers e produtoras pequenas</CardDescription>
                <div className="text-3xl font-bold mt-2">R$ 99<span className="text-lg font-normal text-muted-foreground">/mês</span></div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" />5 projetos</p>
                <p className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" />50 fotos/projeto</p>
                <p className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" />3 membros</p>
              </CardContent>
            </Card>
            <Card className="border-primary ring-1 ring-primary">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle>Pro</CardTitle>
                  <Badge>Popular</Badge>
                </div>
                <CardDescription>Produtoras médias e agências</CardDescription>
                <div className="text-3xl font-bold mt-2">R$ 249<span className="text-lg font-normal text-muted-foreground">/mês</span></div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" />20 projetos</p>
                <p className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" />200 fotos/projeto</p>
                <p className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" />10 membros</p>
                <p className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" />PPM + OD</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Studio</CardTitle>
                <CardDescription>Agências grandes</CardDescription>
                <div className="text-3xl font-bold mt-2">R$ 599<span className="text-lg font-normal text-muted-foreground">/mês</span></div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" />Projetos ilimitados</p>
                <p className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" />Mídias ilimitadas</p>
                <p className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" />Equipe ilimitada</p>
                <p className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" />Todos os módulos</p>
              </CardContent>
            </Card>
          </div>
          <Button size="lg" className="mt-8" asChild>
            <Link to="/login">
              Criar conta grátis
              <ChevronRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 text-lg font-bold">
              <Film className="h-5 w-5 text-primary" />
              CineFlux
            </Link>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><Shield className="h-3.5 w-3.5" /> OAuth Google</span>
              <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> Multi-tenant</span>
              <span className="flex items-center gap-1"><Globe className="h-3.5 w-3.5" /> 5 idiomas</span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            © 2026 CineFlux. SaaS para produção audiovisual.
          </p>
        </div>
      </footer>
    </div>
  );
}
