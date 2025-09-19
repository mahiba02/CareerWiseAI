"use client";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { type HTMLAttributes } from "react";

export function BackButton({ className, children, ...rest }: HTMLAttributes<HTMLButtonElement>) {
  const router = useRouter();
  const onClick = () => {
    try {
      if (typeof window !== "undefined" && window.history.length > 1) {
        router.back();
      } else {
        router.push("/");
      }
    } catch {
      router.push("/");
    }
  };
  return (
    <Button variant="ghost" onClick={onClick} className={className} aria-label="Go back" {...rest}>
      <ArrowLeft className="mr-2 h-4 w-4" /> {children || "Back"}
    </Button>
  );
}
