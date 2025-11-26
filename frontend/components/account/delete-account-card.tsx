"use client";

import { useState } from "react";
import { Trash2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface DeleteAccountCardProps {
  onDelete: () => void;
  isPending: boolean;
  isError: boolean;
}

export function DeleteAccountCard({
  onDelete,
  isPending,
  isError,
}: DeleteAccountCardProps) {
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDelete = () => {
    if (showConfirm) {
      onDelete();
    } else {
      setShowConfirm(true);
    }
  };

  return (
    <Card className="border-red-200">
      <CardHeader>
        <CardTitle className="text-red-600">Danger Zone</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="p-4 border border-red-200 dark:border-red-800/50 rounded-lg bg-red-50 dark:bg-red-900/20 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-red-900 dark:text-red-300">
                Delete Account
              </h4>
            </div>
            <div className="flex-shrink-0">
              {!showConfirm ? (
                <Button variant="destructive" onClick={handleDelete}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Account
                </Button>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-red-600 font-medium">Are you sure?</p>
                  <div className="flex space-x-2">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleDelete}
                      disabled={isPending}
                    >
                      {isPending ? "Deleting..." : "Yes, Delete"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowConfirm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
          <p className="text-xs sm:text-sm text-red-700 dark:text-red-400">
            Permanently delete your account and all associated data. This action
            cannot be undone.
          </p>
        </div>

        {isError && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to delete account. Please try again or contact support.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
