"use client";

import { Database, Trash2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DeleteAdminEmbeddingsPineconeAll200 } from "@/lib/api/generated/models";

interface DangerZoneCardProps {
  deleteResult: DeleteAdminEmbeddingsPineconeAll200 | null;
  onDeletePinecone: () => void;
}

export function DangerZoneCard({ deleteResult, onDeletePinecone }: DangerZoneCardProps) {
  return (
    <div className="space-y-6">
      {deleteResult && (
        <Alert
          variant={deleteResult.success ? "default" : "destructive"}
          className={deleteResult.success ? "bg-green-50 text-green-700 border-green-200" : ""}
        >
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{deleteResult.message}</AlertDescription>
        </Alert>
      )}

      <Card className="border-red-200 dark:border-red-900">
        <CardHeader>
          <CardTitle className="text-red-600 dark:text-red-400 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>
            These actions are destructive and cannot be undone. Please proceed with extreme caution.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 border border-red-200 dark:border-red-900 rounded-lg bg-red-50 dark:bg-red-950/20">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5 text-red-600 dark:text-red-400" />
                <h4 className="font-medium text-red-900 dark:text-red-100">Delete All Pinecone Data</h4>
              </div>
              <p className="text-sm text-red-700 dark:text-red-300">
                Permanently delete ALL vectors from the Pinecone index. This will remove all embeddings
                for all sites and users. The chatbot will lose all knowledge until sites are re-crawled.
              </p>
            </div>
            <Button
              variant="destructive"
              onClick={onDeletePinecone}
              className="ml-4 bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete All
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
