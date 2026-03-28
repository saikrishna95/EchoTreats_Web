import { LogOut } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface SignOutModalProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

const SignOutModal = ({ open, onCancel, onConfirm }: SignOutModalProps) => {
  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onCancel(); }}>
      <DialogContent className="max-w-sm rounded-2xl p-8 text-center border-border/50 gap-0">
        <div className="flex justify-center mb-4">
          <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center">
            <LogOut className="w-6 h-6 text-red-500" />
          </div>
        </div>
        <h2 className="font-heading text-lg font-semibold text-foreground mb-2">Sign Out?</h2>
        <p className="font-body text-sm text-muted-foreground mb-6">
          Are you sure you want to sign out of your account?
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2.5 border border-border rounded-xl font-body text-sm font-medium text-foreground hover:bg-secondary transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 py-2.5 bg-red-500 text-white rounded-xl font-body text-sm font-semibold hover:bg-red-600 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SignOutModal;
