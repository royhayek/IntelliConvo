"use client";

import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";
import type { AdminTransaction } from "@/lib/api/generated/models";

interface RefundDialogProps {
  transaction: AdminTransaction | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  refundAmount: string;
  onRefundAmountChange: (value: string) => void;
  refundReason: string;
  onRefundReasonChange: (value: string) => void;
  onRefund: () => void;
  isRefunding: boolean;
}

export function RefundDialog({
  transaction,
  open,
  onOpenChange,
  refundAmount,
  onRefundAmountChange,
  refundReason,
  onRefundReasonChange,
  onRefund,
  isRefunding,
}: RefundDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Issue Refund</DialogTitle>
          <DialogDescription>
            Issue a full or partial refund for this transaction. The refund will
            be processed through Stripe.
          </DialogDescription>
        </DialogHeader>
        {transaction && (
          <div className="space-y-4">
            <div className="bg-gray-50 dark:bg-slate-800 p-4 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Transaction ID:</span>
                <span className="font-mono">{transaction.id.slice(0, 8)}...</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Original Amount:</span>
                <span className="font-medium">
                  {formatCurrency(transaction.amount, transaction.currency)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Customer:</span>
                <span>{transaction.user?.email || "N/A"}</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="refundAmount">Refund Amount (in cents)</Label>
              <Input
                id="refundAmount"
                type="number"
                placeholder={`Leave empty for full refund (${transaction.amount} cents)`}
                value={refundAmount}
                onChange={(e) => onRefundAmountChange(e.target.value)}
                min={1}
                max={transaction.amount}
              />
              <p className="text-xs text-gray-500">
                Leave empty to issue a full refund
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="refundReason">Refund Reason</Label>
              <Select value={refundReason} onValueChange={onRefundReasonChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="requested_by_customer">
                    Requested by Customer
                  </SelectItem>
                  <SelectItem value="duplicate">Duplicate Payment</SelectItem>
                  <SelectItem value="fraudulent">Fraudulent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isRefunding}
          >
            Cancel
          </Button>
          <Button onClick={onRefund} disabled={isRefunding}>
            {isRefunding ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Processing...
              </>
            ) : (
              <>
                <RotateCcw className="h-4 w-4 mr-2" />
                Issue Refund
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
