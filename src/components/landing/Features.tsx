import { Card, CardContent } from "@/components/ui/card";
import { UserCheck, Calendar, DollarSign, BarChart3 } from "lucide-react";

const features = [
  {
    icon: UserCheck,
    title: "Employee Lifecycle",
    description: "Seamless onboarding and offboarding processes with automated workflows and digital document management."
  },
  {
    icon: Calendar,
    title: "Leave Management", 
    description: "Intelligent leave tracking with automated approvals, calendar integration, and real-time balance updates."
  },
  {
    icon: DollarSign,
    title: "Payroll & Benefits",
    description: "Automated payroll processing with tax calculations, benefits administration, and compliance reporting."
  },
  {
    icon: BarChart3,
    title: "Analytics",
    description: "Powerful insights with real-time dashboards, performance metrics, and predictive workforce analytics."
  }
];

export const Features = () => {
  return (
    <section className="py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-foreground mb-4">
            Everything You Need to Manage Your Team
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Comprehensive HR solutions designed for modern workplaces
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-2 border-border/50 hover:border-primary/20"
            >
              <CardContent className="p-6 text-center">
                <div className="mb-4 inline-flex p-3 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-foreground">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};