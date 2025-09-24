import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Briefcase, GraduationCap, CreditCard, Monitor, Shield, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const personalInfoSchema = z.object({
  full_name: z.string().min(2, 'Full name is required'),
  date_of_birth: z.string().min(1, 'Date of birth is required'),
  phone: z.string().min(10, 'Valid phone number required'),
  address: z.string().min(10, 'Address is required'),
  emergency_contact_name: z.string().min(2, 'Emergency contact name is required'),
  emergency_contact_phone: z.string().min(10, 'Emergency contact phone is required'),
  nationality: z.string().min(1, 'Nationality is required'),
  marital_status: z.string().min(1, 'Marital status is required')
});

const jobInfoSchema = z.object({
  position: z.string().min(1, 'Position is required'),
  department: z.string().min(1, 'Department is required'),
  start_date: z.string().min(1, 'Start date is required'),
  employment_type: z.string().min(1, 'Employment type is required'),
  reporting_manager: z.string().min(1, 'Reporting manager is required'),
  work_location: z.string().min(1, 'Work location is required')
});

const educationSchema = z.object({
  highest_qualification: z.string().min(1, 'Highest qualification is required'),
  institution: z.string().min(1, 'Institution is required'),
  graduation_year: z.string().min(4, 'Graduation year is required'),
  previous_experience: z.string().optional(),
  certifications: z.string().optional(),
  skills: z.string().optional()
});

const bankingSchema = z.object({
  bank_name: z.string().min(1, 'Bank name is required'),
  account_number: z.string().min(5, 'Account number is required'),
  routing_number: z.string().min(5, 'Routing number is required'),
  account_holder_name: z.string().min(1, 'Account holder name is required'),
  tax_id: z.string().min(1, 'Tax ID is required')
});

const itAccessSchema = z.object({
  preferred_email: z.string().email('Valid email is required'),
  system_access: z.array(z.string()).min(1, 'At least one system access is required'),
  hardware_requirements: z.string().optional(),
  software_requirements: z.string().optional()
});

const complianceSchema = z.object({
  background_check_consent: z.boolean().refine(val => val === true, 'Background check consent is required'),
  drug_test_consent: z.boolean().refine(val => val === true, 'Drug test consent is required'),
  confidentiality_agreement: z.boolean().refine(val => val === true, 'Confidentiality agreement must be accepted'),
  code_of_conduct: z.boolean().refine(val => val === true, 'Code of conduct must be accepted')
});

const fullFormSchema = z.object({
  personal_info: personalInfoSchema,
  job_info: jobInfoSchema,
  education_background: educationSchema,
  banking_payroll: bankingSchema,
  it_system_access: itAccessSchema,
  compliance_declaration: complianceSchema
});

type FormData = z.infer<typeof fullFormSchema>;

