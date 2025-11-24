"use client";

import Link from "next/link";
import { User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface OwnerCardProps {
  user: {
    id: string;
    fullName: string | null;
    email: string;
  };
}

export function OwnerCard({ user }: OwnerCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Owner
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <div>
            <Link
              href={`/admin/users/${user.id}`}
              className="font-medium text-lg hover:underline"
            >
              {user.fullName || "—"}
            </Link>
            <p className="text-gray-500">{user.email}</p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/admin/users/${user.id}`}>View User</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
