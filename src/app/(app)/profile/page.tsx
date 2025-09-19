import ProfileForm from "@/components/profile-form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Compass } from "lucide-react";
import Link from "next/link";

export default function ProfilePage() {
  return (
    <div className="container mx-auto max-w-4xl py-12">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Card className="md:col-span-2">
            <ProfileForm />
        </Card>
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Compass/> Other Features</CardTitle>
                </CardHeader>
                <CardContent>
                    <Link href="/resources" className="text-primary hover:underline">
                        Find Learning Resources
                    </Link>
                    <CardDescription className="mt-1">Get AI-powered recommendations for courses, videos, and books.</CardDescription>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
