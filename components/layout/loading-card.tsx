import { Card, CardContent } from "@/components/ui/card";

export function LoadingCard() {
  return (
    <Card className="rounded-2xl border-border/60 shadow-sm">
      <CardContent className="flex items-center justify-center py-12 text-muted-foreground">
        Loading...
      </CardContent>
    </Card>
  );
}
