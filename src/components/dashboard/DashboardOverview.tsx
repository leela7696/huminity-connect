import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Clock, CheckCircle, AlertTriangle, TrendingUp, Calendar, FileText, DollarSign } from "lucide-react";

const DashboardOverview = () => {
  const { profile } = useAuth();

  const getKPICards = () => {
    switch (profile?.role) {
      case 'admin':
        return [
          { title: "Total Employees", value: "1,234", icon: Users, trend: "+12%", color: "text-blue-600" },
          { title: "Pending Tasks", value: "23", icon: Clock, trend: "-5%", color: "text-orange-600" },
          { title: "SLA Compliance", value: "98.5%", icon: CheckCircle, trend: "+2%", color: "text-green-600" },
          { title: "System Alerts", value: "3", icon: AlertTriangle, trend: "-50%", color: "text-red-600" }
        ];
      case 'hr':
        return [
          { title: "Pending Approvals", value: "15", icon: Clock, trend: "+8%", color: "text-orange-600" },
          { title: "Active Tickets", value: "42", icon: FileText, trend: "-12%", color: "text-blue-600" },
          { title: "Leave Requests", value: "28", icon: Calendar, trend: "+5%", color: "text-purple-600" },
          { title: "Onboarding Tasks", value: "7", icon: Users, trend: "+3%", color: "text-green-600" }
        ];
      case 'manager':
        return [
          { title: "Team Members", value: "12", icon: Users, trend: "0%", color: "text-blue-600" },
          { title: "Leave Requests", value: "3", icon: Calendar, trend: "+1", color: "text-orange-600" },
          { title: "Pending Approvals", value: "5", icon: Clock, trend: "-2", color: "text-purple-600" },
          { title: "Team Performance", value: "94%", icon: TrendingUp, trend: "+3%", color: "text-green-600" }
        ];
      default: // employee
        return [
          { title: "My Leave Balance", value: "18 days", icon: Calendar, trend: "-2", color: "text-blue-600" },
          { title: "Pending Approvals", value: "2", icon: Clock, trend: "0", color: "text-orange-600" },
          { title: "Documents Delivered", value: "8/10", icon: FileText, trend: "+2", color: "text-green-600" },
          { title: "Training Progress", value: "75%", icon: TrendingUp, trend: "+25%", color: "text-purple-600" }
        ];
    }
  };

  const getDashboardTitle = () => {
    const time = new Date().getHours();
    const greeting = time < 12 ? 'Good morning' : time < 18 ? 'Good afternoon' : 'Good evening';
    return `${greeting}, ${profile?.full_name || 'User'}!`;
  };

  const kpiCards = getKPICards();

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">
          {getDashboardTitle()}
        </h1>
        <p className="text-muted-foreground">
          Here's what's happening with your {profile?.role === 'admin' ? 'organization' : profile?.role === 'manager' ? 'team' : 'profile'} today.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiCards.map((card, index) => (
          <Card key={index} className="hover:shadow-lg transition-all duration-300 border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <card.icon className={`h-5 w-5 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground mb-1">
                {card.value}
              </div>
              <p className="text-xs text-muted-foreground flex items-center">
                <TrendingUp className="h-3 w-3 mr-1" />
                {card.trend} from last month
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Frequently used features</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            {profile?.role === 'admin' && (
              <>
                <div className="flex items-center space-x-3 p-3 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer transition-colors">
                  <Users className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium">Add Employee</span>
                </div>
                <div className="flex items-center space-x-3 p-3 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer transition-colors">
                  <FileText className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium">View Reports</span>
                </div>
              </>
            )}
            {profile?.role === 'hr' && (
              <>
                <div className="flex items-center space-x-3 p-3 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer transition-colors">
                  <Calendar className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium">Approve Leave</span>
                </div>
                <div className="flex items-center space-x-3 p-3 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer transition-colors">
                  <Users className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium">Employee Records</span>
                </div>
              </>
            )}
            {profile?.role === 'manager' && (
              <>
                <div className="flex items-center space-x-3 p-3 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer transition-colors">
                  <Users className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium">Team Overview</span>
                </div>
                <div className="flex items-center space-x-3 p-3 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer transition-colors">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium">Approve Requests</span>
                </div>
              </>
            )}
            {profile?.role === 'employee' && (
              <>
                <div className="flex items-center space-x-3 p-3 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer transition-colors">
                  <Calendar className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium">Request Leave</span>
                </div>
                <div className="flex items-center space-x-3 p-3 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer transition-colors">
                  <FileText className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium">My Documents</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest updates and notifications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">New employee onboarded</p>
                <p className="text-xs text-muted-foreground">John Smith joined the Marketing team</p>
                <p className="text-xs text-muted-foreground">2 hours ago</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-accent rounded-full mt-2"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Leave request approved</p>
                <p className="text-xs text-muted-foreground">Sarah's vacation request was approved</p>
                <p className="text-xs text-muted-foreground">4 hours ago</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">System update completed</p>
                <p className="text-xs text-muted-foreground">HR system updated to version 2.1</p>
                <p className="text-xs text-muted-foreground">1 day ago</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardOverview;