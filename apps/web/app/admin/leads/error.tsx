"use client";

import Link from "next/link";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  console.error("Admin leads error boundary", error);
  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle>Unable to load leads</CardTitle>
        <CardDescription>There was an error loading this page.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        <Button type="button" onClick={reset}>
          Try again
        </Button>
        <Button asChild variant="outline">
          <Link href="/admin">Back to admin</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
