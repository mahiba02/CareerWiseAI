import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, BookOpen, Compass, FileText, Route, TrendingUp } from "lucide-react";
import Link from "next/link";

const features = [
    {
        title: "Personalized Career Path",
        description: "Generate a personalized career report based on your profile and a short quiz.",
        href: "/profile",
        icon: <Compass className="w-8 h-8 text-primary" />,
    },
    {
        title: "Resource Recommendations",
        description: "Find the best YouTube videos, courses, and books to learn a new skill.",
        href: "/resources",
        icon: <BookOpen className="w-8 h-8 text-primary" />,
    },
    {
        title: "Roadmap Provider",
        description: "Get a step-by-step learning roadmap from your profile and interests.",
        href: "/roadmap",
        icon: <Route className="w-8 h-8 text-primary" />,
    },
    {
        title: "Job Market Insights",
        description: "Get real-time insights into the job market, including trends, skills in demand, and salary benchmarks.",
        href: "/insights",
        icon: <TrendingUp className="w-8 h-8 text-primary" />,
    },
    {
        title: "AI Resume Builder",
        description: "Create a professional, tailored resume with AI-powered suggestions and formatting.",
        href: "/resume",
        icon: <FileText className="w-8 h-8 text-primary" />,
    }
]

export default function FeaturesPage() {
    return (
        <div className="container mx-auto max-w-3xl py-12">
            <header className="text-center mb-12">
                <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl font-headline">
                    What would you like to do?
                </h1>
                <p className="mt-4 text-xl text-muted-foreground">
                    Choose one of the features below to get started.
                </p>
            </header>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {features.map((feature) => (
                    <Link href={feature.href} key={feature.title} className="block hover:scale-105 transition-transform duration-300">
                        <Card className="h-full shadow-lg">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-primary/10 rounded-lg">
                                            {feature.icon}
                                        </div>
                                        <CardTitle>{feature.title}</CardTitle>
                                    </div>
                                    <ArrowRight className="text-muted-foreground" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <CardDescription>{feature.description}</CardDescription>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    );
}
