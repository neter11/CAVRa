import { useState } from "react";
import { useParams, Link } from "wouter";
import { format } from "date-fns";
import { ArrowLeft, Edit, Trash2, Calendar, MapPin, DollarSign, Building, Percent, FileText, CheckCircle2, History } from "lucide-react";
import { useProperty, useDeleteProperty } from "@/hooks/use-properties";
import { useNotes, useCreateNote, useDeleteNote } from "@/hooks/use-notes";
import { useExpenses, useCreateExpense, useDeleteExpense } from "@/hooks/use-expenses";
import { PropertyForm } from "@/components/PropertyForm";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function PropertyDetails() {
  const { id } = useParams();
  const propertyId = parseInt(id || "0", 10);
  
  const { data: property, isLoading } = useProperty(propertyId);
  const deleteMutation = useDeleteProperty();
  
  const { data: notes } = useNotes(propertyId);
  const createNote = useCreateNote();
  const deleteNote = useDeleteNote();
  
  const { data: expenses } = useExpenses(propertyId);
  const createExpense = useCreateExpense();
  const deleteExpense = useDeleteExpense();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [newExpenseDesc, setNewExpenseDesc] = useState("");
  const [newExpenseAmount, setNewExpenseAmount] = useState("");

  if (isLoading) {
    return <div className="p-10 animate-pulse"><div className="h-8 bg-muted w-1/4 rounded mb-8"></div><div className="h-64 bg-muted rounded-2xl"></div></div>;
  }

  if (!property) {
    return <div className="p-10 text-center"><h2 className="text-2xl font-bold">Property not found</h2><Link href="/properties" className="text-primary mt-4 inline-block hover:underline">Back to properties</Link></div>;
  }

  const netIncome = property.rentAmount - (property.isAgencyManaged ? (property.agencyFee || 0) : 0);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    await createNote.mutateAsync({ propertyId, data: { content: newNote } });
    setNewNote("");
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpenseDesc || !newExpenseAmount) return;
    await createExpense.mutateAsync({ propertyId, data: { description: newExpenseDesc, amount: Number(newExpenseAmount) } });
    setNewExpenseDesc("");
    setNewExpenseAmount("");
  };

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <Link href="/properties" className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Properties
        </Link>
        <div className="flex gap-2">
          <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2"><Edit className="h-4 w-4" /> Edit</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader><DialogTitle>Edit Property</DialogTitle></DialogHeader>
              <PropertyForm initialData={property} onSuccess={() => setIsEditOpen(false)} />
            </DialogContent>
          </Dialog>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" className="gap-2"><Trash2 className="h-4 w-4" /> Delete</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>This action cannot be undone. This will permanently delete the property and all its associated data.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => {
                  deleteMutation.mutate(propertyId, {
                    onSuccess: () => window.location.href = "/properties"
                  });
                }}>Delete Property</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="bg-card rounded-3xl border shadow-sm overflow-hidden">
        <div className="h-48 md:h-64 w-full relative bg-muted">
          {property.imageUrl ? (
             <img src={property.imageUrl} alt={property.name} className="w-full h-full object-cover" />
          ) : (
            <img src="https://pixabay.com/get/gf3711f9996fe0a2f56d0192d03baa47b99d857132a8f84509670da5d5bef071742778ae361dd65b01641e498284a9a44ebabcf34428aec1b821585f9545d0a39_1280.jpg" alt="Placeholder" className="w-full h-full object-cover opacity-80" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-6 left-6 right-6 text-white flex justify-between items-end">
            <div>
              <Badge variant="secondary" className="mb-3 bg-white/20 backdrop-blur-md text-white border-white/10 hover:bg-white/30">{property.status.toUpperCase()}</Badge>
              <h1 className="text-3xl md:text-4xl font-display font-bold text-white">{property.name}</h1>
              <div className="flex items-center mt-2 text-white/80">
                <MapPin className="h-4 w-4 mr-1.5" /> {property.location}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 divide-x md:divide-y-0 divide-y border-b">
          <div className="p-4 md:p-6 flex flex-col justify-center">
            <p className="text-xs uppercase tracking-wider font-medium text-muted-foreground mb-1">Monthly Rent</p>
            <p className="text-2xl font-bold font-display text-primary">${property.rentAmount}</p>
          </div>
          <div className="p-4 md:p-6 flex flex-col justify-center">
            <p className="text-xs uppercase tracking-wider font-medium text-muted-foreground mb-1">Net Income</p>
            <p className="text-2xl font-bold font-display text-emerald-600">${netIncome}</p>
          </div>
          <div className="p-4 md:p-6 flex flex-col justify-center">
            <p className="text-xs uppercase tracking-wider font-medium text-muted-foreground mb-1">Type</p>
            <p className="text-lg font-bold capitalize flex items-center gap-2"><Building className="h-5 w-5 text-muted-foreground" /> {property.type}</p>
          </div>
          <div className="p-4 md:p-6 flex flex-col justify-center">
            <p className="text-xs uppercase tracking-wider font-medium text-muted-foreground mb-1">Agency</p>
            <p className="text-lg font-bold flex items-center gap-2">
              {property.isAgencyManaged ? <><CheckCircle2 className="h-5 w-5 text-primary" /> Managed</> : "Self-Managed"}
            </p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid grid-cols-4 w-full max-w-2xl bg-muted/50 p-1 rounded-xl">
          <TabsTrigger value="overview" className="rounded-lg data-[state=active]:shadow-sm">Overview</TabsTrigger>
          <TabsTrigger value="history" className="rounded-lg data-[state=active]:shadow-sm">History</TabsTrigger>
          <TabsTrigger value="notes" className="rounded-lg data-[state=active]:shadow-sm">Notes</TabsTrigger>
          <TabsTrigger value="expenses" className="rounded-lg data-[state=active]:shadow-sm">Expenses</TabsTrigger>
        </TabsList>
        
        <div className="mt-6 bg-card border rounded-2xl p-6 min-h-[400px]">
          <TabsContent value="overview" className="mt-0 space-y-6">
            <h3 className="text-lg font-bold font-display flex items-center gap-2 border-b pb-4"><FileText className="h-5 w-5 text-primary" /> Contract Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Contract Start</p>
                  <p className="font-semibold text-lg flex items-center gap-2 mt-1">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    {property.contractStart ? format(new Date(property.contractStart), "MMM do, yyyy") : "Not set"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Contract End</p>
                  <p className="font-semibold text-lg flex items-center gap-2 mt-1">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    {property.contractEnd ? format(new Date(property.contractEnd), "MMM do, yyyy") : "Not set"}
                  </p>
                </div>
              </div>
              <div className="bg-muted/30 p-5 rounded-xl border border-muted">
                <h4 className="font-medium mb-3 text-sm text-muted-foreground uppercase tracking-wider">Financial Breakdown</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span>Gross Rent:</span> <span className="font-semibold">${property.rentAmount}</span></div>
                  {property.isAgencyManaged && (
                    <div className="flex justify-between text-destructive"><span>Agency Fee:</span> <span>-${property.agencyFee}</span></div>
                  )}
                  <div className="flex justify-between pt-2 border-t font-bold text-base mt-2">
                    <span>Net Income:</span> <span className="text-emerald-600">${netIncome}</span>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="history" className="mt-0">
             <h3 className="text-lg font-bold font-display flex items-center gap-2 border-b pb-4 mb-6"><History className="h-5 w-5 text-primary" /> Payment History (Mock)</h3>
             <div className="space-y-4">
               {[1,2,3].map((i) => (
                 <div key={i} className="flex justify-between items-center p-4 border rounded-xl bg-card hover:bg-muted/50 transition-colors">
                   <div className="flex items-center gap-4">
                     <div className="h-10 w-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center"><DollarSign className="h-5 w-5" /></div>
                     <div>
                       <p className="font-bold">Rent Received</p>
                       <p className="text-sm text-muted-foreground">{format(new Date(new Date().setMonth(new Date().getMonth() - i + 1)), "MMMM yyyy")}</p>
                     </div>
                   </div>
                   <div className="text-right">
                     <p className="font-bold text-lg text-emerald-600">+${property.rentAmount}</p>
                     <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 mt-1">Paid</Badge>
                   </div>
                 </div>
               ))}
             </div>
          </TabsContent>

          <TabsContent value="notes" className="mt-0">
            <h3 className="text-lg font-bold font-display flex items-center gap-2 border-b pb-4 mb-6"><FileText className="h-5 w-5 text-primary" /> Property Notes</h3>
            
            <form onSubmit={handleAddNote} className="mb-8 flex gap-3 items-start">
              <Textarea 
                placeholder="Add a note about maintenance, tenants, etc..." 
                className="resize-none flex-1 min-h-[80px]"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
              />
              <Button type="submit" disabled={createNote.isPending || !newNote.trim()}>Add Note</Button>
            </form>

            <div className="space-y-4">
              {notes?.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No notes yet.</p>
              ) : (
                notes?.map(note => (
                  <div key={note.id} className="p-4 bg-muted/30 border rounded-xl group relative">
                    <p className="text-sm whitespace-pre-wrap pr-8">{note.content}</p>
                    <p className="text-xs text-muted-foreground mt-3 font-medium">
                      {note.createdAt ? format(new Date(note.createdAt), "MMM do, yyyy • h:mm a") : "Recently"}
                    </p>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="absolute top-2 right-2 h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive transition-all"
                      onClick={() => deleteNote.mutate({ id: note.id, propertyId })}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="expenses" className="mt-0">
             <h3 className="text-lg font-bold font-display flex items-center gap-2 border-b pb-4 mb-6"><DollarSign className="h-5 w-5 text-primary" /> Maintenance & Expenses</h3>
             
             <form onSubmit={handleAddExpense} className="mb-8 p-5 bg-muted/30 border rounded-xl space-y-4">
               <h4 className="font-semibold text-sm">Log New Expense</h4>
               <div className="flex flex-col sm:flex-row gap-4">
                 <Input 
                   placeholder="Description (e.g. Plumbing repair)" 
                   className="flex-[2]"
                   value={newExpenseDesc}
                   onChange={(e) => setNewExpenseDesc(e.target.value)}
                 />
                 <Input 
                   type="number" 
                   placeholder="Amount ($)" 
                   className="flex-1"
                   value={newExpenseAmount}
                   onChange={(e) => setNewExpenseAmount(e.target.value)}
                 />
                 <Button type="submit" disabled={createExpense.isPending || !newExpenseDesc || !newExpenseAmount}>Add Expense</Button>
               </div>
             </form>

             <div className="space-y-3">
              {expenses?.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No expenses logged.</p>
              ) : (
                expenses?.map(expense => (
                  <div key={expense.id} className="flex justify-between items-center p-4 border rounded-xl">
                    <div>
                      <p className="font-semibold">{expense.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {expense.date ? format(new Date(expense.date), "MMM do, yyyy") : "Recently"}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="font-bold text-destructive">-${expense.amount}</p>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="text-muted-foreground hover:text-destructive h-8 w-8"
                        onClick={() => deleteExpense.mutate({ id: expense.id, propertyId })}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
