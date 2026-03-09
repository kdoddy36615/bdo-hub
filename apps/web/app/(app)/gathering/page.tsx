import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pickaxe } from "lucide-react";
import type { GatheringItem } from "@/lib/types";

export default async function GatheringPage() {
  const supabase = await createClient();

  const { data: items } = await supabase
    .from("gathering_items")
    .select("*")
    .order("category")
    .order("name");

  const gatheringItems: GatheringItem[] = items ?? [];

  const categories = [...new Set(gatheringItems.map((i) => i.category))];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Gathering Exclusives</h1>
        <p className="text-muted-foreground">Items primarily obtained from gathering</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Pickaxe className="h-5 w-5" />
            Should You Gather?
          </CardTitle>
          <CardDescription>
            Not required for combat progression. Most items can be purchased on the marketplace.
            Gathering becomes valuable mainly for lifeskill-focused players.
          </CardDescription>
        </CardHeader>
      </Card>

      {categories.map((category) => (
        <Card key={category}>
          <CardHeader>
            <CardTitle className="capitalize">{category}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Use</TableHead>
                  <TableHead>Why It Matters</TableHead>
                  <TableHead>Market</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {gatheringItems
                  .filter((i) => i.category === category)
                  .map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        {item.name}
                        {item.is_gathering_exclusive && (
                          <Badge variant="outline" className="ml-2 text-xs">Exclusive</Badge>
                        )}
                      </TableCell>
                      <TableCell>{item.use_description}</TableCell>
                      <TableCell className="text-muted-foreground">{item.why_it_matters}</TableCell>
                      <TableCell className="text-muted-foreground">{item.market_availability}</TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}

      {gatheringItems.length === 0 && (
        <p className="py-8 text-center text-muted-foreground">
          No gathering items loaded. Run the seed migration to populate reference data.
        </p>
      )}
    </div>
  );
}
