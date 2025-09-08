import { Users, Mail, Phone, MapPin, Twitter, Linkedin, Github } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="bg-foreground text-background py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Users className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">Hinfinity HR Connect</span>
            </div>
            <p className="text-background/80 leading-relaxed">
              Transforming HR operations with AI-powered solutions for modern workplaces.
            </p>
            <div className="flex space-x-4">
              <Twitter className="h-5 w-5 hover:text-primary cursor-pointer transition-colors" />
              <Linkedin className="h-5 w-5 hover:text-primary cursor-pointer transition-colors" />
              <Github className="h-5 w-5 hover:text-primary cursor-pointer transition-colors" />
            </div>
          </div>

          {/* Products */}
          <div>
            <h3 className="font-semibold mb-4">Products</h3>
            <ul className="space-y-2 text-background/80">
              <li className="hover:text-background cursor-pointer transition-colors">Employee Management</li>
              <li className="hover:text-background cursor-pointer transition-colors">Leave Management</li>
              <li className="hover:text-background cursor-pointer transition-colors">Payroll & Benefits</li>
              <li className="hover:text-background cursor-pointer transition-colors">Analytics Dashboard</li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-semibold mb-4">Company</h3>
            <ul className="space-y-2 text-background/80">
              <li className="hover:text-background cursor-pointer transition-colors">About Us</li>
              <li className="hover:text-background cursor-pointer transition-colors">Careers</li>
              <li className="hover:text-background cursor-pointer transition-colors">Privacy Policy</li>
              <li className="hover:text-background cursor-pointer transition-colors">Terms of Service</li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold mb-4">Contact</h3>
            <div className="space-y-3 text-background/80">
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4" />
                <span>hello@hinfinityhr.com</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4" />
                <span>+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4" />
                <span>San Francisco, CA</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-background/20 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-background/60">
              © 2024 Hinfinity HR Connect. All rights reserved.
            </p>
            <p className="text-background/60 mt-4 md:mt-0">
              Built with ❤️ for modern HR teams
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};