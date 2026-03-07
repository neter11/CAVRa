import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { useTaskCounts, useResetTasksMonth, useResetTasksCompleted, useResetTasksAll } from "@/hooks/use-tasks";
import { useToast } from "@/hooks/use-toast";

interface ResetTasksModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ResetTasksModal({ isOpen, onOpenChange }: ResetTasksModalProps) {
  const [step, setStep] = useState<"select" | "confirm">("select");
  const [selectedOption, setSelectedOption] = useState<"month" | "completed" | "all" | null>(null);
  const { data: counts, isLoading: countsLoading } = useTaskCounts();
  const resetMonth = useResetTasksMonth();
  const resetCompleted = useResetTasksCompleted();
  const resetAll = useResetTasksAll();
  const { toast } = useToast();

  const handleSelectOption = (option: "month" | "completed" | "all") => {
    setSelectedOption(option);
    setStep("confirm");
  };

  const handleConfirm = async () => {
    try {
      let mutation;
      let message = "";

      if (selectedOption === "month") {
        mutation = resetMonth;
        message = "Tarefas do mês resetadas com sucesso.";
      } else if (selectedOption === "completed") {
        mutation = resetCompleted;
        message = "Tarefas concluídas resetadas com sucesso.";
      } else if (selectedOption === "all") {
        mutation = resetAll;
        message = "Todas as tarefas foram resetadas com sucesso.";
      }

      if (mutation) {
        await mutation.mutateAsync();
        toast({ title: "Sucesso", description: message });
        setStep("select");
        setSelectedOption(null);
        onOpenChange(false);
      }
    } catch (error) {
      toast({ title: "Erro", description: "Falha ao resetar tarefas.", variant: "destructive" });
    }
  };

  const handleCancel = () => {
    setStep("select");
    setSelectedOption(null);
    onOpenChange(false);
  };

  const optionCounts = {
    month: counts?.month ?? 0,
    completed: counts?.completed ?? 0,
    all: counts?.all ?? 0,
  };

  const isLoading = resetMonth.isPending || resetCompleted.isPending || resetAll.isPending;

  if (step === "select") {
    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Resetar Tarefas
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Selecione quais tarefas deseja remover. Essa ação não pode ser desfeita.
            </p>

            <div className="space-y-3">
              <button
                onClick={() => handleSelectOption("month")}
                disabled={optionCounts.month === 0 || countsLoading}
                className="w-full p-4 border rounded-lg text-left hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <div className="font-semibold">Resetar tarefas do mês</div>
                <div className="text-sm text-muted-foreground">
                  {optionCounts.month === 0 ? "Nenhuma tarefa neste mês" : `${optionCounts.month} tarefa(s) será(ão) removida(s)`}
                </div>
              </button>

              <button
                onClick={() => handleSelectOption("completed")}
                disabled={optionCounts.completed === 0 || countsLoading}
                className="w-full p-4 border rounded-lg text-left hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <div className="font-semibold">Resetar tarefas concluídas</div>
                <div className="text-sm text-muted-foreground">
                  {optionCounts.completed === 0 ? "Nenhuma tarefa concluída" : `${optionCounts.completed} tarefa(s) será(ão) removida(s)`}
                </div>
              </button>

              <button
                onClick={() => handleSelectOption("all")}
                disabled={optionCounts.all === 0 || countsLoading}
                className="w-full p-4 border rounded-lg text-left hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <div className="font-semibold">Resetar todas as tarefas</div>
                <div className="text-sm text-muted-foreground">
                  {optionCounts.all === 0 ? "Nenhuma tarefa disponível" : `${optionCounts.all} tarefa(s) será(ão) removida(s)`}
                </div>
              </button>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={handleCancel}>
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (step === "confirm") {
    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Confirmar Remoção
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Tem certeza que deseja continuar? Essa ação não pode ser desfeita.
            </p>

            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
              <div className="font-semibold text-destructive">
                {selectedOption === "month"
                  ? `${optionCounts.month} tarefa(s) será(ão) removida(s)`
                  : selectedOption === "completed"
                    ? `${optionCounts.completed} tarefa(s) será(ão) removida(s)`
                    : `${optionCounts.all} tarefa(s) será(ão) removida(s)`}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => {
                  setStep("select");
                  setSelectedOption(null);
                }}
                disabled={isLoading}
              >
                Voltar
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleConfirm}
                disabled={isLoading}
              >
                {isLoading ? "Removendo..." : "Remover"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return null;
}
