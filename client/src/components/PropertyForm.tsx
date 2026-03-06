import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertPropertySchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useCreateProperty, useUpdateProperty } from "@/hooks/use-properties";
import type { Property } from "@shared/schema";

// Form schema explicitly parses strings to dates and numbers where needed
const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  location: z.string().min(1, "Location is required"),
  type: z.string().min(1, "Type is required"),
  rentAmount: z.coerce.number().min(0, "Must be positive"),
  isAgencyManaged: z.boolean().default(false),
  agencyFee: z.coerce.number().min(0).default(0),
  status: z.string().default("available"),
  contractStart: z.coerce.date().optional().nullable(),
  contractEnd: z.coerce.date().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
});

type FormValues = z.infer<typeof formSchema>;

export function PropertyForm({
  initialData,
  onSuccess,
}: {
  initialData?: Property;
  onSuccess?: () => void;
}) {
  const createMutation = useCreateProperty();
  const updateMutation = useUpdateProperty();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData ? {
      ...initialData,
      contractStart: initialData.contractStart ? new Date(initialData.contractStart) : null,
      contractEnd: initialData.contractEnd ? new Date(initialData.contractEnd) : null,
    } : {
      name: "",
      location: "",
      type: "apartment",
      rentAmount: 0,
      isAgencyManaged: false,
      agencyFee: 0,
      status: "available",
      imageUrl: "",
    },
  });

  const isAgencyManaged = form.watch("isAgencyManaged");
  const rent = form.watch("rentAmount");
  const fee = form.watch("agencyFee");
  const netIncome = rent - (isAgencyManaged ? fee : 0);

  const onSubmit = async (values: FormValues) => {
    // Clean up nullable dates
    const data = {
      ...values,
      contractStart: values.contractStart || undefined,
      contractEnd: values.contractEnd || undefined,
      imageUrl: values.imageUrl || undefined,
    };

    if (initialData) {
      await updateMutation.mutateAsync({ id: initialData.id, updates: data });
    } else {
      await createMutation.mutateAsync(data);
    }
    onSuccess?.();
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Property Name</FormLabel>
                <FormControl><Input placeholder="Sunset Apartments" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Location</FormLabel>
                <FormControl><Input placeholder="123 Main St, City" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="apartment">Apartment</SelectItem>
                    <SelectItem value="house">House</SelectItem>
                    <SelectItem value="commercial">Commercial</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="rented">Rented</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="bg-muted/50 p-4 rounded-xl border space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="rentAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Monthly Rent ($)</FormLabel>
                  <FormControl><Input type="number" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="isAgencyManaged"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md p-4 pt-8">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Agency Managed</FormLabel>
                  </div>
                </FormItem>
              )}
            />
          </div>

          {isAgencyManaged && (
            <FormField
              control={form.control}
              name="agencyFee"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Agency Fee ($)</FormLabel>
                  <FormControl><Input type="number" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <div className="pt-2 flex justify-between items-center text-sm font-medium border-t">
            <span className="text-muted-foreground">Estimated Net Income:</span>
            <span className="text-lg text-primary">${netIncome.toLocaleString()}/mo</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="contractStart"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contract Start</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                    onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : null)}
                    onBlur={field.onBlur}
                    name={field.name}
                    ref={field.ref}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="contractEnd"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contract End</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                    onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : null)}
                    onBlur={field.onBlur}
                    name={field.name}
                    ref={field.ref}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="imageUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Image URL (Optional)</FormLabel>
              <FormControl><Input placeholder="https://..." {...field} value={field.value || ''} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={isPending} className="w-full sm:w-auto px-8">
            {isPending ? "Saving..." : initialData ? "Update Property" : "Add Property"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
