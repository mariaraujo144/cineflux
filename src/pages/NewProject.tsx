import { useState } from "react";
import { useNavigate } from "react-router";
import { trpc } from "@/providers/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Film, Check } from "lucide-react";
import { Link } from "react-router";

const moduleOptions = [
  { id: "approval_sites", label: "Sites de Aprovação (Figurino, Locação, Elenco)" },
  { id: "bob_tasks", label: "Tarefas do Bob (Telegram)" },
  { id: "ppm_builder", label: "PPM Builder" },
  { id: "schedule", label: "Cronograma" },
  { id: "od", label: "Ordem do Dia" },
  { id: "script_breakdown", label: "Decupagem de Roteiro" },
];

const statusOptions = [
  { value: "draft", label: "Rascunho" },
  { value: "pre_production", label: "Pré-produção" },
  { value: "in_production", label: "Em produção" },
  { value: "post_production", label: "Pós-produção" },
];

export default function NewProject() {
  const navigate = useNavigate();
  const utils = trpc.useUtils();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    clientName: "",
    campaignName: "",
    status: "draft" as const,
    language: "pt",
    modules: ["approval_sites", "bob_tasks"] as string[],
  });

  const createMutation = trpc.project.create.useMutation({
    onSuccess: (data) => {
      utils.project.list.invalidate();
      navigate(`/projects/${data?.id}`);
    },
  });

  const handleSubmit = () => {
    createMutation.mutate({
      name: formData.name,
      clientName: formData.clientName || undefined,
      campaignName: formData.campaignName || undefined,
      status: formData.status,
      language: formData.language,
      modules: formData.modules as any,
    });
  };

  const toggleModule = (moduleId: string) => {
    setFormData((prev) => ({
      ...prev,
      modules: prev.modules.includes(moduleId)
        ? prev.modules.filter((m) => m !== moduleId)
        : [...prev.modules, moduleId],
    }));
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/dashboard">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Novo Job</h1>
          <p className="text-muted-foreground">Crie um novo projeto de produção</p>
        </div>
      </div>

      {/* Steps indicator */}
      <div className="flex items-center gap-2">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`h-2 flex-1 rounded-full transition-colors ${
              s <= step ? "bg-primary" : "bg-muted"
            }`}
          />
        ))}
      </div>

      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Film className="h-5 w-5 text-primary" />
              Informações básicas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Job *</Label>
              <Input
                id="name"
                placeholder="Ex: Campanha Nike Verão 2026"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clientName">Cliente</Label>
              <Input
                id="clientName"
                placeholder="Ex: Nike"
                value={formData.clientName}
                onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="campaignName">Campanha</Label>
              <Input
                id="campaignName"
                placeholder="Ex: Verão 2026"
                value={formData.campaignName}
                onChange={(e) => setFormData({ ...formData, campaignName: e.target.value })}
              />
            </div>
            <div className="flex justify-end">
              <Button
                onClick={() => setStep(2)}
                disabled={!formData.name.trim()}
              >
                Continuar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Configuração do Job</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status inicial</Label>
              <Select
                value={formData.status}
                onValueChange={(v) => setFormData({ ...formData, status: v as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="language">Idioma</Label>
              <Select
                value={formData.language}
                onValueChange={(v) => setFormData({ ...formData, language: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pt">Português</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Español</SelectItem>
                  <SelectItem value="fr">Français</SelectItem>
                  <SelectItem value="hi">Hindi</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>
                Voltar
              </Button>
              <Button onClick={() => setStep(3)}>Continuar</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Módulos do Job</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Selecione quais módulos serão ativados para este job:
            </p>
            <div className="space-y-3">
              {moduleOptions.map((mod) => (
                <div key={mod.id} className="flex items-start gap-3">
                  <Checkbox
                    id={mod.id}
                    checked={formData.modules.includes(mod.id)}
                    onCheckedChange={() => toggleModule(mod.id)}
                  />
                  <Label htmlFor={mod.id} className="font-normal cursor-pointer">
                    {mod.label}
                  </Label>
                </div>
              ))}
            </div>
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)}>
                Voltar
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={createMutation.isPending || formData.modules.length === 0}
              >
                {createMutation.isPending ? (
                  "Criando..."
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Criar Job
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