export const OnboardingDetailsForm = () => {
  const { toast } = useToast();
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState('personal');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(fullFormSchema),
    defaultValues: {
      personal_info: {
        full_name: profile?.full_name || '',
        date_of_birth: '',
        phone: profile?.phone || '',
        address: profile?.address || '',
        emergency_contact_name: profile?.emergency_contact_name || '',
        emergency_contact_phone: profile?.emergency_contact_phone || '',
        nationality: '',
        marital_status: ''
      },
      job_info: {
        position: profile?.position || '',
        department: profile?.department || '',
        start_date: '',
        employment_type: 'full-time',
        reporting_manager: '',
        work_location: 'office'
      },
      education_background: {
        highest_qualification: '',
        institution: '',
        graduation_year: '',
        previous_experience: '',
        certifications: '',
        skills: ''
      },
      banking_payroll: {
        bank_name: '',
        account_number: '',
        routing_number: '',
        account_holder_name: profile?.full_name || '',
        tax_id: ''
      },
      it_system_access: {
        preferred_email: '',
        system_access: [],
        hardware_requirements: '',
        software_requirements: ''
      },
      compliance_declaration: {
        background_check_consent: false,
        drug_test_consent: false,
        confidentiality_agreement: false,
        code_of_conduct: false
      }
    }
  });

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      // Get employee ID from profiles table
      const { data: employee, error: employeeError } = await supabase
        .from('employees')
        .select('id')
        .eq('profile_id', profile?.id)
        .single();

      if (employeeError) throw employeeError;

      // Insert onboarding details
      const { error: insertError } = await supabase
        .from('employee_onboarding_details')
        .insert({
          employee_id: employee.id,
          personal_info: data.personal_info,
          job_info: data.job_info,
          education_background: data.education_background,
          banking_payroll: data.banking_payroll,
          it_system_access: data.it_system_access,
          compliance_declaration: data.compliance_declaration,
          status: 'pending'
        });

      if (insertError) throw insertError;

      // Generate onboarding tasks from template
      const { error: tasksError } = await supabase.rpc('create_onboarding_tasks_from_template', {
        p_employee_id: employee.id
      });

      if (tasksError) throw tasksError;

      // Create notification for HR
      await supabase.rpc('create_notification', {
        p_user_id: profile?.user_id,
        p_title: 'New Onboarding Submission',
        p_message: `${profile?.full_name} has submitted their onboarding details for verification.`,
        p_type: 'info'
      });

      toast({
        title: 'Onboarding Details Submitted',
        description: 'Your onboarding information has been submitted successfully. HR will review and verify your details soon.',
      });

    } catch (error: any) {
      toast({
        title: 'Submission Failed',
        description: error.message || 'Failed to submit onboarding details. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const tabs = [
    { id: 'personal', label: 'Personal Info', icon: User },
    { id: 'job', label: 'Job Info', icon: Briefcase },
    { id: 'education', label: 'Education', icon: GraduationCap },
    { id: 'banking', label: 'Banking', icon: CreditCard },
    { id: 'it', label: 'IT Access', icon: Monitor },
    { id: 'compliance', label: 'Compliance', icon: Shield }
  ];

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <Card className="bg-background/50 backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center text-foreground">
            Employee Onboarding Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-6 mb-8">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        <span className="hidden sm:inline">{tab.label}</span>
                      </TabsTrigger>
                    );
                  })}
                </TabsList>

                <TabsContent value="personal" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="personal_info.full_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Enter your full name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="personal_info.date_of_birth"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date of Birth</FormLabel>
                          <FormControl>
                            <Input {...field} type="date" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="personal_info.phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Enter your phone number" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="personal_info.nationality"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nationality</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Enter your nationality" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="personal_info.marital_status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Marital Status</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select marital status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="single">Single</SelectItem>
                              <SelectItem value="married">Married</SelectItem>
                              <SelectItem value="divorced">Divorced</SelectItem>
                              <SelectItem value="widowed">Widowed</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="personal_info.address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Textarea {...field} placeholder="Enter your full address" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="personal_info.emergency_contact_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Emergency Contact Name</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Enter emergency contact name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="personal_info.emergency_contact_phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Emergency Contact Phone</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Enter emergency contact phone" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>

                {/* Additional tabs content would continue here... */}
                
                <div className="flex justify-between pt-8">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      const currentIndex = tabs.findIndex(tab => tab.id === activeTab);
                      if (currentIndex > 0) {
                        setActiveTab(tabs[currentIndex - 1].id);
                      }
                    }}
                    disabled={tabs.findIndex(tab => tab.id === activeTab) === 0}
                  >
                    Previous
                  </Button>
                  
                  {activeTab === 'compliance' ? (
                    <Button type="submit" disabled={isSubmitting} className="gap-2">
                      <Send className="h-4 w-4" />
                      {isSubmitting ? 'Submitting...' : 'Submit Onboarding Details'}
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      onClick={() => {
                        const currentIndex = tabs.findIndex(tab => tab.id === activeTab);
                        if (currentIndex < tabs.length - 1) {
                          setActiveTab(tabs[currentIndex + 1].id);
                        }
                      }}
                    >
                      Next
                    </Button>
                  )}
                </div>
              </Tabs>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};