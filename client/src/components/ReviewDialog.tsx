import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";
import { Label } from "@/components/ui/label";

interface ReviewDialogProps {
  productId: string;
  productTitle: string;
  onClose: () => void;
}

export default function ReviewDialog({ productId, productTitle, onClose }: ReviewDialogProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");

  const createReviewMutation = useMutation({
    mutationFn: async (data: { productId: string; rating: number; comment?: string }) => {
      const response = await apiRequest("POST", "/api/reviews", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reviews", productId] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: t("reviews.success"),
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: t("reviews.error"),
        description: error.message,
      });
    },
  });

  const handleSubmit = () => {
    if (comment.trim().length < 10 && comment.trim().length > 0) {
      toast({
        variant: "destructive",
        title: t("reviews.error"),
        description: "Comment must be at least 10 characters",
      });
      return;
    }

    createReviewMutation.mutate({
      productId,
      rating,
      comment: comment.trim() || undefined,
    });
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent data-testid="dialog-review">
        <DialogHeader>
          <DialogTitle>{t("reviews.leaveReview")}</DialogTitle>
          <DialogDescription>{productTitle}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label>{t("reviews.yourRating")}</Label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="transition-transform hover:scale-110"
                  data-testid={`button-star-${star}`}
                >
                  <Star
                    className={`w-8 h-8 ${
                      star <= (hoverRating || rating)
                        ? "fill-primary text-primary"
                        : "text-gray-300 dark:text-gray-600"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="comment">{t("reviews.yourComment")}</Label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={t("reviews.commentPlaceholder")}
              rows={4}
              data-testid="textarea-comment"
            />
            <p className="text-xs text-muted-foreground">
              {comment.length} / 1000 characters
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={createReviewMutation.isPending}
            data-testid="button-cancel"
          >
            {t("reviews.cancel")}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={createReviewMutation.isPending}
            data-testid="button-submit-review"
          >
            {createReviewMutation.isPending ? "..." : t("reviews.submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
