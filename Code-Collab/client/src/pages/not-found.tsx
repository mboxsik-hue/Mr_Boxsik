import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#131320] p-4">
      <Card className="w-full max-w-md mx-4 bg-[#1a1a2e] border-white/10">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2 text-destructive font-bold text-xl items-center">
            <AlertCircle className="h-8 w-8" />
            <h1>404 Page Not Found</h1>
          </div>

          <p className="mt-4 text-muted-foreground text-sm mb-6">
            The page you requested doesn't exist or has been moved.
          </p>

          <Link href="/">
            <Button className="w-full font-bold">
              Return Home
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
