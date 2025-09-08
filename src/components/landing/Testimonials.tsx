import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Star } from "lucide-react";
import { useState, useEffect } from "react";

const testimonials = [
  {
    name: "Sarah Johnson",
    role: "HR Director",
    company: "TechCorp Inc.",
    content: "Hinfinity HR Connect transformed our HR operations. The automation features saved us 15 hours per week on administrative tasks.",
    rating: 5,
    initials: "SJ"
  },
  {
    name: "Michael Chen", 
    role: "People Operations Manager",
    company: "StartupXYZ",
    content: "The employee onboarding process is now seamless. New hires love the digital experience and managers save significant time.",
    rating: 5,
    initials: "MC"
  },
  {
    name: "Emily Rodriguez",
    role: "VP Human Resources",
    company: "Global Solutions",
    content: "Amazing analytics and reporting capabilities. We can now make data-driven decisions about our workforce strategy.",
    rating: 5,
    initials: "ER"
  }
];

export const Testimonials = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="py-20 bg-muted/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-foreground mb-4">
            Trusted by HR Leaders
          </h2>
          <p className="text-xl text-muted-foreground">
            See what our customers say about their experience
          </p>
        </div>

        <div className="relative max-w-4xl mx-auto">
          <Card className="bg-card border-border/50 shadow-lg">
            <CardContent className="p-8">
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  {Array.from({ length: testimonials[currentIndex].rating }).map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                
                <blockquote className="text-xl text-muted-foreground mb-6 italic leading-relaxed">
                  "{testimonials[currentIndex].content}"
                </blockquote>
                
                <div className="flex items-center justify-center space-x-4">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                      {testimonials[currentIndex].initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-left">
                    <div className="font-semibold text-foreground">
                      {testimonials[currentIndex].name}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {testimonials[currentIndex].role} at {testimonials[currentIndex].company}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="flex justify-center mt-6 space-x-2">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-3 h-3 rounded-full transition-colors ${
                  index === currentIndex ? 'bg-primary' : 'bg-muted-foreground/30'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};