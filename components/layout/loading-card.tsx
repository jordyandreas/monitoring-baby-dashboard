import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";

export function LoadingCard() {
  return (
    <Card className="rounded-2xl border-border/60 shadow-sm">
      <CardContent className="flex items-center justify-center py-12" role="status" aria-busy="true">
        <Spinner className="size-6 text-muted-foreground" />
      </CardContent>
    </Card>
  );
}
